import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { candidates, reports, results } from '../services/api.js';
import {
  ArrowLeft, Copy, Mail, Clock, RefreshCw, CheckCircle, Video, MessageSquare,
  AlertTriangle, User, FileText, Star, BarChart2, Eye, PlayCircle, KeyRound
} from 'lucide-react';

export default function CandidateDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);
  const [deciding, setDeciding] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [actionMsg, setActionMsg] = useState('');
  const [retryingWhatsApp, setRetryingWhatsApp] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await candidates.get(id);
      setData(res.data.data);
      setInvitation(res.data.invitation);
      setSession(res.data.session);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, [id]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await candidates.addNote(id, note);
      setNote('');
      fetch();
    } catch (e) {} finally { setAddingNote(false); }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setActionMsg('Copied to clipboard!');
    setTimeout(() => setActionMsg(''), 2000);
  };

  const handleDecide = async (decision) => {
    if (!session) return;
    setDeciding(true);
    try {
      await results.decide({ sessionId: session._id, decision });
      setActionMsg(`Decision set to: ${decision}`);
      fetch();
    } catch (e) { setActionMsg('Failed to update decision'); }
    finally { setDeciding(false); setTimeout(() => setActionMsg(''), 3000); }
  };

  const handleRelease = async () => {
    if (!session) return;
    setReleasing(true);
    try {
      await results.release({ sessionId: session._id });
      setActionMsg('Result released to candidate!');
      fetch();
    } catch (e) { setActionMsg('Failed to release result'); }
    finally { setReleasing(false); setTimeout(() => setActionMsg(''), 3000); }
  };

  const handleRegenerateCode = async () => {
    if (!window.confirm('Generate a new invitation code for this candidate? The old code will stop working immediately, and the new code will be emailed to them automatically.')) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await candidates.regenerateCode(id, 'Admin regenerated code from candidate detail page');
      setActionMsg(`New code generated: ${res.data.data.code} (emailed to candidate)`);
      fetch();
    } catch (e) {
      setActionMsg('Failed to regenerate invitation code');
    } finally {
      setRegenerating(false);
      setTimeout(() => setActionMsg(''), 4000);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>Loading candidate...</div>;
  }
  if (!data) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--error)' }}>Candidate not found.</div>;
  }

  const inviteLink = invitation?.linkToken
    ? `${window.location.origin}/interview/invite/${invitation.linkToken}`
    : null;

  const scoreColors = { technical: '#2563eb', resume: '#7c3aed', communication: '#10b981', hr: '#f59e0b', problemSolving: '#ef4444', aptitude: '#06b6d4' };

  const handleRetryWhatsApp = async () => {
    setRetryingWhatsApp(true);
    try {
      const res = await candidates.retryWhatsApp(id);
      if (res.data.success) {
        alert(res.data.message || 'WhatsApp invitation sent successfully!');
      } else {
        alert(res.data.message || 'WhatsApp configuration required or delivery failed.');
      }
      fetch();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send WhatsApp message');
    } finally {
      setRetryingWhatsApp(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <Link to="/admin/candidates" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem' }}>
          <ArrowLeft size={16} /> Candidates
        </Link>
        <span style={{ color: 'var(--text-tertiary)' }}>/</span>
        <span style={{ fontWeight: 600 }}>{data.name}</span>
      </div>

      {actionMsg && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--success)', fontSize: '0.875rem' }}>
          ✓ {actionMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Profile Card */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '1.5rem',
              }}>{data.name?.[0]}</div>
              <div>
                <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{data.name}</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>{data.email}</p>
                {data.mobile && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>{data.mobile}</p>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
              {[
                { label: 'Job Role', value: data.jobRole?.name || '—' },
                { label: 'Experience', value: data.experienceLevel },
                { label: 'College', value: data.college || '—' },
                { label: 'Status', value: data.status },
                { label: 'Pipeline', value: data.pipelineStage },
                { label: 'Duration', value: `${data.duration || 5} min` },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>{label}</p>
                  <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Resume */}
          {data.resume?.parsed && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FileText size={16} /> Resume Analysis
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Skills</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {data.resume.parsed.skills?.map((s) => (
                      <span key={s} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 500 }}>{s}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Technologies</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                    {data.resume.parsed.technologies?.map((t) => (
                      <span key={t} style={{ background: 'rgba(139,92,246,0.1)', color: '#7c3aed', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interview Scores */}
          {session && session.scores?.overall > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BarChart2 size={16} /> Interview Results
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.25rem' }}>
                {Object.entries(session.scores || {}).filter(([k]) => k !== 'overall').map(([key, value]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: scoreColors[key] || 'var(--primary)' }}>{value ?? '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>{key}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                <span style={{ fontWeight: 600 }}>Overall Score</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)' }}>{session.scores.overall}/100</span>
              </div>
              {session.report?.recommendation && (
                <div style={{ marginTop: '0.75rem', padding: '0.75rem 1rem', background: 'var(--success-light)', borderRadius: 8, color: 'var(--success)', fontWeight: 600, fontSize: '0.875rem' }}>
                  AI Recommendation: {session.report.recommendation}
                </div>
              )}

              {/* Decision Buttons */}
              {!session.resultReleased && session.status === 'COMPLETED' && (
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => handleDecide('APPROVED')} disabled={deciding}>
                    <CheckCircle size={15} /> Approve
                  </button>
                  <button className="btn btn-secondary" onClick={() => handleDecide('HOLD')} disabled={deciding}>
                    Hold
                  </button>
                  <button className="btn btn-danger" onClick={() => handleDecide('REJECTED')} disabled={deciding}>
                    Reject
                  </button>
                  <button className="btn btn-secondary" onClick={handleRelease} disabled={releasing} style={{ marginLeft: 'auto' }}>
                    <Eye size={15} /> Release Result
                  </button>
                </div>
              )}
              {session.resultReleased && (
                <div style={{ marginTop: '0.75rem', color: 'var(--success)', fontWeight: 600, fontSize: '0.85rem' }}>
                  ✓ Result has been released to the candidate.
                </div>
              )}
            </div>
          )}

          {/* Proctoring Video Recording Stream Player */}
          {session && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Video size={16} color="var(--primary)" /> Proctoring Video Recording
              </h3>
              <div style={{ background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: '0.75rem', aspectRatio: '16/9' }}>
                <video
                  controls
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  src={`${import.meta.env.VITE_API_URL || 'http://localhost:4000/api'}/interviews/${session._id}/recording`}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                <span>Proctoring Stream: <strong style={{ color: 'var(--success)' }}>Active / Ready</strong></span>
                <button
                  className="btn btn-secondary"
                  style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--error)' }}
                  onClick={async () => {
                    if (window.confirm('Delete proctoring recording for this interview session?')) {
                      try {
                        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
                        const token = localStorage.getItem('adminToken');
                        await fetch(`${API_BASE}/interviews/${session._id}/recording`, {
                          method: 'DELETE',
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        alert('Recording deleted successfully.');
                        fetch();
                      } catch (e) { alert('Failed to delete recording.'); }
                    }
                  }}
                >
                  Delete Video
                </button>
              </div>
            </div>
          )}

          {/* Admin Notes */}
          <div className="card">
            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Admin Notes</h3>
            <textarea
              className="form-textarea"
              placeholder="Add a private note about this candidate..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              style={{ marginBottom: '0.75rem' }}
            />
            <button className="btn btn-primary" onClick={handleAddNote} disabled={addingNote || !note.trim()}>
              {addingNote ? 'Saving...' : 'Add Note'}
            </button>

            {data.notes?.length > 0 && (
              <div style={{ marginTop: '1.25rem' }}>
                {data.notes.map((n, i) => (
                  <div key={i} style={{ padding: '0.875rem', background: 'var(--bg-tertiary)', borderRadius: 8, marginBottom: '0.5rem' }}>
                    <p style={{ fontSize: '0.875rem' }}>{n.text || n}</p>
                    {n.admin && <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>— {n.admin.name}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Invitation Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {invitation ? (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} /> Invitation
              </h3>
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Invitation Code</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <code style={{
                    fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700,
                    background: 'var(--bg-tertiary)', padding: '0.5rem 0.875rem', borderRadius: 8,
                    color: 'var(--text-primary)', flex: 1,
                  }}>{invitation.code}</code>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => copyToClipboard(invitation.code)}>
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              {inviteLink && (
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>Secure Link</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input className="form-input" value={inviteLink} readOnly style={{ fontSize: '0.75rem' }} />
                    <button className="btn btn-secondary" style={{ padding: '0.5rem' }} onClick={() => copyToClipboard(inviteLink)}>
                      <Copy size={14} />
                    </button>
                  </div>
                </div>
              )}

              <div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Status</p>
                <span className="badge badge-info">{invitation.status}</span>
              </div>
              {invitation.expiresAt && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.75rem' }}>
                  Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                </p>
              )}
              {invitation.reissueCount > 0 && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                  Reissued {invitation.reissueCount} time{invitation.reissueCount > 1 ? 's' : ''}
                </p>
              )}
              {['ACTIVATED', 'STARTED'].includes(invitation.status) && (
                <p style={{ fontSize: '0.75rem', color: 'var(--warning)', marginTop: '0.5rem' }}>
                  This code has already been used and is now locked (single-use).
                </p>
              )}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleRegenerateCode}
                  disabled={regenerating}
                  style={{ flex: 1, fontSize: '0.85rem' }}
                >
                  <KeyRound size={14} /> {regenerating ? 'Generating...' : 'Regenerate Code'}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleRetryWhatsApp}
                  disabled={retryingWhatsApp}
                  style={{ flex: 1, fontSize: '0.85rem', color: '#16a34a' }}
                >
                  <MessageSquare size={14} /> {retryingWhatsApp ? 'Sending...' : 'Retry WhatsApp'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-tertiary)' }}>
              <AlertTriangle size={32} style={{ margin: '0 auto 0.75rem' }} />
              <p>No invitation found</p>
            </div>
          )}

          {/* Pipeline History */}
          {data.pipelineHistory?.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Pipeline History</h3>
              <div style={{ position: 'relative' }}>
                {data.pipelineHistory.slice().reverse().map((h, i) => (
                  <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.875rem' }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--primary)', marginTop: 6,
                    }} />
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>{h.stage}</p>
                      {h.note && <p style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)' }}>{h.note}</p>}
                      {h.timestamp && <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>{new Date(h.timestamp).toLocaleString()}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
