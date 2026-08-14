import React, { useEffect, useState } from 'react';
import { settings as settingsApi } from '../services/api.js';
import { Sliders, Save, CheckCircle2, AlertCircle, Shield, Clock, HelpCircle, FileCheck } from 'lucide-react';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    durationMinutes: 5,
    maxQuestions: 8,
    adaptiveDifficulty: true,
    recordingRetentionDays: 90,
    antiCheatingStrictness: 'Medium',
    calibrationRequired: true,
    weights: {
      technical: 40,
      aptitude: 10,
      resume: 20,
      communication: 10,
      problemSolving: 20,
    },
  });

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await settingsApi.get();
      const s = res.data.settings || res.data.data;
      if (s) {
        setFormData({
          durationMinutes: s.durationMinutes || 5,
          maxQuestions: s.maxQuestions || 8,
          adaptiveDifficulty: s.adaptiveDifficulty !== undefined ? s.adaptiveDifficulty : true,
          recordingRetentionDays: s.recordingRetentionDays || 90,
          antiCheatingStrictness: s.antiCheatingStrictness || 'Medium',
          calibrationRequired: s.calibrationRequired !== undefined ? s.calibrationRequired : true,
          weights: s.weights || { technical: 40, aptitude: 10, resume: 20, communication: 10, problemSolving: 20 },
        });
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load settings. Using defaults.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const totalWeights = Object.values(formData.weights).reduce((acc, val) => acc + (Number(val) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (totalWeights !== 100) {
      setError(`Scoring weights must equal exactly 100%. Current sum: ${totalWeights}%`);
      return;
    }

    setSaving(true);
    try {
      const res = await settingsApi.update(formData);
      setMessage(res.data.message || 'Platform settings updated successfully!');
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleWeightChange = (key, value) => {
    const num = Math.max(0, Math.min(100, parseInt(value || '0', 10)));
    setFormData(prev => ({
      ...prev,
      weights: { ...prev.weights, [key]: num }
    }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-tertiary)' }}>Loading settings...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sliders size={24} color="var(--primary)" /> Platform Interview Settings
          </h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9rem' }}>
            Configure global interview defaults, scoring weight distributions, and anti-cheating strictness.
          </p>
        </div>
      </div>

      {message && (
        <div style={{ background: 'var(--success-light)', border: '1px solid var(--success)', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.5rem', color: 'var(--success)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle2 size={18} /> {message}
        </div>
      )}

      {error && (
        <div style={{ background: 'var(--error-light)', border: '1px solid var(--error)', borderRadius: 8, padding: '0.875rem 1rem', marginBottom: '1.5rem', color: 'var(--error)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          
          {/* General Interview Defaults */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--primary)" /> General Interview Parameters
            </h3>

            <div className="form-group">
              <label className="form-label">Interview Duration (Minutes)</label>
              <input
                type="number"
                className="form-input"
                min="5" max="60"
                value={formData.durationMinutes}
                onChange={e => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) || 5 })}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Default countdown duration for new candidate sessions.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Maximum Questions Per Session</label>
              <input
                type="number"
                className="form-input"
                min="3" max="30"
                value={formData.maxQuestions}
                onChange={e => setFormData({ ...formData, maxQuestions: parseInt(e.target.value) || 8 })}
                required
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Maximum number of questions asked before auto-completing the interview.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Proctoring Video Retention (Days)</label>
              <input
                type="number"
                className="form-input"
                min="1" max="365"
                value={formData.recordingRetentionDays}
                onChange={e => setFormData({ ...formData, recordingRetentionDays: parseInt(e.target.value) || 90 })}
                required
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.adaptiveDifficulty}
                  onChange={e => setFormData({ ...formData, adaptiveDifficulty: e.target.checked })}
                />
                Enable Adaptive Question Difficulty (Escalate / Clarify / Switch)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={formData.calibrationRequired}
                  onChange={e => setFormData({ ...formData, calibrationRequired: e.target.checked })}
                />
                Require Audio Calibration & Mic Check Before Interview Entry
              </label>
            </div>
          </div>

          {/* Anti-Cheating & Integrity */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Shield size={18} color="var(--warning)" /> Anti-Cheating & Integrity Control
            </h3>

            <div className="form-group">
              <label className="form-label">Anti-Cheating Strictness Level</label>
              <select
                className="form-input"
                value={formData.antiCheatingStrictness}
                onChange={e => setFormData({ ...formData, antiCheatingStrictness: e.target.value })}
              >
                <option value="Low">Low — Log warnings only</option>
                <option value="Medium">Medium — Tab switch & Focus loss detection (Recommended)</option>
                <option value="High">High — Enforce strict fullscreen & Gaze deviation monitoring</option>
                <option value="Strict">Strict — Auto-pause session on consecutive integrity violations</option>
              </select>
            </div>

            {/* Scoring Weight Distribution */}
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>Scoring Weights Distribution</label>
                <span style={{
                  fontSize: '0.85rem', fontWeight: 700,
                  color: totalWeights === 100 ? 'var(--success)' : 'var(--error)',
                  padding: '0.2rem 0.6rem', borderRadius: 999,
                  background: totalWeights === 100 ? 'var(--success-light)' : 'var(--error-light)',
                }}>
                  Total: {totalWeights}% {totalWeights === 100 ? '✓' : '(Must be 100%)'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  { key: 'technical', label: 'Technical Proficiency Weight (%)' },
                  { key: 'problemSolving', label: 'Problem Solving & Architecture (%)' },
                  { key: 'resume', label: 'Resume Fact Grounding (%)' },
                  { key: 'communication', label: 'Communication & Verbal Clarity (%)' },
                  { key: 'aptitude', label: 'Logical Aptitude (%)' },
                ].map(({ key, label }) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{label}</span>
                    <input
                      type="number"
                      className="form-input"
                      style={{ width: 90, textAlign: 'center', padding: '0.375rem 0.5rem' }}
                      min="0" max="100"
                      value={formData.weights[key]}
                      onChange={e => handleWeightChange(key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || totalWeights !== 100}
            style={{ padding: '0.875rem 2.5rem', fontSize: '1rem' }}
          >
            <Save size={18} style={{ marginRight: '0.5rem' }} />
            {saving ? 'Saving Settings...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
