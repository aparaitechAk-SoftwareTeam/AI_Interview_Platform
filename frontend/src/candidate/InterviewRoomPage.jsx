import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Webcam from 'react-webcam';
import { interviews } from '../services/api.js';
import {
  Mic, Square, Send, Monitor, AlertTriangle, ShieldAlert,
  Clock, Play, Pause, Bot, Camera, Sparkles, CheckCircle2, User
} from 'lucide-react';

const SOCKET_URL = 'http://localhost:4000';

export default function InterviewRoomPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(true);
  const [startingLoading, setStartingLoading] = useState(false);
  const [startingError, setStartingError] = useState('');
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warningMsg, setWarningMsg] = useState('');
  
  // Speech-to-text state
  const [liveTranscript, setLiveTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  
  // Real-time AI response state
  const [aiState, setAiState] = useState('READY'); // READY, SPEAKING, LISTENING, PROCESSING
  const [aiText, setAiText] = useState('Welcome! Please click "Start Interview Session" when you are ready to begin.');

  const socketRef = useRef(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  const recognitionRef = useRef(null);
  const listeningWanted = useRef(false);
  const silenceTimerRef = useRef(null);
  const autoSubmitPendingRef = useRef(false);
  const finalizationStartedRef = useRef(false);
  const isSubmittingRef = useRef(false);
  const isTtsPlayingRef = useRef(false);

  const invitationId = sessionStorage.getItem('invitationId');
  const candidateId = sessionStorage.getItem('candidateId');
  const candidateName = sessionStorage.getItem('candidateName') || 'Candidate';

  // 1. Initialize Interview Session & Integrity Watchers
  useEffect(() => {
    if (!invitationId) {
      navigate('/interview');
      return;
    }

    const init = async () => {
      try {
        const res = await interviews.start({ candidateId });
        const resData = res.data.data || res.data;
        const sessionData = resData.session;
        const checkpointData = resData.checkpoint;
        const questionData = resData.question;

        if (sessionData) {
          setSession(sessionData);
          
          if (resData.recovered) {
            if (checkpointData && typeof checkpointData.remainingTimeSeconds === 'number') {
              setTimeLeft(checkpointData.remainingTimeSeconds);
            } else {
              setTimeLeft((sessionData.duration || 5) * 60);
            }
            if (questionData) {
              setCurrentQuestion(questionData);
              setAiText(questionData.text);
              setAiState('READY');
            }
            setStarting(false);
          } else {
            setTimeLeft((sessionData.duration || 5) * 60);
            if (questionData) {
              setCurrentQuestion(questionData);
            }
          }

          const socket = io(SOCKET_URL, { transports: ['websocket'] });
          socketRef.current = socket;

          socket.on('connect', () => {
            socket.emit('join_interview_room', { interviewId: sessionData._id });
          });

          socket.on('emergency_control', (data) => {
            if (data.action === 'pause') {
              setAiState('PAUSED');
              setAiText('The administrator has paused your interview. Please wait.');
            } else if (data.action === 'resume') {
              setAiState('SPEAKING');
              setAiText('The interview has been resumed. Let\'s continue.');
            } else if (data.action === 'terminate') {
              setAiState('TERMINATED');
              setAiText('This interview has been terminated by the administrator.');
              alert('This interview was terminated by the administrator.');
              sessionStorage.clear();
              navigate('/interview', { replace: true });
            }
          });
        }
      } catch (err) {
        console.error('Interview init failed:', err);
        if (err.response && err.response.status === 404) {
          alert('Your interview session has expired or the server database restarted. Please re-enter your invitation code.');
          sessionStorage.clear();
          navigate('/interview');
        } else {
          setStartingError(err.response?.data?.message || 'Failed to initialize session. Please check if backend is running.');
        }
      } finally {
        setLoading(false);
      }
    };

    init();

    // 2. Anti-cheat integrity detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerIntegrityAlert('TAB_SWITCH', 'Candidate switched away from the active tab.');
      }
    };

    const handleWindowBlur = () => {
      triggerIntegrityAlert('FOCUS_LOST', 'Candidate focus moved outside the browser window.');
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        triggerIntegrityAlert('FULLSCREEN_EXIT', 'Candidate exited fullscreen mode.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // Request fullscreen immediately
    try {
      document.documentElement.requestFullscreen().catch(() => {});
    } catch {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(timerRef.current);
      if (socketRef.current) socketRef.current.disconnect();
      stopSpeech();
      speechSynthesis?.cancel();
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
    };
  }, [invitationId, stopSpeech]);

  // Trigger integrity alert on backend and emit real-time event
  const triggerIntegrityAlert = async (type, details) => {
    if (!session) return;
    setWarningMsg(`Integrity Warning: ${details}`);
    setTimeout(() => setWarningMsg(''), 5000);
    
    // Emit via socket for live dashboard
    if (socketRef.current) {
      socketRef.current.emit('candidate_integrity_alert', {
        interviewId: session._id,
        candidateName,
        alertType: type,
        details,
      });
    }

    try {
      await interviews.reportCheating({
        sessionId: session._id,
        type,
        details,
      });
    } catch (e) {
      console.error('Failed to log integrity event:', e);
    }
  };

  // Timer tick
  useEffect(() => {
    if (aiState !== 'PAUSED' && aiState !== 'TERMINATED' && !starting && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [aiState, starting, timeLeft]);

  // Format time (e.g. 29:59)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Speech-to-text controls
  const stopSpeech = useCallback(() => {
    listeningWanted.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.error('stopSpeech error:', err);
      }
    }
    setListening(false);
  }, []);

  const resetSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      console.log('[Silence Detector] 5 seconds of silence, auto-submitting...');
      autoSubmitAnswer();
    }, 5000);
  }, []);

  const autoSubmitAnswer = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      autoSubmitPendingRef.current = true;
      mediaRecorderRef.current.stop();
    } else {
      console.warn('[Silence Detector] MediaRecorder not active on silence timeout, submitting empty answer.');
      const dummyBlob = new Blob([], { type: 'audio/wav' });
      performSubmitAnswer(dummyBlob, '');
    }
  };

  async function performSubmitAnswer(blobToSubmit, transcriptText) {
    if (isSubmittingRef.current || !session || !currentQuestion) return;
    isSubmittingRef.current = true;

    // Clear silence timer immediately
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    // Stop speech recognition during submission
    stopSpeech();

    setSendingAnswer(true);
    setAiState('PROCESSING');
    setAiText('Processing response and analyzing transcript...');
    const idempotencyKey = crypto.randomUUID();

    try {
      const responseFile = new File([blobToSubmit], 'response.wav', { type: 'audio/wav' });
      await interviews.submitAnswer({
        sessionId: session._id,
        questionIndex: currentQuestion.questionIndex,
        remainingTimeSeconds: timeLeft,
        audioBlob: responseFile,
        idempotencyKey,
      });

      // Reset transcripts
      setLiveTranscript('');
      setInterimTranscript('');

      // Get next question
      const res = await interviews.nextQuestion(session._id);
      if (res.data.isCompleted) {
        setAiState('COMPLETED');
        setAiText('Excellent work! You have completed all questions in the interview.');
        setCurrentQuestion(null);
        await handleEndInterview();
      } else {
        const nextQ = {
          questionIndex: res.data.questionIndex,
          text: res.data.question,
          category: res.data.category || 'technical',
          topic: res.data.topic || 'General',
          difficulty: res.data.difficulty || '3',
        };
        setCurrentQuestion(nextQ);
        playQuestionSpeech(res.data.question);
      }
      setAudioBlob(null);
      setAudioUrl(null);
    } catch (err) {
      console.error('Submit answer error:', err);
      setAiText('An error occurred submitting your answer. Let\'s retry.');
      setAiState('READY');
    } finally {
      isSubmittingRef.current = false;
      setSendingAnswer(false);
    }
  }

  const startSpeech = useCallback(() => {
    if (isTtsPlayingRef.current) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      console.warn('Live speech recognition not supported in this browser.');
      return;
    }

    if (!recognitionRef.current) {
      const r = new Recognition();
      r.continuous = true;
      r.interimResults = true;
      r.lang = 'en-IN';
      r.onresult = (event) => {
        if (isTtsPlayingRef.current) return;

        let finalText = '';
        let interimText = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += text;
          else interimText += text;
        }
        if (finalText) setLiveTranscript(prev => `${prev} ${finalText}`.trim());
        setInterimTranscript(interimText);

        // Reset silence timer on speech detection
        resetSilenceTimer();
      };
      r.onerror = (event) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error:', event.error);
        }
      };
      r.onend = () => {
        setListening(false);
        if (listeningWanted.current && !isTtsPlayingRef.current) {
          setTimeout(() => {
            try {
              if (listeningWanted.current && !isTtsPlayingRef.current) {
                r.start();
                setListening(true);
              }
            } catch {}
          }, 350);
        }
      };
      recognitionRef.current = r;
    }

    listeningWanted.current = true;
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch {}
  }, [resetSilenceTimer]);

  const startAudioRecord = async () => {
    isTtsPlayingRef.current = false;
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        // Stop audio tracks
        stream.getTracks().forEach(track => track.stop());

        if (autoSubmitPendingRef.current) {
          autoSubmitPendingRef.current = false;
          const combinedTranscript = [liveTranscript, interimTranscript].filter(Boolean).join(' ').trim();
          performSubmitAnswer(blob, combinedTranscript);
        }
      };
      mediaRecorderRef.current.start();
      setRecording(true);
      setAiState('LISTENING');

      // Clear transcripts
      setLiveTranscript('');
      setInterimTranscript('');
      
      // Start live transcription
      startSpeech();

      // Start silence timer
      resetSilenceTimer();
    } catch (e) {
      alert('Microphone access issue. Please enable mic permissions.');
    }
  };

  const stopAudioRecord = () => {
    if (mediaRecorderRef.current && recording) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setRecording(false);
      setAiState('READY');
    }
  };

  const playQuestionSpeech = (text) => {
    isTtsPlayingRef.current = true;
    stopSpeech();
    setAiState('SPEAKING');
    setAiText(text);

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      utterance.onend = () => {
        isTtsPlayingRef.current = false;
        setAiState('READY');
        
        // Start candidate recording ONLY after the AI speech has completely finished!
        startAudioRecord();
      };

      utterance.onerror = (err) => {
        console.error('SpeechSynthesis error:', err);
        isTtsPlayingRef.current = false;
        setAiState('READY');
        startAudioRecord();
      };

      window.speechSynthesis.speak(utterance);
    } catch (speechErr) {
      console.error('TTS failed:', speechErr);
      isTtsPlayingRef.current = false;
      setAiState('READY');
      startAudioRecord();
    }
  };

  // Begin interview flow
  const handleStartInterview = async () => {
    if (!session) return;
    setStartingLoading(true);
    setStartingError('');
    setAiState('PROCESSING');
    setAiText('Configuring environment and fetching initial question...');
    try {
      try {
        document.documentElement.requestFullscreen().catch(() => {});
      } catch {}

      if (currentQuestion) {
        setStarting(false);
        playQuestionSpeech(currentQuestion.text);
      } else {
        const res = await interviews.nextQuestion(session._id);
        const firstQuestion = {
          questionIndex: res.data.questionIndex,
          text: res.data.question,
          category: res.data.category || 'technical',
          topic: res.data.topic || 'General',
          difficulty: res.data.difficulty || '3',
        };
        setCurrentQuestion(firstQuestion);
        setStarting(false);
        playQuestionSpeech(res.data.question);
      }
    } catch (err) {
      console.error(err);
      setStartingError('Failed to start interview session. Please retry.');
      setAiText('Failed to start interview. Please retry.');
      setAiState('READY');
    } finally {
      setStartingLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (audioBlob) {
      const combinedTranscript = [liveTranscript, interimTranscript].filter(Boolean).join(' ').trim();
      await performSubmitAnswer(audioBlob, combinedTranscript);
    }
  };

  async function handleEndInterview() {
    if (!session || finalizationStartedRef.current) return;
    finalizationStartedRef.current = true;
    stopSpeech();
    speechSynthesis?.cancel();

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    try {
      await interviews.complete(session._id);
      setAiState('COMPLETED');
      setAiText('Interview finished successfully. Your responses are being evaluated.');
      setTimeout(() => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        sessionStorage.clear();
        navigate('/interview?completed=1', { replace: true });
      }, 5000);
    } catch (e) {
      console.error('Error during finalization:', e);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      sessionStorage.clear();
      navigate('/interview?completed=1', { replace: true });
    }
  }

  const aiColors = {
    READY: 'var(--text-secondary)',
    SPEAKING: 'var(--primary)',
    LISTENING: 'var(--success)',
    PROCESSING: 'var(--warning)',
    PAUSED: 'var(--warning)',
    TERMINATED: 'var(--error)',
    COMPLETED: 'var(--success)',
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-tertiary)' }}>Loading interview environment...</div>;

  return (
    <div style={{
      minHeight: '100vh', background: '#0a0a0c', color: '#fff',
      display: 'grid', gridTemplateColumns: '1fr 320px', overflow: 'hidden',
    }}>
      
      {/* Integrity banner */}
      {warningMsg && (
        <div style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.95)', color: '#fff', padding: '0.875rem 1.5rem',
          borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.75rem', zIndex: 999,
          boxShadow: '0 8px 32px rgba(239,68,68,0.4)', border: '1px solid #f87171',
        }}>
          <ShieldAlert size={20} />
          <span style={{ fontWeight: 600 }}>{warningMsg}</span>
        </div>
      )}

      {/* Main Interview Area */}
      <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem', background: '#222', borderRadius: 4 }}>
              Session Live
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f87171', fontWeight: 700, fontSize: '1.25rem', fontFamily: 'monospace' }}>
            <Clock size={20} />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* AI Box / Waves */}
        <div className="card" style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', background: '#121216',
          border: '1px solid #1f1f28', borderRadius: 20, padding: '3rem', marginBottom: '1.5rem',
          position: 'relative',
        }}>
          
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: `linear-gradient(135deg, ${aiColors[aiState]}, #7c3aed)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${aiColors[aiState]}40`,
            marginBottom: '2rem',
            animation: aiState === 'SPEAKING' || aiState === 'LISTENING' ? 'pulseWaves 1.5s infinite' : 'none',
          }}>
            <Bot size={36} color="#fff" />
          </div>

          <h2 style={{
            color: aiColors[aiState], fontSize: '0.85rem', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem',
          }}>
            AI Interviewer — {aiState}
          </h2>

          <p style={{
            maxWidth: 600, textAlign: 'center', fontSize: '1.25rem', lineHeight: '1.6',
            color: '#e4e4e7', fontFamily: 'var(--font-display)', fontWeight: 500,
          }}>
            "{aiText}"
          </p>
        </div>

        {/* Action Controls */}
        <div className="card" style={{ background: '#121216', border: '1px solid #1f1f28', padding: '1.5rem 2rem' }}>
          {starting ? (
            <div style={{ textAlign: 'center' }}>
              {startingError && (
                <div style={{ color: 'var(--error)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                  ⚠️ {startingError}
                </div>
              )}
              <button 
                className="btn btn-primary" 
                onClick={handleStartInterview} 
                disabled={startingLoading || !session}
                style={{ padding: '0.875rem 2.5rem', fontSize: '1.05rem' }}
              >
                {startingLoading ? 'Starting...' : <><Play size={18} style={{ marginRight: '0.5rem' }} /> Start Interview Session</>}
              </button>
            </div>
          ) : aiState === 'COMPLETED' ? (
            <div style={{ textAlign: 'center', padding: '1.25rem', background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid var(--success)', color: 'var(--success)' }}>
              <Loader size={20} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} />
              <strong>Finalizing Assessment... Please do not close this window.</strong>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {!recording && !audioUrl ? (
                // Only show Record Answer if session is STARTED/RECOVERING, question is loaded, and AI is done speaking
                (session?.status === 'STARTED' || session?.status === 'RECOVERING') && currentQuestion && aiState !== 'SPEAKING' && aiState !== 'PROCESSING' ? (
                  <button className="btn btn-primary" disabled style={{ flex: 1, padding: '0.875rem', opacity: 0.8, cursor: 'not-allowed' }}>
                    <Mic size={18} style={{ marginRight: '0.5rem' }} /> Listening for your answer...
                  </button>
                ) : (aiState === 'SPEAKING' || aiState === 'PROCESSING') ? (
                  <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.95rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <Sparkles size={16} className="animate-spin" />
                    {aiState === 'SPEAKING' ? 'AI is speaking the question... Please listen.' : 'AI is processing response... Please wait.'}
                  </div>
                ) : null
              ) : recording ? (
                <button className="btn btn-danger" disabled style={{ flex: 1, padding: '0.875rem', opacity: 0.8, cursor: 'not-allowed' }}>
                  <Square size={18} style={{ marginRight: '0.5rem' }} /> Recording Answer... (Silence Detection Active)
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
                  <div style={{ flex: 1, background: 'rgba(37,99,235,0.1)', border: '1px solid var(--primary)', borderRadius: 8, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                    <Loader size={16} className="animate-spin" style={{ marginRight: '0.5rem' }} />
                    Auto-submitting answer...
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Speech-to-Text Transcript */}
        {!starting && aiState !== 'COMPLETED' && (
          <div style={{ marginTop: '1rem', borderTop: '1px solid #1f1f28', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {listening ? '🔴 Live Transcript (Listening...)' : 'Live Transcript'}
              </span>
              <button
                onClick={listening ? stopSpeech : startSpeech}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.3rem',
                  padding: '0.3rem 0.7rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                  border: `1px solid ${listening ? '#ef4444' : '#374151'}`,
                  background: listening ? 'rgba(239,68,68,0.1)' : 'transparent',
                  color: listening ? '#ef4444' : '#9ca3af', cursor: 'pointer',
                }}
              >
                {listening ? 'Pause Transcript' : 'Resume Transcript'}
              </button>
            </div>
            <div style={{
              background: '#070709', border: '1px solid #17171f', borderRadius: 8,
              padding: '0.875rem 1rem', minHeight: 60, fontSize: '0.9rem', color: '#e4e4e7',
              lineHeight: '1.5',
            }}>
              {liveTranscript || interimTranscript ? (
                <>
                  <span>{liveTranscript}</span>
                  {interimTranscript && (
                    <span style={{ color: '#8b5cf6', fontStyle: 'italic' }}> {interimTranscript}</span>
                  )}
                </>
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>Silence or waiting for you to speak...</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Camera & Video Monitor */}
      <div style={{
        background: '#0e0e11', borderLeft: '1px solid #1f1f28',
        display: 'flex', flexDirection: 'column', height: '100vh',
      }}>
        {/* Camera block */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #1f1f28' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.75rem', fontWeight: 600 }}>
            Proctoring Camera Feed
          </p>
          <div style={{ borderRadius: 12, overflow: 'hidden', background: '#000', aspectRatio: '4/3', border: '1px solid #222' }}>
            <Webcam
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              videoConstraints={{ facingMode: 'user', width: 320, height: 240 }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', color: '#10b981', fontSize: '0.8rem', fontWeight: 500 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Active Proctoring Face Check
          </div>
        </div>

        {/* Integrity Log */}
        <div style={{ padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '1rem', fontWeight: 600 }}>
            System Integrity Log
          </p>
          <div style={{
            flex: 1, background: '#070709', border: '1px solid #17171f', borderRadius: 10,
            padding: '1rem', overflowY: 'auto', fontSize: '0.8rem', color: 'var(--text-secondary)',
          }}>
            <div style={{ marginBottom: '0.5rem', color: '#a1a1aa' }}>
              [{new Date().toLocaleTimeString()}] Room initiated
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#a1a1aa' }}>
              [{new Date().toLocaleTimeString()}] Camera linked
            </div>
            <div style={{ marginBottom: '0.5rem', color: '#a1a1aa' }}>
              [{new Date().toLocaleTimeString()}] Proctoring enabled
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulseWaves {
          0% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(37, 99, 235, 0); }
          100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
        }
      `}</style>
    </div>
  );
}
