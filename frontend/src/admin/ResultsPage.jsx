import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { results, candidates } from '../services/api.js';
import { CheckCircle, Clock, Eye, XCircle, Pause, BarChart2 } from 'lucide-react';

export default function ResultsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      // Get all completed interviews via candidates API
      const res = await candidates.list({ status: 'COMPLETED' });
      setSessions(res.data.data || []);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Results</h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Review and release interview scores</p>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Status</th>
              <th>Pipeline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>Loading...</td></tr>
            ) : sessions.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>No completed interviews yet.</td></tr>
            ) : (
              sessions.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)' }}>{c.email}</div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.jobRole?.name || '—'}</td>
                  <td>
                    <span className={`badge badge-${c.status === 'RESULT_RELEASED' ? 'success' : 'warning'}`}>
                      {c.status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.pipelineStage === 'SHORTLISTED' ? 'info' : c.pipelineStage === 'REJECTED' ? 'danger' : 'warning'}`}>
                      {c.pipelineStage}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/candidates/${c._id}`} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                      <Eye size={14} /> Review
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
