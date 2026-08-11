import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Mic, Square, Play, RefreshCw, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CalibrationPage() {
  const navigate = useNavigate();
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [level, setLevel] = useState(0);
  const [calibrated, setCalibrated] = useState(false);
  const [error, setError] = useState('');
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const requestRef = useRef(null);

  const startRecording = async () => {
    setError('');
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      // Setup audio analyzer for volume level feedback
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        setLevel(Math.round((average / 255) * 100));
        requestRef.current = requestAnimationFrame(checkVolume);
      };
      
      checkVolume();

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        setCalibrated(true);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        if (audioContextRef.current) audioContextRef.current.close();
        cancelAnimationFrame(requestRef.current);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setError('Could not access microphone. Please verify permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleNext = () => {
    sessionStorage.setItem('calibrationDone', 'true');
    navigate('/interview/instructions');
  };

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Audio Calibration</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Speak into your microphone to calibrate and preview your voice audio quality.
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.25rem', color: 'var(--error)', fontSize: '0.875rem' }}>
            <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.5rem' }} />
            {error}
          </div>
        )}

        <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
          {!recording && !audioUrl ? (
            <div>
              <Mic size={48} color="var(--primary)" style={{ margin: '0 auto 1.5rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Test Microphone</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Click record below and read this sentence aloud:<br />
                <strong>"My system is configured correctly and my microphone is active."</strong>
              </p>
              <button className="btn btn-primary" onClick={startRecording} style={{ width: '100%', padding: '0.875rem' }}>
                Start Recording
              </button>
            </div>
          ) : recording ? (
            <div>
              <div style={{
                width: 72, height: 72, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem',
                border: '2px solid var(--error)',
              }}>
                <Square size={24} color="var(--error)" />
              </div>
              <h3 style={{ marginBottom: '0.5rem' }}>Recording...</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Please speak now.
              </p>

              {/* Volume Visualizer */}
              <div style={{ height: 12, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden', width: '100%', maxWidth: 300, margin: '0 auto 2rem' }}>
                <div style={{ width: `${level}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.05s ease' }} />
              </div>

              <button className="btn btn-danger" onClick={stopRecording} style={{ width: '100%', padding: '0.875rem' }}>
                Stop Recording
              </button>
            </div>
          ) : (
            <div>
              <CheckCircle2 size={48} color="var(--success)" style={{ margin: '0 auto 1.5rem' }} />
              <h3 style={{ marginBottom: '0.5rem' }}>Audio Calibrated!</h3>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Listen to your recorded sample to ensure your voice is crisp and clear.
              </p>
              
              <audio src={audioUrl} controls style={{ width: '100%', marginBottom: '1.5rem' }} />

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-secondary" onClick={() => { setAudioUrl(null); setCalibrated(false); }} style={{ flex: 1 }}>
                  <RefreshCw size={16} /> Record Again
                </button>
                <button className="btn btn-primary" onClick={handleNext} style={{ flex: 2, padding: '0.875rem' }}>
                  Continue to Instructions <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateLayout>
  );
}
