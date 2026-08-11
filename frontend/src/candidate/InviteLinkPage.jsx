import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { invitations } from '../services/api.js';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Loader, AlertCircle, ArrowRight } from 'lucide-react';

export default function InviteLinkPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        const res = await invitations.verifyLink(token);
        const invite = res.data.data;

        sessionStorage.setItem('invitationId', invite._id);
        sessionStorage.setItem('candidateId', invite.candidate._id);
        sessionStorage.setItem('candidateName', invite.candidate.name);
        sessionStorage.setItem('inviteCode', invite.code);
        sessionStorage.setItem('jobRoleName', invite.candidate.jobRole?.name || '');

        await invitations.activate({ invitationId: invite._id, deviceId: navigator.userAgent });

        navigate('/interview/dashboard');
      } catch (err) {
        setError(err.response?.data?.message || 'This invitation link is invalid or has expired.');
      } finally {
        setLoading(false);
      }
    };

    verify();
  }, [token]);

  return (
    <CandidateLayout>
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        {loading ? (
          <div style={{ textAlign: 'center' }}>
            <Loader size={48} color="var(--primary)" style={{ margin: '0 auto 1rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: 'var(--text-secondary)' }}>Verifying your invitation...</p>
          </div>
        ) : error ? (
          <div style={{ maxWidth: 480, textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--error-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
              <AlertCircle size={28} color="var(--error)" />
            </div>
            <h2 style={{ marginBottom: '0.75rem' }}>Invitation Invalid</h2>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: '1.5rem' }}>{error}</p>
            <button className="btn btn-secondary" onClick={() => navigate('/interview')}>
              Go to Manual Code Entry
            </button>
          </div>
        ) : null}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </CandidateLayout>
  );
}
