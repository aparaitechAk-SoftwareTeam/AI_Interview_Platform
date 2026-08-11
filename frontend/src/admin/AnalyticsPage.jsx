import React, { useEffect, useState } from 'react';
import { analytics } from '../services/api.js';
import { BarChart2, TrendingUp, Users, CheckCircle, RefreshCw } from 'lucide-react';

const MetricBar = ({ label, value, max = 100, color }) => (
  <div style={{ marginBottom: '1rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.375rem' }}>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{value}</span>
    </div>
    <div style={{ height: 8, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{ width: `${Math.min((value / max) * 100, 100)}%`, height: '100%', background: color, borderRadius: 999, transition: 'width 0.5s ease' }} />
    </div>
  </div>
);

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await analytics.get();
      setData(res.data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>Loading analytics...</div>;
  if (!data) return null;

  const pipelineItems = data.pipelineFunnel || {};
  const totalPipeline = Object.values(pipelineItems).reduce((a, b) => a + b, 0) || 1;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.74rem', marginBottom: '0.25rem' }}>Analytics</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Platform performance insights</p>
        </div>
        <button className="btn btn-secondary" onClick={fetch}><RefreshCw size={15} /></button>
      </div>

      {/* Summary Cards */}
      <div className="grid-stats" style={{ marginBottom: '2rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-display)' }}>{data.totals?.candidates ?? 0}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Total Candidates</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-display)' }}>{data.totals?.completionRate ?? 0}%</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Completion Rate</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>{data.averages?.overall ?? 0}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Average Overall Score</div>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#8b5cf6', fontFamily: 'var(--font-display)' }}>{data.totals?.completed ?? 0}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Completed Interviews</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Score Distribution */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart2 size={16} /> Score Distribution (Averages)
          </h3>
          <MetricBar label="Technical" value={data.averages?.technical ?? 0} color="#2563eb" />
          <MetricBar label="Communication" value={data.averages?.communication ?? 0} color="#10b981" />
          <MetricBar label="Problem Solving" value={data.averages?.problemSolving ?? 0} color="#ef4444" />
          <MetricBar label="Aptitude" value={data.averages?.aptitude ?? 0} color="#06b6d4" />
          <MetricBar label="Resume Match" value={data.averages?.resume ?? 0} color="#8b5cf6" />
        </div>

        {/* Pipeline Funnel */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={16} /> Recruitment Pipeline
          </h3>
          {Object.entries(pipelineItems).map(([stage, count]) => (
            <div key={stage} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.875rem' }}>
              <span style={{ fontSize: '0.8rem', width: 120, color: 'var(--text-secondary)', fontWeight: 500 }}>{stage}</span>
              <div style={{ flex: 1, height: 24, background: 'var(--bg-tertiary)', borderRadius: 999, overflow: 'hidden', position: 'relative' }}>
                <div style={{
                  width: `${Math.max((count / totalPipeline) * 100, 2)}%`,
                  height: '100%',
                  background: 'var(--primary)',
                  borderRadius: 999,
                  transition: 'width 0.5s ease',
                }} />
              </div>
              <span style={{ fontSize: '0.875rem', fontWeight: 700, minWidth: 28 }}>{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
