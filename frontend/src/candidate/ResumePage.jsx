import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { resumes } from '../services/api.js';
import CandidateLayout from '../layouts/CandidateLayout.jsx';
import { Upload, FileText, CheckCircle, ArrowRight, Loader } from 'lucide-react';

export default function ResumePage() {
  const navigate = useNavigate();
  const fileRef = useRef();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');

  const candidateId = sessionStorage.getItem('candidateId');

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
      setError('Only PDF or DOCX files are accepted.');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.');
      return;
    }
    setError('');
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file || !candidateId) return;
    setUploading(true);
    setError('');
    try {
      const res = await resumes.upload(candidateId, file);
      setParsed(res.data.data.parsed);
      sessionStorage.setItem('resumeUploaded', 'true');
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <CandidateLayout>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 1.5rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.375rem' }}>Upload Your Resume</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Your resume helps the AI tailor questions to your experience.
          </p>
        </div>

        {error && (
          <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.25rem', color: 'var(--error)', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {!parsed ? (
          <div className="card">
            {/* Drop zone */}
            <div
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${file ? 'var(--success)' : 'var(--border-primary)'}`,
                borderRadius: 12, padding: '3rem', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.2s ease', marginBottom: '1.5rem',
                background: file ? 'var(--success-light)' : 'var(--bg-tertiary)',
              }}
            >
              {file ? (
                <>
                  <CheckCircle size={40} color="var(--success)" style={{ margin: '0 auto 0.875rem', display: 'block' }} />
                  <p style={{ fontWeight: 600, color: 'var(--success)', marginBottom: '0.375rem' }}>{file.name}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </>
              ) : (
                <>
                  <Upload size={40} color="var(--text-tertiary)" style={{ margin: '0 auto 0.875rem', display: 'block' }} />
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.375rem' }}>Click to upload resume</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>PDF or DOCX — max 5MB</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept=".pdf,.docx" style={{ display: 'none' }} onChange={handleFile} />

            <button
              className="btn btn-primary"
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{ width: '100%', padding: '0.875rem' }}
            >
              {uploading ? (
                <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> Uploading & Analyzing...</>
              ) : (
                <><Upload size={18} /> Upload Resume</>
              )}
            </button>
          </div>
        ) : (
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <CheckCircle size={24} color="var(--success)" />
              <div>
                <p style={{ fontWeight: 700, color: 'var(--success)' }}>Resume Uploaded & Analyzed!</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>AI has extracted your professional profile</p>
              </div>
            </div>

            {parsed.skills?.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '0.5rem' }}>Detected Skills</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {parsed.skills.map((s) => (
                    <span key={s} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 500 }}>{s}</span>
                  ))}
                </div>
              </div>
            )}

            <button
              className="btn btn-primary"
              onClick={() => navigate('/interview/identity')}
              style={{ width: '100%', padding: '0.875rem', marginTop: '1rem' }}
            >
              Continue to Identity Verification <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </CandidateLayout>
  );
}
