import React, { useEffect, useState } from 'react';
import { campaigns, jobRoles, templates } from '../services/api.js';
import { Megaphone, Plus, RefreshCw, Edit2, Archive, CheckCircle2, AlertTriangle, X, Calendar, Users, Percent, ShieldCheck } from 'lucide-react';

export default function CampaignsPage() {
  const [list, setList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedStats, setSelectedStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [editCampaign, setEditCampaign] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    allowedRoles: [],
    defaultTemplate: '',
    candidateLimit: 100,
    status: 'DRAFT',
    inviteDefaults: {
      duration: 5, // Enforced V1 duration
      expiryDays: 7
    }
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const campRes = await campaigns.list();
      setList(campRes.data.data || []);

      const rolesRes = await jobRoles.list();
      setRoles(rolesRes.data.data || []);

      const tempRes = await templates.list();
      setAllTemplates(tempRes.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditCampaign(null);
    setForm({
      name: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      allowedRoles: [],
      defaultTemplate: allTemplates[0]?._id || '',
      candidateLimit: 100,
      status: 'ACTIVE',
      inviteDefaults: {
        duration: 5,
        expiryDays: 7
      }
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditCampaign(c);
    setForm({
      name: c.name || '',
      description: c.description || '',
      startDate: c.startDate ? c.startDate.split('T')[0] : '',
      endDate: c.endDate ? c.endDate.split('T')[0] : '',
      allowedRoles: (c.allowedRoles || []).map(r => r._id || r),
      defaultTemplate: c.defaultTemplate?._id || c.defaultTemplate || '',
      candidateLimit: c.candidateLimit || 100,
      status: c.status || 'DRAFT',
      inviteDefaults: {
        duration: 5,
        expiryDays: c.inviteDefaults?.expiryDays || 7
      }
    });
    setError('');
    setShowModal(true);
  };

  const openStats = async (c) => {
    setSelectedStats(null);
    setShowStatsModal(true);
    setLoadingStats(true);
    try {
      const res = await campaigns.get(c._id);
      setSelectedStats(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleArchive = async (id) => {
    if (!window.confirm('Are you sure you want to archive this campaign?')) return;
    try {
      await campaigns.delete(id);
      setSuccess('Campaign archived successfully!');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to archive campaign.');
    }
  };

  const handleRoleToggle = (roleId) => {
    setForm(prev => {
      const exists = prev.allowedRoles.includes(roleId);
      const updated = exists
        ? prev.allowedRoles.filter(id => id !== roleId)
        : [...prev.allowedRoles, roleId];
      return { ...prev, allowedRoles: updated };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    if (new Date(form.startDate) > new Date(form.endDate)) {
      setError('Start Date cannot be after End Date.');
      setSaving(false);
      return;
    }

    try {
      if (editCampaign) {
        await campaigns.update(editCampaign._id, form);
        setSuccess('Campaign updated successfully!');
      } else {
        await campaigns.create(form);
        setSuccess('New outreach campaign launched!');
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Campaigns</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Outreach assessments, cycles, and aggregate analytics</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchData} title="Refresh"><RefreshCw size={15} /></button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> New Campaign</button>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-tertiary)' }}>Loading campaigns...</p>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem 1rem' }}>
            <Megaphone size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>No outreach campaigns configured yet.</p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '1rem' }}><Plus size={14} /> Create First Campaign</button>
          </div>
        ) : (
          list.map((c) => (
            <div key={c._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-primary)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{c.name}</h3>
                  <span className={`badge badge-${c.status === 'ACTIVE' ? 'success' : c.status === 'COMPLETED' ? 'info' : c.status === 'PAUSED' ? 'warning' : 'secondary'}`}>
                    {c.status}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                  {c.description || 'No campaign description provided.'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={13} />
                    <span>{new Date(c.startDate).toLocaleDateString()} - {new Date(c.endDate).toLocaleDateString()}</span>
                  </div>
                  <div>Roles: <strong>{(c.allowedRoles || []).map(r => r.name || r).join(', ') || 'Any'}</strong></div>
                  <div>Limit: <strong>{c.candidateLimit} candidates</strong></div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', gap: '0.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openEdit(c)}>
                  <Edit2 size={13} /> Edit
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', gap: '0.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openStats(c)}>
                  <Percent size={13} /> Stats
                </button>
                {c.status !== 'ARCHIVED' && (
                  <button className="btn btn-secondary" style={{ color: 'var(--error)', padding: '0.4rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleArchive(c._id)} title="Archive">
                    <Archive size={13} />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: '600px', border: '1px solid var(--border-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editCampaign ? 'Edit Campaign' : 'New Outreach Campaign'}
              </h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && (
              <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={15} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Campaign Name *</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Fall Internship 2026 Outreach" />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Outreach goals and context..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="form-input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="form-input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Candidate Limit</label>
                  <input type="number" min="1" className="form-input" value={form.candidateLimit} onChange={(e) => setForm({ ...form, candidateLimit: parseInt(e.target.value) || 100 })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Campaign Status</label>
                  <select className="form-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    <option value="DRAFT">Draft</option>
                    <option value="ACTIVE">Active</option>
                    <option value="PAUSED">Paused</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Default Template *</label>
                  <select className="form-select" value={form.defaultTemplate} onChange={(e) => setForm({ ...form, defaultTemplate: e.target.value })} required>
                    <option value="" disabled>Select Template</option>
                    {allTemplates.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Invitation Expiry (Days)</label>
                  <input type="number" min="1" max="90" className="form-input" value={form.inviteDefaults.expiryDays} onChange={(e) => setForm({ ...form, inviteDefaults: { ...form.inviteDefaults, expiryDays: parseInt(e.target.value) || 7 } })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '0.5rem' }}>Allowed Job Roles *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', background: 'var(--bg-tertiary)', padding: '0.75rem', borderRadius: 10, border: '1px solid var(--border-primary)', maxHeight: '120px', overflowY: 'auto' }}>
                  {roles.map(r => (
                    <label key={r._id} style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                      <input type="checkbox" checked={form.allowedRoles.includes(r._id)} onChange={() => handleRoleToggle(r._id)} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{r.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editCampaign ? 'Save Updates' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatsModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '2.0rem', width: '100%', maxWidth: '500px', border: '1px solid var(--border-primary)', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Campaign Assessment Statistics</h2>
              <button onClick={() => setShowStatsModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {loadingStats ? (
              <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>Loading metrics...</p>
            ) : !selectedStats ? (
              <p style={{ color: 'var(--text-tertiary)' }}>Failed to fetch stats.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.25rem' }}>{selectedStats.data?.name}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{selectedStats.data?.description}</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Invited Candidates</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--primary)' }}>{selectedStats.stats?.invited || 0}</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Activated Link</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--primary)' }}>{selectedStats.stats?.activated || 0}</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Completed Sessions</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--primary)' }}>{selectedStats.stats?.completed || 0}</div>
                  </div>
                  <div style={{ padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 12, textAlign: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase' }}>Completion Rate</div>
                    <div style={{ fontSize: '1.8rem', fontWeight: 800, marginTop: '0.25rem', color: 'var(--primary)' }}>{selectedStats.stats?.completionRate || 0}%</div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <div>Default evaluation template: <strong>{selectedStats.data?.defaultTemplate?.name || 'Standard template'}</strong></div>
                  <div style={{ marginTop: '0.25rem' }}>Campaign Timeline: <strong>{new Date(selectedStats.data?.startDate).toLocaleDateString()} - {new Date(selectedStats.data?.endDate).toLocaleDateString()}</strong></div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
              <button className="btn btn-primary" onClick={() => setShowStatsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
