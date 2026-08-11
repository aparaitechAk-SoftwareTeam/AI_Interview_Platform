import React, { useEffect, useState } from 'react';
import { jobRoles } from '../services/api.js';
import { Plus, Edit2, Power, RefreshCw } from 'lucide-react';

export default function JobRolesPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', requiredSkills: '', experienceLevel: 'Fresher', defaultDuration: 5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetch = async () => {
    setLoading(true);
    try {
      const res = await jobRoles.list();
      setList(res.data.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditRole(null); setForm({ name: '', description: '', requiredSkills: '', experienceLevel: 'Fresher', defaultDuration: 5 }); setShowModal(true); };
  const openEdit = (role) => {
    setEditRole(role);
    setForm({ name: role.name, description: role.description, requiredSkills: (role.requiredSkills || []).join(', '), experienceLevel: role.experienceLevel, defaultDuration: role.defaultDuration });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true); setError('');
    try {
      const payload = {
        ...form,
        requiredSkills: form.requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      if (editRole) {
        await jobRoles.update(editRole._id, payload);
      } else {
        await jobRoles.create(payload);
      }
      setShowModal(false);
      fetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!confirm('Deactivate this job role?')) return;
    try { await jobRoles.delete(id); fetch(); } catch {}
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Job Roles</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Manage available positions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetch}><RefreshCw size={15} /></button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> New Role</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-tertiary)' }}>Loading...</p>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1' }}>
            <p style={{ color: 'var(--text-tertiary)', marginBottom: '1rem' }}>No job roles configured yet.</p>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Create First Role</button>
          </div>
        ) : (
          list.map((role) => (
            <div key={role._id} className="card" style={{ opacity: role.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <h3 style={{ fontSize: '1rem' }}>{role.name}</h3>
                <div style={{ display: 'flex', gap: '0.375rem' }}>
                  <button className="btn btn-secondary" style={{ padding: '0.375rem' }} onClick={() => openEdit(role)}>
                    <Edit2 size={13} />
                  </button>
                  {role.isActive && (
                    <button className="btn btn-secondary" style={{ padding: '0.375rem', color: 'var(--error)', borderColor: 'var(--error)' }} onClick={() => handleDeactivate(role._id)}>
                      <Power size={13} />
                    </button>
                  )}
                </div>
              </div>
              {role.description && <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem', marginBottom: '0.875rem' }}>{role.description}</p>}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
                {(role.requiredSkills || []).slice(0, 5).map((s) => (
                  <span key={s} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 500 }}>{s}</span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                <span>{role.experienceLevel}</span>
                <span>•</span>
                <span>{role.defaultDuration || 5} min</span>
                <span>•</span>
                <span className={`badge ${role.isActive ? 'badge-success' : 'badge-danger'}`}>{role.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 16, padding: '2rem', width: '100%', maxWidth: 480, border: '1px solid var(--border-primary)' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editRole ? 'Edit Role' : 'New Job Role'}</h2>
            {error && <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Role Name *</label><input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">Required Skills (comma-separated)</label><input type="text" className="form-input" placeholder="React, Node.js, MongoDB" value={form.requiredSkills} onChange={(e) => setForm({ ...form, requiredSkills: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <select className="form-select" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                    {['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Default Duration</label>
                  <select className="form-select" value={form.defaultDuration} onChange={(e) => setForm({ ...form, defaultDuration: Number(e.target.value) })}>
                    {[5].map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setError(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : editRole ? 'Update Role' : 'Create Role'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
