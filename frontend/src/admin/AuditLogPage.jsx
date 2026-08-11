import React, { useEffect, useState } from 'react';
import { auditLog } from '../services/api.js';
import { ClipboardList, RefreshCw } from 'lucide-react';

export default function AuditLogPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await auditLog.list();
      setList(res.data.data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const actionColors = {
    ADMIN_LOGIN: '#2563eb',
    CANDIDATE_CREATE: '#10b981',
    CANDIDATE_UPDATE: '#f59e0b',
    CANDIDATE_DEACTIVATE: '#ef4444',
    JOB_ROLE_CREATE: '#8b5cf6',
    TEMPLATE_CREATE: '#06b6d4',
    INTERVIEW_START: '#2563eb',
    INTERVIEW_COMPLETE: '#10b981',
    INTERVIEW_PAUSE: '#f59e0b',
    INTERVIEW_TERMINATE: '#ef4444',
    RESULT_DECISION: '#8b5cf6',
    RESULT_RELEASE: '#10b981',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Audit Log</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Immutable record of administrative actions</p>
        </div>
        <button className="btn btn-secondary" onClick={fetch}><RefreshCw size={15} /></button>
      </div>

      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>Admin</th>
              <th>Candidate</th>
              <th>Date & Time</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>Loading...</td></tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '3rem' }}>
                  <ClipboardList size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                  <p style={{ color: 'var(--text-tertiary)' }}>No audit entries yet</p>
                </td>
              </tr>
            ) : (
              list.map((log) => (
                <tr key={log._id}>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.625rem',
                      borderRadius: 6, fontSize: '0.75rem', fontWeight: 600,
                      background: `${actionColors[log.action] || '#94a3b8'}20`,
                      color: actionColors[log.action] || '#94a3b8',
                    }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem' }}>{log.admin?.name || '—'}</td>
                  <td style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{log.candidate?.name || '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {new Date(log.createdAt).toLocaleString()}
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
