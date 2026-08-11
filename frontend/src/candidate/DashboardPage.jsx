import React from 'react';
import { useNavigate } from 'react-router-dom';
import { candidates } from '../services/api.js';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { User, FileText, Shield, Monitor, Mic, ClipboardList, ArrowRight, CheckCircle, Award, Clock3, XCircle } from 'lucide-react';

const steps = [
  { icon: User, label: 'Profile', sub: 'View your details', done: true },
  { icon: FileText, label: 'Resume', sub: 'Upload PDF resume', path: '/interview/resume', done: false },
  { icon: Shield, label: 'Identity', sub: 'Capture selfie', path: '/interview/identity', done: false },
  { icon: Monitor, label: 'System Check', sub: 'Test devices', path: '/interview/system-check', done: false },
  { icon: Mic, label: 'Calibration', sub: 'Test microphone', path: '/interview/calibration', done: false },
  { icon: ClipboardList, label: 'Instructions', sub: 'Read & consent', path: '/interview/instructions', done: false },
];

export default function CandidateDashboard() {
  const navigate = useNavigate();
  const candidateId = sessionStorage.getItem('candidateId');
  const [candidateData, setCandidateData] = React.useState(null);

  React.useEffect(() => {
    if (!candidateId) {
      navigate('/interview');
      return;
    }

    candidates.get(candidateId)
      .then((res) => setCandidateData(res.data.data))
      .catch((err) => {
        console.error('Candidate validation failed:', err);
        if (err.response && err.response.status === 404) {
          alert('Your interview session has expired or the server database restarted. Please re-enter your invitation code.');
          sessionStorage.clear();
          navigate('/interview');
        }
      });
  }, [candidateId, navigate]);
  const name = sessionStorage.getItem('candidateName') || 'Candidate';
  const jobRole = sessionStorage.getItem('jobRoleName') || 'Assessment';
  const code = sessionStorage.getItem('inviteCode') || '';

  // Check which steps are complete from session storage
  const resumeUploaded = !!sessionStorage.getItem('resumeUploaded');
  const selfieCapured = !!sessionStorage.getItem('selfieUploaded');
  const systemCheckPassed = !!sessionStorage.getItem('systemCheckPassed');
  const calibrated = !!sessionStorage.getItem('calibrationDone');
  const consentGiven = !!sessionStorage.getItem('consentGiven');

  const stepsWithStatus = [
    { ...steps[0], done: true },
    { ...steps[1], done: resumeUploaded },
    { ...steps[2], done: selfieCapured },
    { ...steps[3], done: systemCheckPassed },
    { ...steps[4], done: calibrated },
    { ...steps[5], done: consentGiven },
  ];

  const allReady = resumeUploaded && selfieCapured && systemCheckPassed && calibrated && consentGiven;

  const handleNextStep = () => {
    const nextStep = stepsWithStatus.find((s) => !s.done && s.path);
    if (nextStep) {
      navigate(nextStep.path);
    } else {
      navigate('/interview/instructions');
    }
  };

  // Once the candidate has completed their interview, the checklist no longer applies.
  // Show their current review status instead (from admin decision), if one exists.
  const pipelineStage = candidateData?.pipelineStage;
  const statusBanner = {
    SHORTLISTED: { icon: Award, color: 'var(--success)', bg: 'var(--success-light)', text: "Great news — you've been shortlisted! Our team will be in touch with next steps." },
    HOLD: { icon: Clock3, color: 'var(--warning)', bg: 'var(--warning-light)', text: 'Your application is currently on hold. We will follow up with an update within 2-3 days.' },
    REJECTED: { icon: XCircle, color: 'var(--error)', bg: 'var(--error-light)', text: 'Thank you for your interest. We will not be moving forward with your application at this time.' },
  }[pipelineStage];

  const interviewAlreadyDone = ['COMPLETED', 'RESULT_RELEASED'].includes(candidateData?.status);

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '3rem 1.5rem' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.375rem' }}>Welcome, {name} 👋</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
            Interview for <strong style={{ color: 'var(--primary)' }}>{jobRole}</strong>
            {code && <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', background: 'var(--bg-tertiary)', padding: '0.1rem 0.5rem', borderRadius: 4 }}>{code}</span>}
          </p>
        </div>

        {statusBanner && (
          <div className="card" style={{
            marginBottom: '1.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
            background: statusBanner.bg, border: `1px solid ${statusBanner.color}`,
          }}>
            <statusBanner.icon size={22} color={statusBanner.color} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontWeight: 700, color: statusBanner.color, marginBottom: '0.25rem' }}>Application Status Update</p>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{statusBanner.text}</p>
            </div>
          </div>
        )}

        {interviewAlreadyDone && !statusBanner && (
          <div className="card" style={{ marginBottom: '1.5rem', textAlign: 'center', color: 'var(--text-tertiary)' }}>
            <CheckCircle size={28} color="var(--success)" style={{ margin: '0 auto 0.5rem' }} />
            <p style={{ fontWeight: 600 }}>Your interview has been submitted.</p>
            <p style={{ fontSize: '0.85rem' }}>Our team is reviewing your responses — we'll email you with an update.</p>
          </div>
        )}

        {!interviewAlreadyDone && (
        <>
        {/* Checklist */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Pre-Interview Checklist</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {stepsWithStatus.map((step, i) => {
              const Icon = step.icon;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '1rem 0',
                  borderBottom: i < stepsWithStatus.length - 1 ? '1px solid var(--border-primary)' : 'none',
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 10,
                    background: step.done ? 'var(--success-light)' : 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {step.done ? <CheckCircle size={18} color="var(--success)" /> : <Icon size={18} color="var(--text-tertiary)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{step.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{step.sub}</div>
                  </div>
                  {step.done ? (
                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>✓ Complete</span>
                  ) : step.path ? (
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.375rem 0.875rem' }} onClick={() => navigate(step.path)}>
                      Start
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center' }}>
          {allReady ? (
            <button
              className="btn btn-primary"
              onClick={() => navigate('/interview/session/start')}
              style={{ padding: '1rem 2.5rem', fontSize: '1.05rem', borderRadius: 12 }}
            >
              🚀 Start Interview <ArrowRight size={18} />
            </button>
          ) : (
            <>
              <button
                className="btn btn-primary"
                onClick={handleNextStep}
                style={{ padding: '0.875rem 2rem', fontSize: '1rem', borderRadius: 12 }}
              >
                Continue Setup <ArrowRight size={18} />
              </button>
              <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginTop: '0.75rem' }}>
                Complete all checklist items to unlock the interview.
              </p>
            </>
          )}
        </div>
        </>
        )}
      </div>
    </CandidateLayout>
  );
}
