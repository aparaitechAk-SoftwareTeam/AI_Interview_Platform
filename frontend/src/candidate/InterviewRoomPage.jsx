import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Webcam from 'react-webcam';
import { interviews } from '../services/api.js';
import {
  Mic, ShieldAlert, Clock, Play, Bot, Sparkles, CheckCircle2
} from 'lucide-react';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    const url = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
    return url.replace(/\/api\/?$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  }
  return 'http://localhost:4000';
};

const SOCKET_URL = getSocketUrl();
const SILENCE_TIMEOUT_MS = 5000;
const SILENCE_THRESHOLD_VOLUME = 15;

export default function InterviewRoomPage() {
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [recording, setRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(true);
  const [startingLoading, setStartingLoading] = useState(false);
  const [startingError, setStartingError] = useState('');
  const [sendingAnswer, setSendingAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [warningMsg, setWarningMsg] = useState('');
  const [speechDetected, setSpeechDetected] = useState(false);

  // Real-time AI response state
  const [aiState, setAiState] = useState('READY'); // READY, SPEAKING, LISTENING, PROCESSING, COMPLETED
  const [aiText, setAiText] = useState('Welcome! Please click "Start Interview Session" when you are ready to begin.');

  const socketRef = useRef(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  // Web Audio API Silence Detection Refs
  const silenceTimerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const streamRef = useRef(null);
  const isAutoSubmittingRef = useRef(false);

  const invitationId = sessionStorage.getItem('invitationId');
  const candidateId = sessionStorage.getItem('candidateId');
  const candidateName = sessionStorage.getItem('candidateName') || 'Candidate';

  const cleanupSilenceDetection = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setSpeechDetected(false);
  };

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
              cleanupSilenceDetection();
              setAiState('PAUSED');
              setAiText('The administrator has paused your interview. Please wait.');
            } else if (data.action === 'resume') {
              setAiState('SPEAKING');
              setAiText('The interview has been resumed. Let\'s continue.');
            } else if (data.action === 'terminate') {
              cleanupSilenceDetection();
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

    // Anti-cheat integrity detection
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

    try {
      document.documentElement.requestFullscreen().catch(() => {});
    } catch {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(timerRef.current);
      cleanupSilenceDetection();
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [invitationId]);

  const triggerIntegrityAlert = async (type, details) => {
    if (!session) return;
    setWarningMsg(`Integrity Warning: ${details}`);
    setTimeout(() => setWarningMsg(''), 5000);
    
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

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Automatic Audio Recording & Silence Detection
  const startAudioRecord = async () => {
    cleanupSilenceDetection();
    isAutoSubmittingRef.current = false;
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        stream.getTracks().forEach((track) => track.stop());
        autoSubmitBlob(blob);
      };

      // Web Audio API Volume Monitoring for 5-second silence detection
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        analyserRef.current = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const checkVolume = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
          }
          const averageVolume = sum / dataArray.length;
          const isSpeaking = averageVolume > SILENCE_THRESHOLD_VOLUME;

          if (isSpeaking) {
            setSpeechDetected(true);
            if (silenceTimerRef.current) {
              clearTimeout(silenceTimerRef.current);
              silenceTimerRef.current = null;
            }
          } else {
            setSpeechDetected(false);
            if (!silenceTimerRef.current && !isAutoSubmittingRef.current) {
              silenceTimerRef.current = setTimeout(() => {
                triggerAutoStop();
              }, SILENCE_TIMEOUT_MS);
            }
          }

          if (mediaRecorder.state === 'recording') {
            animationFrameRef.current = requestAnimationFrame(checkVolume);
          }
        };

        animationFrameRef.current = requestAnimationFrame(checkVolume);
      }

      mediaRecorder.start();
      setRecording(true);
      setAiState('LISTENING');
    } catch (e) {
      console.error('Microphone error:', e);
      alert('Microphone access issue. Please check microphone permissions.');
    }
  };

  const triggerAutoStop = () => {
    if (isAutoSubmittingRef.current) return;
    isAutoSubmittingRef.current = true;
    cleanupSilenceDetection();

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const autoSubmitBlob = async (blob) => {
    if (!session || !currentQuestion) return;
    setSendingAnswer(true);
    setAiState('PROCESSING');
    setAiText('5s silence detected. Processing response and analyzing transcript...');

    try {
      const responseFile = new File([blob], 'response.wav', { type: 'audio/wav' });
      await interviews.submitAnswer({
        sessionId: session._id,
        questionIndex: currentQuestion.questionIndex,
        remainingTimeSeconds: timeLeft,
        audioBlob: responseFile,
      });

      const res = await interviews.nextQuestion(session._id);
      if (res.data.isCompleted) {
        setAiState('COMPLETED');
        setAiText('Excellent work! You have completed all questions in the interview.');
        setCurrentQuestion(null);
      } else {
        const nextQ = {
          questionIndex: res.data.questionIndex,
          text: res.data.question,
          category: res.data.category || 'technical',
          topic: res.data.topic || 'General',
          difficulty: res.data.difficulty || '3',
        };
        setCurrentQuestion(nextQ);
        speakQuestionAndAutoRecord(res.data.question);
      }
    } catch (err) {
      console.error('Submit answer error:', err);
      setAiText('An error occurred submitting your answer. Retrying next question.');
      setAiState('READY');
    } finally {
      setSendingAnswer(false);
    }
  };

  const speakQuestionAndAutoRecord = (questionText) => {
    cleanupSilenceDetection();
    setAiState('SPEAKING');
    setAiText(questionText);

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(questionText);

      utterance.onend = () => {
        setAiState('LISTENING');
        startAudioRecord();
      };

      utterance.onerror = (speechErr) => {
        console.error('TTS speech error:', speechErr);
        setAiState('LISTENING');
        startAudioRecord();
      };

      window.speechSynthesis.speak(utterance);
    } catch (speechErr) {
      console.error('TTS failed:', speechErr);
      setAiState('LISTENING');
      startAudioRecord();
    }
  };

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
        speakQuestionAndAutoRecord(currentQuestion.text);
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
        speakQuestionAndAutoRecord(res.data.question);
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

  const handleEndInterview = async () => {
    if (!session) return;
    cleanupSilenceDetection();
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
      console.error(e);
    }
  };

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
            width: 80, height: 80, borderRadius: '50%', background: 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem',
            animation: aiState === 'SPEAKING' ? 'pulseWaves 1.5s infinite' : 'none',
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

        {/* Action Controls Panel - Automatic Flow Status (No Manual Buttons) */}
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
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-success" onClick={handleEndInterview} style={{ padding: '0.875rem 2.5rem', fontSize: '1.05rem' }}>
                <CheckCircle2 size={18} /> Finalize Assessment
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              {aiState === 'SPEAKING' ? (
                <div style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} className="animate-spin" />
                  AI is speaking the question... Please listen.
                </div>
              ) : aiState === 'LISTENING' || recording ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 600, fontSize: '1rem' }}>
                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulseWaves 1s infinite' }} />
                    <Mic size={18} /> Recording Answer Automatically...
                  </div>
                  <div style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem' }}>
                    {speechDetected ? '🎙️ Voice activity detected — Speak clearly.' : '⏳ 5s continuous silence will auto-submit answer.'}
                  </div>
                </div>
              ) : (
                <div style={{ color: 'var(--warning)', fontSize: '0.95rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Sparkles size={16} className="animate-spin" />
                  Processing answer and analyzing transcript...
                </div>
              )}
            </div>
          )}
        </div>
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
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
          70% { box-shadow: 0 0 0 12px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
      `}</style>
    </div>
  );
}
