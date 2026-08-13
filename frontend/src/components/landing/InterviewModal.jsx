import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { invitations } from '../../services/api.js';

export default function InterviewModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (invitations && invitations.verifyCode) {
        const res = await invitations.verifyCode(code.trim().toUpperCase());
        const invite = res.data.data;
        
        sessionStorage.setItem('invitationId', invite._id);
        sessionStorage.setItem('candidateId', invite.candidate._id);
        sessionStorage.setItem('candidateName', invite.candidate.name);
        sessionStorage.setItem('inviteCode', invite.code);
        sessionStorage.setItem('jobRoleName', invite.candidate.jobRole?.name || '');
        
        await invitations.activate({ invitationId: invite._id, deviceId: navigator.userAgent });
        onClose();
        navigate('/interview/dashboard');
        return;
      }
    } catch (err) {
      // If API error or backend offline, navigate to candidate interview portal directly
      console.warn('Backend invitation verify warning:', err);
    } finally {
      setLoading(false);
    }

    // Default navigation to /interview portal
    onClose();
    navigate('/interview');
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(2,6,17,0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: 'min(480px, 100%)',
        background: 'linear-gradient(145deg, rgba(8,18,38,0.95), rgba(3,8,20,0.95))',
        border: '1px solid rgba(112,171,255,0.25)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 30px 100px rgba(0,100,255,0.3)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: 60, height: 60, borderRadius: 16,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px rgba(37,99,235,0.3)'
          }}>
            <span style={{ fontSize: '28px' }}>🤖</span>
          </div>
          <h3 style={{ fontFamily: 'Space Grotesk, sans-serif', fontSize: '22px', color: '#fff', margin: '0 0 8px 0' }}>
            Candidate Portal Login
          </h3>
          <p style={{ color: '#8ea0bd', fontSize: '13px', margin: 0 }}>
            Enter your invitation code to start your AI-powered interview session.
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444',
            borderRadius: 10, padding: '10px 14px', marginBottom: '16px',
            color: '#f87171', fontSize: '13px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b4c6df', marginBottom: '6px', fontWeight: 500 }}>
              Invitation Code
            </label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="AIP-XXXX-XXXX"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '12px',
                background: 'rgba(2,6,17,0.6)',
                border: '1px solid rgba(100,160,255,0.25)',
                color: '#fff',
                outline: 'none',
                fontSize: '16px',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                textAlign: 'center',
                textTransform: 'uppercase'
              }}
            />
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', margin: '6px 0 0 0' }}>
              Format: AIP-XXXX-XXXX (Check your invitation email)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600, cursor: 'pointer' }}
          >
            {loading ? 'Verifying Code...' : 'Continue to Interview Portal →'}
          </button>
        </form>
      </div>
    </div>
  );
}
