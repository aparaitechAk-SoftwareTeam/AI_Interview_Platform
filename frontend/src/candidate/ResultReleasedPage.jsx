import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { candidates } from '../services/api.js';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { CheckCircle2, Award, Calendar, BarChart3, Star } from 'lucide-react';

export default function ResultReleasedPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await candidates.get(id);
        setData(res.data.data);
        setSession(res.data.session);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-tertiary)' }}>Loading your results...</div>;
  if (!data || !session) return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--error)' }}>Result not found or not released yet.</div>;

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', background: 'var(--success-light)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem',
          }}>
            <Award size={36} color="var(--success)" />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Interview Assessment Released
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.95rem' }}>
            Results for <strong style={{ color: 'var(--text-primary)' }}>{data.jobRole?.name}</strong> position.
          </p>
        </div>

        <div className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '1rem' }}>
            <div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Candidate Name</p>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{data.name}</h3>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.25rem' }}>Completed On</p>
              <p style={{ fontSize: '0.9rem', fontWeight: 500 }}>{new Date(session.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>

          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={16} /> Performance Breakdown
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              {Object.entries(session.scores || {}).filter(([k]) => k !== 'overall').map(([key, val]) => (
                <div key={key} style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: 500, color: 'var(--text-secondary)' }}>{key}</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>{val}/100</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{
            background: 'var(--primary-light)', color: 'var(--primary)',
            padding: '1.25rem', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: '0.5rem',
          }}>
            <span style={{ fontWeight: 700 }}>Overall Assessment Score</span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>{session.scores?.overall}/100</span>
          </div>

          {session.report?.feedback && (
            <div style={{ background: 'var(--bg-tertiary)', padding: '1.25rem', borderRadius: 12, border: '1px solid var(--border-primary)' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.5rem' }}>AI Feedback Summary</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                {session.report.feedback}
              </p>
            </div>
          )}

          <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-primary)', paddingTop: '1.5rem', color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>
            Our recruitment team will review your profile and get in touch with next steps shortly.
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
