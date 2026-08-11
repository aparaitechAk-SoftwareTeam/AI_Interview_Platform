import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';

export const ProtectedAdminRoute = ({ children }) => {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-primary)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid var(--border-primary)', borderTopColor: 'var(--primary)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}></div>
          <p style={{ color: 'var(--text-secondary)' }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};
