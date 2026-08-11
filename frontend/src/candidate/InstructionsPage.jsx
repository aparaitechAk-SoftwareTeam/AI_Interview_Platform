import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Info, ShieldAlert, Monitor, Sparkles, Check, ArrowRight } from 'lucide-react';

export default function InstructionsPage() {
  const navigate = useNavigate();
  const [consent, setConsent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleStart = () => {
    sessionStorage.setItem('consentGiven', 'true');
    navigate('/interview/dashboard');
  };

  const jobRole = sessionStorage.getItem('jobRoleName') || 'Assessment';

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Interview Instructions</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Please read these rules carefully before commencing the interview.
          </p>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Info */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}>
              <Sparkles size={18} color="var(--primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>Interactive AI Agent</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                You will engage in a conversation with our AI interviewer. The agent will ask questions, listen to your spoken answers, and response dynamically.
              </p>
            </div>
          </div>

          {/* Integrity Shield */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}>
              <ShieldAlert size={18} color="var(--error)" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--error)', marginBottom: '0.25rem' }}>Integrity & Anti-Cheat Monitoring</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                This platform monitors cheating behaviors in real-time. Action will be flagged if you leave fullscreen mode, switch tabs, or use external devices.
              </p>
            </div>
          </div>

          {/* Device Instructions */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(6, 182, 212, 0.1)', display: 'flex', alignItems: 'center', justify: 'center', flexShrink: 0 }}>
              <Monitor size={18} color="#06b6d4" />
            </div>
            <div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.25rem' }}>Environment Requirements</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)' }}>
                Sit in a well-lit, quiet room. Ensure your camera clearly captures your face and your microphone registers your voice correctly.
              </p>
            </div>
          </div>

          {/* Acknowledge Form */}
          <div style={{
            background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 12,
            border: '1px solid var(--border-primary)', marginTop: '0.5rem',
          }}>
            <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', userSelect: 'none' }}>
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                style={{ marginTop: '0.15rem' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                I understand and agree to the anti-cheating guidelines, fullscreen requirements, and real-time facial and audio monitoring for {jobRole} interview.
              </span>
            </label>
          </div>

          <button
            className="btn btn-primary"
            disabled={!consent || loading}
            onClick={handleStart}
            style={{ width: '100%', padding: '0.875rem', fontSize: '1rem', marginTop: '0.5rem' }}
          >
            I Agree, Continue <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </CandidateLayout>
  );
}
