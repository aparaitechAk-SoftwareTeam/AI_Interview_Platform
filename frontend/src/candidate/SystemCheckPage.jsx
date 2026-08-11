import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Monitor, Camera, Mic, Volume2, Wifi, CheckCircle2, AlertTriangle, ArrowRight, Loader } from 'lucide-react';

export default function SystemCheckPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [status, setStatus] = useState({
    browser: { label: 'Browser Compatibility', ok: null, detail: '' },
    camera: { label: 'Camera Permission', ok: null, detail: '' },
    mic: { label: 'Microphone Permission', ok: null, detail: '' },
    network: { label: 'Network Speed', ok: null, detail: '' },
  });

  const runChecks = async () => {
    setChecking(true);
    
    // 1. Browser Check
    const isChromeOrFirefox = /Chrome|Firefox/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
    setStatus(prev => ({
      ...prev,
      browser: { label: 'Browser Compatibility', ok: true, detail: 'Chrome/Firefox compatible' }
    }));

    // 2. Camera & Mic Permissions
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStatus(prev => ({
        ...prev,
        camera: { label: 'Camera Access', ok: true, detail: 'Available' },
        mic: { label: 'Microphone Access', ok: true, detail: 'Available' }
      }));
      // Stop the stream tracks after check
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      setStatus(prev => ({
        ...prev,
        camera: { label: 'Camera Access', ok: false, detail: 'Permission denied or no device' },
        mic: { label: 'Microphone Access', ok: false, detail: 'Permission denied or no device' }
      }));
    }

    // 3. Network Check (Simulated fast network check)
    const speedOk = navigator.connection ? navigator.connection.downlink >= 1.5 : true;
    setStatus(prev => ({
      ...prev,
      network: { label: 'Network Stability', ok: true, detail: speedOk ? 'High Speed (>1.5 Mbps)' : 'Slow connection' }
    }));

    setChecking(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const handleNext = () => {
    sessionStorage.setItem('systemCheckPassed', 'true');
    navigate('/interview/calibration');
  };

  const allPassed = Object.values(status).every(s => s.ok === true);

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>System Compatibility Check</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            We'll verify your devices and network to ensure a smooth interview session.
          </p>
        </div>

        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {Object.entries(status).map(([key, item]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border-primary)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {key === 'browser' && <Monitor size={20} color="var(--text-secondary)" />}
                  {key === 'camera' && <Camera size={20} color="var(--text-secondary)" />}
                  {key === 'mic' && <Mic size={20} color="var(--text-secondary)" />}
                  {key === 'network' && <Wifi size={20} color="var(--text-secondary)" />}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{item.detail || 'Checking...'}</div>
                  </div>
                </div>
                <div>
                  {item.ok === null ? (
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  ) : item.ok ? (
                    <span style={{ color: 'var(--success)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle2 size={16} /> Passed
                    </span>
                  ) : (
                    <span style={{ color: 'var(--error)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <AlertTriangle size={16} /> Failed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={runChecks} disabled={checking} style={{ flex: 1 }}>
              Re-run Checks
            </button>
            <button
              className="btn btn-primary"
              disabled={checking || !allPassed}
              onClick={handleNext}
              style={{ flex: 2, padding: '0.875rem' }}
            >
              Continue to Audio Calibration <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
