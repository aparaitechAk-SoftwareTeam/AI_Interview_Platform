import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { Bot, Eye, EyeOff, Loader } from 'lucide-react';

export default function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailType, setEmailType] = useState('text');
  const [passType, setPassType] = useState('text');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '2rem',
    }}>
      {/* Background gradient */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.12) 0%, transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(124,58,237,0.10) 0%, transparent 60%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 420,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 20,
        padding: '2.5rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem',
          }}>
            <Bot size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            AI Interview Platform
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
            Admin Portal — Sign in to continue
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--error-light)', border: '1px solid var(--error)',
            borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.25rem',
            color: 'var(--error)', fontSize: '0.875rem',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Dummy inputs to trap Chrome's password manager autofill on page load */}
          <div style={{ opacity: 0, position: 'absolute', height: 0, width: 0, overflow: 'hidden', zIndex: -1 }} aria-hidden="true">
            <input type="text" name="email_dummy" autoComplete="username" tabIndex="-1" />
            <input type="password" name="password_dummy" autoComplete="current-password" tabIndex="-1" />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type={emailType}
              className="form-input"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onFocus={() => setEmailType('email')}
              required
              autoFocus
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : passType}
                className="form-input"
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onFocus={() => setPassType('password')}
                required
                style={{ paddingRight: '3rem' }}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={{
                  position: 'absolute', right: '0.875rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                  display: 'flex', alignItems: 'center',
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', marginTop: '0.5rem' }}
          >
            {loading ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Signing in...
              </>
            ) : 'Sign In to Admin Portal'}
          </button>
        </form>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
