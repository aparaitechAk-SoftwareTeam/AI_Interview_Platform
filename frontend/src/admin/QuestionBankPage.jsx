import React, { useEffect, useState } from 'react';
import { questionBank, jobRoles } from '../services/api.js';
import { BookOpen, Plus, RefreshCw, Edit2, Trash2, CheckCircle2, AlertTriangle, X, Star, HelpCircle } from 'lucide-react';

export default function QuestionBankPage() {
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'mandatory'
  
  // Lists
  const [standardQuestions, setStandardQuestions] = useState([]);
  const [mandatoryQuestions, setMandatoryQuestions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterRole, setFilterRole] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');

  // Modals & form state
  const [showModal, setShowModal] = useState(false);
  const [isMandatoryForm, setIsMandatoryForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form Fields
  const [form, setForm] = useState({
    question: '',
    role: '',
    skill: '',
    category: 'technical',
    difficulty: '3',
    expectedCompetency: '',
    evaluationRubric: '',
    // Mandatory specific fields
    topic: '',
    mustAsk: true,
    allowAIFollowUp: true,
    maxFollowUps: 2
  });

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch roles
      const rolesRes = await jobRoles.list();
      setRoles(rolesRes.data.data || []);

      if (activeTab === 'standard') {
        const params = {};
        if (filterRole) params.role = filterRole;
        if (filterCategory) params.category = filterCategory;
        if (filterDifficulty) params.difficulty = filterDifficulty;

        const res = await questionBank.list(params);
        setStandardQuestions(res.data.data || []);
      } else {
        const res = await questionBank.listMandatory();
        setMandatoryQuestions(res.data.data || []);
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, filterRole, filterCategory, filterDifficulty]);

  const openAdd = () => {
    setEditItem(null);
    setIsMandatoryForm(activeTab === 'mandatory');
    setForm({
      question: '',
      role: roles[0]?._id || '',
      skill: '',
      category: 'technical',
      difficulty: '3',
      expectedCompetency: '',
      evaluationRubric: '',
      topic: '',
      mustAsk: true,
      allowAIFollowUp: true,
      maxFollowUps: 2
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    const isMand = activeTab === 'mandatory';
    setIsMandatoryForm(isMand);
    setForm({
      question: item.question || '',
      role: item.role?._id || item.role || '',
      skill: item.skill || '',
      category: item.category || 'technical',
      difficulty: item.difficulty || '3',
      expectedCompetency: item.expectedCompetency || '',
      evaluationRubric: item.evaluationRubric || '',
      topic: item.topic || '',
      mustAsk: item.mustAsk ?? true,
      allowAIFollowUp: item.allowAIFollowUp ?? true,
      maxFollowUps: item.maxFollowUps ?? 2
    });
    setError('');
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this question? It will no longer be selected in future interviews.')) return;
    try {
      if (activeTab === 'standard') {
        await questionBank.delete(id);
      } else {
        await questionBank.deleteMandatory(id);
      }
      setSuccess('Question deactivated successfully.');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      console.error(e);
      alert('Failed to delete question.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isMandatoryForm) {
        const payload = {
          question: form.question,
          category: form.category,
          topic: form.topic || 'General',
          difficulty: form.difficulty,
          mustAsk: form.mustAsk,
          allowAIFollowUp: form.allowAIFollowUp,
          maxFollowUps: form.maxFollowUps,
          expectedCompetency: form.expectedCompetency,
          evaluationRubric: form.evaluationRubric
        };

        if (editItem) {
          await questionBank.updateMandatory(editItem._id, payload);
          setSuccess('Mandatory question updated successfully!');
        } else {
          await questionBank.createMandatory(payload);
          setSuccess('New mandatory question added.');
        }
      } else {
        const payload = {
          question: form.question,
          role: form.role,
          skill: form.skill || 'General',
          category: form.category,
          difficulty: form.difficulty,
          expectedCompetency: form.expectedCompetency,
          evaluationRubric: form.evaluationRubric
        };

        if (editItem) {
          await questionBank.update(editItem._id, payload);
          setSuccess('Question updated successfully!');
        } else {
          await questionBank.create(payload);
          setSuccess('New question added to database bank.');
        }
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(''), 3500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save question.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Question Bank</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Manage evaluation prompts, hybrid categories, and mandatory questions</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchData} title="Refresh"><RefreshCw size={15} /></button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={15} /> Add Question</button>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={16} />
          <span>{success}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-primary)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => { setActiveTab('standard'); setFilterRole(''); }}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem',
            color: activeTab === 'standard' ? 'var(--primary)' : 'var(--text-tertiary)',
            borderBottom: activeTab === 'standard' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          📂 Standard Bank Items
        </button>
        <button
          onClick={() => { setActiveTab('mandatory'); }}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem',
            color: activeTab === 'mandatory' ? 'var(--primary)' : 'var(--text-tertiary)',
            borderBottom: activeTab === 'mandatory' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          ⭐ Mandatory Questions
        </button>
      </div>

      {/* Filters (Standard only) */}
      {activeTab === 'standard' && (
        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', padding: '1rem', marginBottom: '1.5rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Role</span>
            <select className="form-select" style={{ padding: '0.375rem 0.5rem', fontSize: '0.85rem' }} value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">All Roles</option>
              {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '150px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Category</span>
            <select className="form-select" style={{ padding: '0.375rem 0.5rem', fontSize: '0.85rem' }} value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="technical">Technical</option>
              <option value="resume">Resume Alignment</option>
              <option value="problemSolving">Problem Solving</option>
              <option value="hr">HR & Culture</option>
              <option value="aptitude">Aptitude</option>
              <option value="communication">Communication</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', minWidth: '120px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-tertiary)' }}>Difficulty</span>
            <select className="form-select" style={{ padding: '0.375rem 0.5rem', fontSize: '0.85rem' }} value={filterDifficulty} onChange={(e) => setFilterDifficulty(e.target.value)}>
              <option value="">All</option>
              <option value="1">1 (Easy)</option>
              <option value="2">2</option>
              <option value="3">3 (Medium)</option>
              <option value="4">4</option>
              <option value="5">5 (Hard)</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-tertiary)', padding: '2rem 0' }}>Loading questions...</p>
        ) : (activeTab === 'standard' ? standardQuestions : mandatoryQuestions).length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <BookOpen size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-tertiary)', fontWeight: 500 }}>No matching questions found in this folder.</p>
            <button className="btn btn-primary" onClick={openAdd} style={{ marginTop: '1rem' }}><Plus size={14} /> Add First Question</button>
          </div>
        ) : (
          (activeTab === 'standard' ? standardQuestions : mandatoryQuestions).map((item) => (
            <div key={item._id} className="card" style={{ border: '1px solid var(--border-primary)', display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                  {item.question}
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }} onClick={() => openEdit(item)} title="Edit"><Edit2 size={13} /></button>
                  <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', color: 'var(--error)' }} onClick={() => handleDelete(item._id)} title="Delete"><Trash2 size={13} /></button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center', fontSize: '0.75rem' }}>
                <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--primary-light)', color: 'var(--primary)', fontWeight: 600, textTransform: 'capitalize' }}>
                  {item.category}
                </span>
                <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Difficulty: {item.difficulty}
                </span>
                {activeTab === 'standard' ? (
                  <>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Role: <strong>{item.role?.name || 'All Roles'}</strong>
                    </span>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Skill: <strong>{item.skill}</strong>
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 500 }}>
                      Topic: <strong>{item.topic}</strong>
                    </span>
                    {item.mustAsk && (
                      <span style={{ padding: '0.15rem 0.4rem', borderRadius: 4, background: 'rgba(234, 179, 8, 0.1)', color: 'rgb(202, 138, 4)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Star size={11} fill="currentColor" /> Must Ask
                      </span>
                    )}
                  </>
                )}
              </div>

              {item.expectedCompetency && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.5rem 0.75rem', borderRadius: 8, marginTop: '0.25rem' }}>
                  <strong style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Expected Answer Competency</strong>
                  {item.expectedCompetency}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: 'var(--bg-secondary)', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: '600px', border: '1px solid var(--border-primary)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                {editItem ? 'Edit Question' : isMandatoryForm ? 'Add Mandatory Question' : 'Add Standard Question'}
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
                <label className="form-label">Question Text *</label>
                <textarea className="form-input" style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }} value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required placeholder="e.g. Can you explain the difference between processes and threads in an operating system?" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select className="form-select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                    <option value="technical">Technical</option>
                    <option value="resume">Resume Alignment</option>
                    <option value="problemSolving">Problem Solving</option>
                    <option value="hr">HR & Culture</option>
                    <option value="aptitude">Aptitude</option>
                    <option value="communication">Communication</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-select" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                    <option value="1">1 (Easy)</option>
                    <option value="2">2</option>
                    <option value="3">3 (Medium)</option>
                    <option value="4">4</option>
                    <option value="5">5 (Hard)</option>
                  </select>
                </div>
              </div>

              {isMandatoryForm ? (
                /* Mandatory Specific Inputs */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Topic / Skill Tag *</label>
                    <input type="text" className="form-input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} required placeholder="e.g. Operating Systems" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Max AI Follow-ups</label>
                    <select className="form-select" value={form.maxFollowUps} onChange={(e) => setForm({ ...form, maxFollowUps: Number(e.target.value) })}>
                      {[0, 1, 2, 3].map(n => <option key={n} value={n}>{n} follow-ups</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                /* Standard Specific Inputs */
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label">Job Role Association *</label>
                    <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                      <option value="" disabled>Select Job Role</option>
                      {roles.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Specific Skill Keyword *</label>
                    <input type="text" className="form-input" value={form.skill} onChange={(e) => setForm({ ...form, skill: e.target.value })} required placeholder="e.g. React hooks" />
                  </div>
                </div>
              )}

              {isMandatoryForm && (
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem', padding: '0.75rem', background: 'var(--bg-tertiary)', borderRadius: 10 }}>
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={form.mustAsk} onChange={(e) => setForm({ ...form, mustAsk: e.target.checked })} />
                    <span>Must Ask (Guaranteed Coverage)</span>
                  </label>
                  <label style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', cursor: 'pointer', fontSize: '0.85rem' }}>
                    <input type="checkbox" checked={form.allowAIFollowUp} onChange={(e) => setForm({ ...form, allowAIFollowUp: e.target.checked })} />
                    <span>Allow AI follow-ups on answer</span>
                  </label>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Expected Competency Criteria</label>
                <input type="text" className="form-input" placeholder="e.g. Explains threading, race conditions, memory model correctly." value={form.expectedCompetency} onChange={(e) => setForm({ ...form, expectedCompetency: e.target.value })} />
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Evaluation Rubric Guide (Optional)</label>
                <textarea className="form-input" style={{ minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }} placeholder="e.g. Grade 5: Clear distinction with practical samples. Grade 3: Theoretical knowledge only." value={form.evaluationRubric} onChange={(e) => setForm({ ...form, evaluationRubric: e.target.value })} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-primary)', paddingTop: '1rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editItem ? 'Save Updates' : 'Add Question'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
