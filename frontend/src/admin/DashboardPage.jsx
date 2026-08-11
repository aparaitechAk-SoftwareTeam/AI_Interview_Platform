import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboard } from '../services/api.js';
import {
  Users, Mail, Activity, CheckCircle, Clock, AlertTriangle,
  TrendingUp, Briefcase, Eye, Play, XCircle, UserCheck, Pause,
  ChevronRight, RefreshCw
} from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, color, sub }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{label}</p>
        <p style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{value}</p>
        {sub && <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{sub}</p>}
      </div>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${color}20`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
      background: `linear-gradient(90deg, ${color}, ${color}50)`,
    }} />
  </div>
);

const CandidateRow = ({ candidate }) => (
  <tr>
    <td>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          width: 34, height: 34, borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
        }}>
          {candidate.name?.[0]}
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{candidate.name}</div>
          <div style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{candidate.email}</div>
        </div>
      </div>
    </td>
    <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{candidate.jobRole?.name || '—'}</td>
    <td>
      <span className={`badge badge-${
        candidate.pipelineStage === 'SELECTED' ? 'success' :
        candidate.pipelineStage === 'REJECTED' ? 'danger' :
        candidate.pipelineStage === 'SHORTLISTED' ? 'info' : 'warning'
      }`}>{candidate.pipelineStage}</span>
    </td>
    <td>
      <Link to={`/admin/candidates/${candidate._id}`} style={{ color: 'var(--primary)', fontSize: '0.875rem', fontWeight: 500 }}>
        View →
      </Link>
    </td>
  </tr>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState({ candidates: [], interviews: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const { data } = await dashboard.getStats();
      setStats(data.stats);
      setRecent({ candidates: data.recentCandidates || [], interviews: data.recentInterviews || [] });
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-primary)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Dashboard</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Real-time platform overview</p>
        </div>
        <button className="btn btn-secondary" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid-stats">
        <StatCard label="Total Candidates" value={stats?.totalCandidates ?? 0} icon={Users} color="#2563eb" />
        <StatCard label="Invitations Sent" value={stats?.invitationsSent ?? 0} icon={Mail} color="#7c3aed" />
        <StatCard label="Live Interviews" value={stats?.liveInterviews ?? 0} icon={Activity} color="#ef4444" sub="Currently active" />
        <StatCard label="Completed" value={stats?.completedInterviews ?? 0} icon={CheckCircle} color="#10b981" />
      </div>

      {/* Stats Grid - Row 2 */}
      <div className="grid-stats" style={{ marginBottom: '2rem' }}>
        <StatCard label="Pending Review" value={stats?.resultsPendingReview ?? 0} icon={Clock} color="#f59e0b" />
        <StatCard label="Shortlisted" value={stats?.shortlistedCount ?? 0} icon={TrendingUp} color="#06b6d4" />
        <StatCard label="Selected" value={stats?.selectedCount ?? 0} icon={UserCheck} color="#10b981" />
        <StatCard label="High Integrity Risk" value={stats?.highIntegrityRisk ?? 0} icon={AlertTriangle} color="#ef4444" />
      </div>

      {/* Invitation Pipeline Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: 'Unused Invites', value: stats?.unusedInvitations ?? 0, icon: Mail },
          { label: 'Opened', value: stats?.openedInvitations ?? 0, icon: Eye },
          { label: 'Activated', value: stats?.activatedInvitations ?? 0, icon: Play },
          { label: 'Expired', value: stats?.expiredInvitations ?? 0, icon: XCircle },
          { label: 'Campaigns', value: stats?.campaignCount ?? 0, icon: Briefcase },
          { label: 'Rejected', value: stats?.rejectedCount ?? 0, icon: Pause },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="card" style={{ padding: '1.25rem', textAlign: 'center' }}>
            <Icon size={18} color="var(--text-tertiary)" style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '1.5rem', fontWeight: 700, fontFamily: 'var(--font-display)' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Candidates Table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Candidates</h3>
            <Link to="/admin/candidates" style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Stage</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.candidates.length > 0 ? (
                  recent.candidates.map((c) => <CandidateRow key={c._id} candidate={c} />)
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                      No candidates yet. <Link to="/admin/candidates">Add one →</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Interviews */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem' }}>Recent Interviews</h3>
            <Link to="/admin/results" style={{ fontSize: '0.8rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.interviews.length > 0 ? (
                  recent.interviews.map((s) => (
                    <tr key={s._id}>
                      <td style={{ fontSize: '0.9rem' }}>{s.candidate?.name || '—'}</td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{s.jobRole?.name || '—'}</td>
                      <td>
                        <span className={`badge badge-${
                          s.status === 'COMPLETED' ? 'success' :
                          s.status === 'STARTED' ? 'info' :
                          s.status === 'TERMINATED' ? 'danger' : 'warning'
                        }`}>{s.status}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '2rem' }}>
                      No interviews yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
