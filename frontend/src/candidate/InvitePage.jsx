import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { invitations } from '../services/api.js';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Bot, ArrowRight, Loader, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function InvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const justCompleted = searchParams.get('completed') === '1';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await invitations.verifyCode(code.trim().toUpperCase());
      const invite = res.data.data;
      
      // Store candidate info in session storage
      sessionStorage.setItem('invitationId', invite._id);
      sessionStorage.setItem('candidateId', invite.candidate._id);
      sessionStorage.setItem('candidateName', invite.candidate.name);
      sessionStorage.setItem('inviteCode', invite.code);
      sessionStorage.setItem('jobRoleName', invite.candidate.jobRole?.name || '');
      
      // Activate the invitation
      await invitations.activate({ invitationId: invite._id, deviceId: navigator.userAgent });
      
      navigate('/interview/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired invitation code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CandidateLayout>
      <div style={{
        minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
        background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.08) 0%, transparent 70%)',
      }}>
        <div style={{ width: '100%', maxWidth: 480 }}>
          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem',
              boxShadow: '0 8px 32px rgba(37,99,235,0.3)',
            }}>
              <Bot size={36} color="#fff" />
            </div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              AI Interview Portal
            </h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
              Enter your invitation code to begin your AI-powered interview.
            </p>
          </div>

          {/* Code Input Card */}
          <div className="card" style={{ padding: '2rem' }}>
            {justCompleted && !error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                background: 'var(--success-light)', border: '1px solid var(--success)',
                borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.25rem',
                color: 'var(--success)', fontSize: '0.875rem',
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>Your interview has been submitted successfully! Our team will review your responses and get back to you by email.</span>
              </div>
            )}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                background: 'var(--error-light)', border: '1px solid var(--error)',
                borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.25rem',
                color: 'var(--error)', fontSize: '0.875rem',
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleVerify}>
              <div className="form-group">
                <label className="form-label">Invitation Code</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="AIP-XXXX-XXXX"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  required
                  autoFocus
                  style={{
                    fontFamily: 'monospace', fontSize: '1.1rem', letterSpacing: '0.05em',
                    textAlign: 'center', textTransform: 'uppercase',
                  }}
                />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                  Code format: AIP-XXXX-XXXX (found in your invitation email)
                </p>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !code.trim()}
                style={{ width: '100%', padding: '0.875rem', fontSize: '1rem' }}
              >
                {loading ? (
                  <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Verifying...</>
                ) : (
                  <>Continue to Interview <ArrowRight size={18} /></>
                )}
              </button>
            </form>
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
            This interview is designed for desktop/laptop browsers only.
          </p>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </CandidateLayout>
  );
}
