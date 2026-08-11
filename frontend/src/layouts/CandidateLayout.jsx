import React from 'react';
import { Bot } from 'lucide-react';

export default function CandidateLayout({ children, showHeader = true }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {showHeader && (
        <header style={{
          height: 64,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem',
          gap: '0.75rem',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Bot size={16} color="#fff" />
          </div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text-primary)',
          }}>
            AI Interview Platform
          </span>
        </header>
      )}
      <main style={{ flex: 1 }}>
        {children}
      </main>
    </div>
  );
}
