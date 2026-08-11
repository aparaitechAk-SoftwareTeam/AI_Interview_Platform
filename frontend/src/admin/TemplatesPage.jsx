import React, { useEffect, useState } from 'react';
import { templates, jobRoles } from '../services/api.js';
import { FileText, Plus, RefreshCw, Edit2, CheckCircle2, AlertTriangle, X, Eye, History, GitPullRequest, Settings, HelpCircle } from 'lucide-react';

export default function TemplatesPage() {
  const [list, setList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal / Form state
  const [showModal, setShowModal] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [form, setForm] = useState({
    name: '',
    role: '',
    language: 'English',
    tone: 'Professional',
    speakingSpeed: 'Normal',
    duration: 5, // Enforced V1 duration
    difficulty: 'Adaptive',
    weights: {
      technical: 40,
      resume: 20,
      problemSolving: 15,
      hr: 10,
      aptitude: 10,
      communication: 5
    },
    mustCoverTopics: '',
    maxFollowUps: 2,
    antiCheatingStrictness: 'Medium',
    calibrationRequired: true,
    recordingMode: 'AUDIO_ONLY',
    resultVisibility: 'ReleasedByAdmin',
    changeSummary: '' // version update summary
  });

  // Version History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedTemplateForHistory, setSelectedTemplateForHistory] = useState(null);
  const [versionList, setVersionList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await templates.list();
      setList(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await jobRoles.list();
      setRoles(res.data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTemplates();
    fetchRoles();
  }, []);

  const openAdd = () => {
    setEditTemplate(null);
    setForm({
      name: '',
      role: roles[0]?._id || '',
      language: 'English',
      tone: 'Professional',
      speakingSpeed: 'Normal',
      duration: 5,
      difficulty: 'Adaptive',
      weights: {
        technical: 40,
        resume: 20,
        problemSolving: 15,
        hr: 10,
        aptitude: 10,
        communication: 5
      },
      mustCoverTopics: '',
      maxFollowUps: 2,
      antiCheatingStrictness: 'Medium',
      calibrationRequired: true,
      recordingMode: 'AUDIO_ONLY',
      resultVisibility: 'ReleasedByAdmin',
      changeSummary: ''
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (t) => {
    setEditTemplate(t);
    setForm({
      name: t.name || '',
      role: t.role?._id || t.role || '',
      language: t.language || 'English',
      tone: t.tone || 'Professional',
      speakingSpeed: t.speakingSpeed || 'Normal',
      duration: 5, // Enforced V1 duration
      difficulty: t.difficulty || 'Adaptive',
      weights: {
        technical: t.weights?.technical ?? 40,
        resume: t.weights?.resume ?? 20,
        problemSolving: t.weights?.problemSolving ?? 15,
        hr: t.weights?.hr ?? 10,
        aptitude: t.weights?.aptitude ?? 10,
        communication: t.weights?.communication ?? 5
      },
      mustCoverTopics: (t.mustCoverTopics || []).join(', '),
      maxFollowUps: t.maxFollowUps ?? 2,
      antiCheatingStrictness: t.antiCheatingStrictness || 'Medium',
      calibrationRequired: t.calibrationRequired ?? true,
      recordingMode: t.recordingMode || 'AUDIO_ONLY',
      resultVisibility: t.resultVisibility || 'ReleasedByAdmin',
      changeSummary: ''
    });
    setError('');
    setShowModal(true);
  };

  const openHistory = async (t) => {
    setSelectedTemplateForHistory(t);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    setVersionList([]);
    try {
      const res = await templates.getVersions(t._id);
      setVersionList(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRestoreVersion = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this configuration snapshot as the active configuration version?')) return;
    try {
      await templates.restore(selectedTemplateForHistory._id, versionId);
      alert('Template version restored successfully!');
      setShowHistoryModal(false);
      fetchTemplates();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to restore template version.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    // Client-side weightage validation
    const w = form.weights;
    const total = Number(w.technical) + Number(w.resume) + Number(w.problemSolving) + Number(w.hr) + Number(w.aptitude) + Number(w.communication);
    if (total !== 100) {
      setError(`Evaluation weights must sum to exactly 100%. Current sum: ${total}%`);
      setSaving(false);
      return;
    }

    const payload = {
      ...form,
      mustCoverTopics: form.mustCoverTopics.split(',').map(s => s.trim()).filter(Boolean)
    };

    try {
      if (editTemplate) {
        await templates.update(editTemplate._id, payload);
        setSuccess('Template configuration updated successfully!');
      } else {
        await templates.create(payload);
        setSuccess('New evaluation template created!');
      }
      setShowModal(false);
      fetchTemplates();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save template configuration.');
    } finally {
      setSaving(false);
    }
  };

  const handleWeightChange = (key, val) => {
    setForm(prev => ({
      ...prev,
      weights: {
        ...prev.weights,
        [key]: parseInt(val) || 0
      }
    }));
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Templates</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Preset evaluation rubrics and AI interviewer configurations</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchTemplates} title="Refresh"><RefreshCw size={15} /></button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> New Template</button>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-tertiary)', gridColumn: '1/-1' }}>Loading templates...</p>
        ) : list.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', gridColumn: '1/-1', padding: '3rem 1rem' }}>
            <FileText size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>No evaluation templates configured yet.</p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '1rem' }}><Plus size={14} /> Create First Template</button>
          </div>
        ) : (
          list.map((t) => (
            <div key={t._id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', border: '1px solid var(--border-primary)' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{t.name}</h3>
                  <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--bg-tertiary)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    v{t.version || 1}
                  </span>
                </div>
                
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  Assigned Role: <strong style={{ color: 'var(--text-primary)' }}>{t.role?.name || 'Unassigned'}</strong>
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', padding: '0.75rem', borderRadius: 8, background: 'var(--bg-tertiary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
                  <div>Tone: <strong>{t.tone}</strong></div>
                  <div>Difficulty: <strong>{t.difficulty}</strong></div>
                  <div>Duration: <strong>5 min</strong></div>
                  <div>Language: <strong>{t.language}</strong></div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '0.4rem' }}>Weights Breakdown</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                    {Object.entries(t.weights || {}).map(([key, val]) => (
                      <span key={key} style={{ fontSize: '0.72rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.15rem 0.4rem', borderRadius: 6, fontWeight: 500 }}>
                        {key}: {val}%
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', gap: '0.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openEdit(t)}>
                  <Edit2 size={13} /> Edit Config
                </button>
                <button className="btn btn-secondary" style={{ flex: 1, padding: '0.4rem 0.5rem', fontSize: '0.8rem', gap: '0.25rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => openHistory(t)}>
                  <History size={13} /> Versions
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Template Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: '640px', border: '1px solid var(--border-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                {editTemplate ? `Edit Template (v${editTemplate.version || 1})` : 'New Evaluation Template'}
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
                <label className="form-label">Template Name *</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="e.g. Standard Evaluation Rubric" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Job Role *</label>
                  <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                    <option value="" disabled>Select Job Role</option>
                    {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-select" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
                    <option value="English">English Only</option>
                    <option value="Marathi-English">Marathi-English Mix</option>
                    <option value="Hindi-English">Hindi-English Mix</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Tone</label>
                  <select className="form-select" value={form.tone} onChange={(e) => setForm({ ...form, tone: e.target.value })}>
                    <option value="Professional">Professional</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Strict">Strict</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Speaking Speed</label>
                  <select className="form-select" value={form.speakingSpeed} onChange={(e) => setForm({ ...form, speakingSpeed: e.target.value })}>
                    <option value="Slow">Slow</option>
                    <option value="Normal">Normal</option>
                    <option value="Slightly Fast">Slightly Fast</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="Adaptive">Adaptive</option>
                    <option value="1">1 (Easy)</option>
                    <option value="2">2</option>
                    <option value="3">3 (Medium)</option>
                    <option value="4">4</option>
                    <option value="5">5 (Hard)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <input type="text" className="form-input" value="5 min" disabled style={{ background: 'var(--bg-tertiary)', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Follow-ups</label>
                  <select className="form-select" value={form.maxFollowUps} onChange={(e) => setForm({ ...form, maxFollowUps: Number(e.target.value) })}>
                    {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n} follow-ups</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Anti-cheat Strictness</label>
                  <select className="form-select" value={form.antiCheatingStrictness} onChange={(e) => setForm({ ...form, antiCheatingStrictness: e.target.value })}>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Calibration Setup</label>
                  <select className="form-select" value={form.calibrationRequired ? 'true' : 'false'} onChange={(e) => setForm({ ...form, calibrationRequired: e.target.value === 'true' })}>
                    <option value="true">Required</option>
                    <option value="false">Skip Calibration</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Recording Mode</label>
                  <select className="form-select" value={form.recordingMode} onChange={(e) => setForm({ ...form, recordingMode: e.target.value })}>
                    <option value="NO_STORED_RECORDING">Do Not Save Record</option>
                    <option value="AUDIO_ONLY">Audio Only</option>
                    <option value="AUDIO_VIDEO">Audio & Video</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Result Visibility</label>
                  <select className="form-select" value={form.resultVisibility} onChange={(e) => setForm({ ...form, resultVisibility: e.target.value })}>
                    <option value="ReleasedByAdmin">Requires Admin Release</option>
                    <option value="Immediate">Immediate Feedback</option>
                    <option value="Hidden">Hidden From Candidate</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Must-Cover Topics (comma-separated)</label>
                <input type="text" className="form-input" placeholder="OOP, Database Normalization, REST API design" value={form.mustCoverTopics} onChange={(e) => setForm({ ...form, mustCoverTopics: e.target.value })} />
              </div>

              {/* Weightage Inputs */}
              <div style={{ marginTop: '1rem', border: '1px solid var(--border-primary)', borderRadius: 12, padding: '1rem', background: 'var(--bg-tertiary)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span>Scoring Category Weightages (Must sum to 100%)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                    Total: {Number(form.weights.technical) + Number(form.weights.resume) + Number(form.weights.problemSolving) + Number(form.weights.hr) + Number(form.weights.aptitude) + Number(form.weights.communication)}%
                  </span>
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                  {Object.keys(form.weights).map((category) => (
                    <div className="form-group" key={category} style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'capitalize' }}>{category}</label>
                      <input type="number" min="0" max="100" className="form-input" value={form.weights[category]} onChange={(e) => handleWeightChange(category, e.target.value)} required />
                    </div>
                  ))}
                </div>
              </div>

              {editTemplate && (
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Change Log Summary *</label>
                  <input type="text" className="form-input" placeholder="Explain what changes are being made (creates new version)" value={form.changeSummary} onChange={(e) => setForm({ ...form, changeSummary: e.target.value })} required={!!editTemplate} />
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Note: If this template is currently linked to candidates or sessions, saving updates will automatically increment its version and record a backup snapshot.
                  </p>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editTemplate ? 'Save Updates' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: '750px', border: '1px solid var(--border-primary)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '0.75rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Version History</h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>{selectedTemplateForHistory?.name}</p>
              </div>
              <button onClick={() => setShowHistoryModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
              {loadingHistory ? (
                <p style={{ color: 'var(--text-tertiary)', textAlign: 'center', padding: '2rem' }}>Loading versions...</p>
              ) : versionList.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--text-tertiary)', padding: '3rem 1rem' }}>
                  <GitPullRequest size={36} style={{ marginBottom: '0.5rem' }} />
                  <p>No previous version snapshots exist for this template yet.</p>
                  <p style={{ fontSize: '0.775rem', marginTop: '0.25rem' }}>Backup configurations are automatically recorded when a template configuration in active use is updated.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {versionList.map((v) => (
                    <div key={v._id} style={{ border: '1px solid var(--border-primary)', borderRadius: 10, padding: '1rem', background: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Version {v.versionNumber}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>by {v.createdBy?.name || 'Admin'} on {new Date(v.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                          Summary: {v.changeSummary}
                        </p>
                      </div>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }} onClick={() => handleRestoreVersion(v._id)}>
                        Restore config
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setShowHistoryModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
