import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext.jsx';

export default function LoginModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('admin@aiinterview.com');
  const [password, setPassword] = useState('AdminPassword123!');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      onClose();
      navigate('/admin/dashboard');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: 'rgba(2,6,17,0.85)',
      backdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        width: 'min(450px, 100%)',
        background: 'linear-gradient(145deg, rgba(8,18,38,0.95), rgba(3,8,20,0.95))',
        border: '1px solid rgba(112,171,255,0.25)',
        borderRadius: '24px',
        padding: '36px',
        boxShadow: '0 30px 100px rgba(0,100,255,0.3)',
        position: 'relative'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255,255,255,0.08)',
            border: 'none',
            color: '#fff',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: '12px' }}>
            <span className="brand-mark"><span></span><span></span><span></span></span>
            <span>Aparaitech <strong>AI Interview</strong></span>
          </div>
          <p style={{ color: '#8ea0bd', fontSize: '13px', margin: 0 }}>Welcome back! Log in to your Admin Portal.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b4c6df', marginBottom: '6px', fontWeight: 500 }}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@aiinterview.com"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(2,6,17,0.6)',
                border: '1px solid rgba(100,160,255,0.2)',
                color: '#fff',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#b4c6df', marginBottom: '6px', fontWeight: 500 }}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '10px',
                background: 'rgba(2,6,17,0.6)',
                border: '1px solid rgba(100,160,255,0.2)',
                color: '#fff',
                outline: 'none',
                fontSize: '14px'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px', cursor: 'pointer' }}
          >
            {loading ? 'Logging in...' : 'Log In to Admin Portal →'}
          </button>
        </form>
      </div>
    </div>
  );
}
