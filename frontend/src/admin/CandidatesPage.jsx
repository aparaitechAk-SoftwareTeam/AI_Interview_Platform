import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { candidates, jobRoles, campaigns } from '../services/api.js';
import { Plus, Search, Filter, Upload, Eye, MoreHorizontal, UserPlus, RefreshCw, Download, Users, CheckCircle2, AlertTriangle, X, Copy, ExternalLink, FileSpreadsheet } from 'lucide-react';

const PIPELINE_COLORS = {
  INVITED: '#f59e0b',
  READY: '#06b6d4',
  INTERVIEWING: '#3b82f6',
  UNDER_REVIEW: '#8b5cf6',
  SHORTLISTED: '#10b981',
  HOLD: '#f59e0b',
  REJECTED: '#ef4444',
  SELECTED: '#10b981',
};

export default function CandidatesPage() {
  const [list, setList] = useState([]);
  const [roles, setRoles] = useState([]);
  const [campList, setCampList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ role: '', campaign: '', pipelineStage: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', mobile: '', college: '', jobRole: '', experienceLevel: 'Fresher', duration: 5 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Bulk Import State
  const [showImportModal, setShowImportModal] = useState(false);
  const [importStep, setImportStep] = useState(1); // 1: Upload, 2: Preview, 3: Importing, 4: Results
  const [selectedFile, setSelectedFile] = useState(null);
  const [importError, setImportError] = useState('');
  const [previewSummary, setPreviewSummary] = useState(null);
  const [previewRows, setPreviewRows] = useState([]);
  const [importProgress, setImportProgress] = useState('');
  const [importSummary, setImportSummary] = useState(null);
  const [importRows, setImportRows] = useState([]);

  // Handlers
  const handleResendEmail = async (candidateId) => {
    const cand = list.find(c => c._id === candidateId);
    const emailStr = cand ? ` to ${cand.email}` : '';
    try {
      await candidates.resendEmail(candidateId);
      alert(`Invitation email sent successfully${emailStr}.`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to send invitation email. Please try again.');
    }
  };

  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = 'http://localhost:4000/api/candidates/import-template';
    link.download = 'candidate_import_template.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setImportError('');
    }
  };

  const handleUploadPreview = async () => {
    if (!selectedFile) {
      setImportError('Please select a CSV or XLSX file to upload.');
      return;
    }
    setImportError('');
    setImportStep(2);
    setPreviewSummary(null);
    setPreviewRows([]);
    
    try {
      const res = await candidates.importPreview(selectedFile);
      setPreviewSummary(res.data.summary);
      setPreviewRows(res.data.rows);
    } catch (err) {
      console.error(err);
      setImportError(err.response?.data?.message || 'Failed to parse file. Please verify columns and try again.');
      setImportStep(1);
    }
  };

  const handleConfirmImport = async () => {
    const validRows = previewRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setImportError('There are no valid candidates to import.');
      return;
    }
    
    setImportStep(3);
    setImportError('');
    setImportSummary(null);
    setImportRows([]);
    
    try {
      const res = await candidates.importConfirm(validRows);
      setImportSummary(res.data.summary);
      setImportRows(res.data.rows);
      setImportStep(4);
      fetchData();
    } catch (err) {
      console.error(err);
      setImportError(err.response?.data?.message || 'Failed to complete import.');
      setImportStep(2);
    }
  };

  const handleExportResults = () => {
    const headers = 'Name,Email,Candidate ID,Invitation Code,Invitation Link,Import Status,Email Status,Error\n';
    const csvContent = importRows.map(r => 
      `"${r.name || ''}","${r.email || ''}","${r.candidateId || ''}","${r.invitationCode || ''}","${r.invitationLink || ''}","${r.status || ''}","${r.emailStatus || ''}","${r.error || ''}"`
    ).join('\n');
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `import_results_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyText = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const fetchData = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const params = {};
      if (search) params.search = search;
      if (filters.role) params.role = filters.role;
      if (filters.campaign) params.campaign = filters.campaign;
      if (filters.pipelineStage) params.pipelineStage = filters.pipelineStage;
      
      const [candRes, rolesRes, campRes] = await Promise.all([
        candidates.list(params),
        jobRoles.list(),
        campaigns.list(),
      ]);
      setList(candRes.data.data || []);
      setRoles(rolesRes.data.data || []);
      setCampList(campRes.data.data || []);
    } catch (err) {
      console.error(err);
      setFetchError('Unable to load candidates data. Please verify your backend server is running and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [search, filters]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await candidates.create(form);
      setSuccess('Candidate created and invitation generated!');
      setShowAddModal(false);
      setForm({ name: '', email: '', mobile: '', college: '', jobRole: '', experienceLevel: 'Fresher', duration: 5 });
      fetchData();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create candidate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Candidates</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>{list.length} total candidates</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={15} />
          </button>
          <button className="btn btn-secondary" onClick={() => { setShowImportModal(true); setImportStep(1); setSelectedFile(null); setImportError(''); }}>
            <Upload size={15} style={{ marginRight: '0.375rem' }} /> Bulk Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <UserPlus size={15} /> Add Candidate
          </button>
        </div>
      </div>

      {success && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1rem', color: 'var(--success)', fontSize: '0.875rem' }}>
          ✓ {success}
        </div>
      )}

      {/* Search + Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search candidates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>

        <select className="form-select" value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })} style={{ width: 180 }}>
          <option value="">All Roles</option>
          {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
        </select>

        <select className="form-select" value={filters.pipelineStage} onChange={(e) => setFilters({ ...filters, pipelineStage: e.target.value })} style={{ width: 180 }}>
          <option value="">All Stages</option>
          {['INVITED', 'READY', 'INTERVIEWING', 'UNDER_REVIEW', 'SHORTLISTED', 'HOLD', 'REJECTED', 'SELECTED'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        <select className="form-select" value={filters.campaign} onChange={(e) => setFilters({ ...filters, campaign: e.target.value })} style={{ width: 180 }}>
          <option value="">All Campaigns</option>
          {campList.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
      </div>

      {/* Candidates Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Role</th>
              <th>Campaign</th>
              <th>Pipeline Stage</th>
              <th>Invite Code</th>
              <th>Expiry</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>Loading...</td></tr>
            ) : fetchError ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ color: 'var(--error)', marginBottom: '1rem' }}>⚠️ {fetchError}</div>
                  <button className="btn btn-secondary" onClick={fetchData}>
                    <RefreshCw size={14} style={{ marginRight: '0.5rem' }} /> Retry
                  </button>
                </td>
              </tr>
            ) : list.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <Users size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>No candidates yet</h3>
                  <p style={{ color: 'var(--text-tertiary)', marginBottom: '1rem', fontSize: '0.875rem' }}>Add your first candidate to start interviews.</p>
                  <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                    <Plus size={14} style={{ marginRight: '0.375rem' }} /> Add Candidate
                  </button>
                </td>
              </tr>
            ) : (
              list.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#fff', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                      }}>{c.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
                        <div style={{ fontSize: '0.775rem', color: 'var(--text-tertiary)' }}>{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.jobRole?.name || '—'}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{c.campaign?.name || '—'}</td>
                  <td>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '0.25rem 0.625rem',
                      fontSize: '0.75rem', fontWeight: 600, borderRadius: 999,
                      background: `${PIPELINE_COLORS[c.pipelineStage] || '#94a3b8'}20`,
                      color: PIPELINE_COLORS[c.pipelineStage] || '#94a3b8',
                    }}>
                      {c.pipelineStage}
                    </span>
                  </td>
                  <td>
                    {c.invitation?.code ? (
                      <div>
                        <code style={{
                          fontFamily: 'monospace', fontSize: '0.85rem',
                          background: 'var(--bg-tertiary)', padding: '0.25rem 0.5rem', borderRadius: 6,
                          color: 'var(--text-primary)',
                        }}>{c.invitation.code}</code>
                        {c.invitation.emailStatus && (
                          <div style={{
                            fontSize: '0.7rem',
                            marginTop: '0.25rem',
                            fontWeight: 500,
                            color: c.invitation.emailStatus === 'SENT' || c.invitation.emailStatus === 'DEVELOPMENT_PREVIEW'
                              ? 'var(--success)'
                              : c.invitation.emailStatus === 'FAILED'
                                ? 'var(--error)'
                                : 'var(--text-tertiary)'
                          }}>
                            Email: {c.invitation.emailStatus}
                          </div>
                        )}
                      </div>
                    ) : '—'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                    {c.invitationExpiry ? new Date(c.invitationExpiry).toLocaleDateString() : '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Link to={`/admin/candidates/${c._id}`} className="btn btn-secondary" style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Eye size={13} /> View
                      </Link>
                      {c.invitation && (
                        <button 
                          className="btn btn-secondary" 
                          onClick={() => handleResendEmail(c._id)}
                          style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                          title={`Email Status: ${c.invitation.emailStatus || 'UNKNOWN'}`}
                        >
                          <RefreshCw size={11} /> Resend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Candidate Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 16, padding: '2rem',
            width: '100%', maxWidth: 520, border: '1px solid var(--border-primary)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <h2 style={{ marginBottom: '0.25rem' }}>Add Candidate</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>An invitation will be generated automatically.</p>

            {error && (
              <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: 'var(--error)', fontSize: '0.875rem' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleCreate}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-input" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Mobile</label>
                  <input type="tel" className="form-input" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">College / Company</label>
                  <input type="text" className="form-input" value={form.college} onChange={(e) => setForm({ ...form, college: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Role *</label>
                  <select className="form-select" value={form.jobRole} onChange={(e) => setForm({ ...form, jobRole: e.target.value })} required>
                    <option value="">Select Role</option>
                    {roles.filter((r) => r.isActive).map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Experience Level</label>
                  <select className="form-select" value={form.experienceLevel} onChange={(e) => setForm({ ...form, experienceLevel: e.target.value })}>
                    {['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'].map((l) => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Duration (minutes)</label>
                  <select className="form-select" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}>
                    {[5].map((d) => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowAddModal(false); setError(''); }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create & Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {showImportModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        }}>
          <div style={{
            background: 'var(--bg-secondary)', borderRadius: 20, padding: '2rem',
            width: '100%', maxWidth: importStep === 2 || importStep === 4 ? '1100px' : '560px',
            border: '1px solid var(--border-primary)',
            maxHeight: '92vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)', transition: 'max-width 0.3s ease',
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-primary)', paddingBottom: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileSpreadsheet color="var(--primary)" size={24} /> Candidate Bulk Import
                </h2>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  Step {importStep} of 4: {
                    importStep === 1 ? 'Upload Excel/CSV' :
                    importStep === 2 ? 'Preview & Validation' :
                    importStep === 3 ? 'Importing Data' : 'Import Results'
                  }
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowImportModal(false); setImportStep(1); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Error Message */}
            {importError && (
              <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1rem', color: 'var(--error)', fontSize: '0.875rem', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <AlertTriangle size={16} />
                <span>{importError}</span>
              </div>
            )}

            {/* Step 1: Upload File */}
            {importStep === 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', flex: 1 }}>
                <div style={{
                  border: '2px dashed var(--border-primary)', borderRadius: 12, padding: '2.5rem 1.5rem',
                  textAlign: 'center', background: 'var(--bg-tertiary)', cursor: 'pointer',
                  transition: 'border-color 0.2s', position: 'relative'
                }}>
                  <Upload size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem', display: 'block' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: '0.25rem' }}>
                    {selectedFile ? selectedFile.name : 'Select Candidate Import File'}
                  </p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.825rem', marginBottom: '1rem' }}>
                    Supports .csv and .xlsx formats (Max 500 rows)
                  </p>
                  <input 
                    type="file" 
                    accept=".csv, .xlsx" 
                    onChange={handleFileChange}
                    style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} 
                  />
                  {selectedFile && (
                    <span style={{ display: 'inline-block', fontSize: '0.8rem', color: 'var(--success)', background: 'var(--success-light)', padding: '0.2rem 0.6rem', borderRadius: 4, fontWeight: 600 }}>
                      File Ready ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button className="btn btn-secondary" onClick={handleDownloadTemplate} style={{ fontSize: '0.875rem', gap: '0.375rem', display: 'inline-flex', alignItems: 'center' }}>
                    <Download size={14} /> Download Import Template
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleUploadPreview}
                    disabled={!selectedFile}
                    style={{ minWidth: 120 }}
                  >
                    Validate File
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Preview Table & Validation Results */}
            {importStep === 2 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, overflow: 'hidden' }}>
                {previewSummary ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '0.5rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Total Rows</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>{previewSummary.total}</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--success)' }}>Valid Rows</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--success)' }}>{previewSummary.valid}</div>
                    </div>
                    <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--error)' }}>Invalid Rows</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--error)' }}>{previewSummary.invalid}</div>
                    </div>
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem 1rem', borderRadius: 10, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#d97706' }}>Duplicates</div>
                      <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#d97706' }}>{previewSummary.duplicates}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>Parsing and validating candidate data...</div>
                )}

                {/* Preview Data Grid */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 10 }}>
                  <table className="custom-table" style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 5 }}>
                        <th style={{ width: '50px' }}>Row</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Job Role</th>
                        <th>Campaign</th>
                        <th>Duration</th>
                        <th>Status</th>
                        <th>Validation Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((r, index) => (
                        <tr key={index} style={{ opacity: r.isValid ? 1 : 0.75, background: r.isValid ? 'transparent' : 'rgba(239, 68, 68, 0.02)' }}>
                          <td style={{ color: 'var(--text-tertiary)', fontSize: '0.8rem' }}>{r.rowNumber}</td>
                          <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{r.name || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r.email || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r.roleName || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r.campaignName || '—'}</td>
                          <td style={{ fontSize: '0.85rem' }}>{r.duration ? `${r.duration}m` : '—'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 700,
                              background: r.isValid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: r.isValid ? 'var(--success)' : 'var(--error)'
                            }}>
                              {r.status}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: r.isValid ? 'var(--text-tertiary)' : 'var(--error)' }}>
                            {r.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
                  <button className="btn btn-secondary" onClick={() => setImportStep(1)}>Back</button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleConfirmImport}
                    disabled={!previewSummary || previewSummary.valid === 0}
                  >
                    Import {previewSummary ? previewSummary.valid : 0} Valid Candidates
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Loading Importing Progress */}
            {importStep === 3 && (
              <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <RefreshCw size={40} className="animate-spin" color="var(--primary)" style={{ animation: 'spin 1.5s linear infinite' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600 }}>Importing Candidates</h3>
                <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem', maxWidth: 360 }}>
                  Generating credentials, creating invitation tokens, and dispatching emails. Please wait...
                </p>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            )}

            {/* Step 4: Final Summary & Row Results */}
            {importStep === 4 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1, overflow: 'hidden' }}>
                {importSummary && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Imported</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>{importSummary.imported}</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Invalid</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{importSummary.invalid}</div>
                    </div>
                    <div style={{ background: 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Duplicates</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700 }}>{importSummary.duplicates}</div>
                    </div>
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--success)' }}>Emails Sent</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>{importSummary.emailsSent}</div>
                    </div>
                    <div style={{ background: summary => importSummary.emailsFailed > 0 ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-tertiary)', padding: '0.6rem 0.8rem', borderRadius: 8, border: '1px solid var(--border-primary)' }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-tertiary)' }}>Email Fails</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: importSummary.emailsFailed > 0 ? 'var(--error)' : 'inherit' }}>{importSummary.emailsFailed}</div>
                    </div>
                  </div>
                )}

                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Import Log Summary</h3>

                {/* Import Row Log list */}
                <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-primary)', borderRadius: 10 }}>
                  <table className="custom-table" style={{ width: '100%' }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 5 }}>
                        <th>Candidate</th>
                        <th>Invite Code</th>
                        <th>Interview Link</th>
                        <th>Email Status</th>
                        <th>Log/Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importRows.map((r, index) => (
                        <tr key={index}>
                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{r.name || '—'}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{r.email}</div>
                          </td>
                          <td>
                            {r.invitationCode ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <code style={{ fontFamily: 'monospace', fontSize: '0.8rem', background: 'var(--bg-tertiary)', padding: '0.15rem 0.35rem', borderRadius: 4 }}>{r.invitationCode}</code>
                                <button onClick={() => handleCopyText(r.invitationCode)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }} title="Copy Code">
                                  <Copy size={11} />
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            {r.invitationLink ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.invitationLink}</span>
                                <button onClick={() => handleCopyText(r.invitationLink)} style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', padding: 2 }} title="Copy Link">
                                  <Copy size={11} />
                                </button>
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600,
                              background: r.emailStatus === 'SENT' || r.emailStatus === 'DEVELOPMENT_PREVIEW' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: r.emailStatus === 'SENT' || r.emailStatus === 'DEVELOPMENT_PREVIEW' ? 'var(--success)' : 'var(--error)'
                            }}>
                              {r.emailStatus || 'FAILED'}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.775rem', color: r.status === 'IMPORTED' ? 'var(--text-tertiary)' : 'var(--error)' }}>
                            {r.error || 'Successfully processed'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border-primary)' }}>
                  <button className="btn btn-secondary" onClick={handleExportResults} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem' }}>
                    <Download size={14} /> Export Import Result (CSV)
                  </button>
                  <button className="btn btn-primary" onClick={() => { setShowImportModal(false); setImportStep(1); }} style={{ minWidth: 100 }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
