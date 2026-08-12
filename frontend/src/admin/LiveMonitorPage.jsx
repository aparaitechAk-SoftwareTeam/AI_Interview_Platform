import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Activity, User, Clock, AlertTriangle, Monitor, Wifi, Eye, Pause, XCircle, Flag } from 'lucide-react';
import { interviews } from '../services/api.js';

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_BACKEND_URL) {
    const url = import.meta.env.VITE_BACKEND_URL.replace(/\/+$/, '');
    return url.replace(/\/api\/?$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api\/?$/, '');
  }
  return 'http://localhost:4000';
};

const SOCKET_URL = getSocketUrl();

export default function LiveMonitorPage() {
  const [liveEvents, setLiveEvents] = useState([]);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      socket.emit('join_admin_monitoring');
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('admin_live_update', (data) => {
      setLiveEvents((prev) => [
        { id: Date.now() + Math.random(), ...data, receivedAt: new Date() },
        ...prev.slice(0, 49), // Keep last 50 events
      ]);
    });

    return () => { socket.disconnect(); };
  }, []);

  const handleEmergency = async (interviewId, action) => {
    try {
      if (action === 'pause') await interviews.pause(interviewId);
      else if (action === 'terminate') await interviews.terminate(interviewId);
    } catch (err) {
      console.error('Emergency action failed:', err);
    }
  };

  const stateColors = {
    SPEAKING: '#2563eb',
    LISTENING: '#10b981',
    PROCESSING: '#f59e0b',
    COMPLETED: '#94a3b8',
    INTEGRITY_ALERT: '#ef4444',
    PAUSED: '#f59e0b',
    TERMINATED: '#ef4444',
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Live Monitor</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Real-time interview activity feed</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 999,
            background: connected ? 'var(--success-light)' : 'var(--error-light)',
            color: connected ? 'var(--success)' : 'var(--error)',
            fontSize: '0.85rem', fontWeight: 600,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: connected ? 'var(--success)' : 'var(--error)',
              animation: connected ? 'pulse 2s infinite' : 'none',
            }} />
            <Wifi size={14} />
            {connected ? 'Live' : 'Disconnected'}
          </div>
        </div>
      </div>

      {!connected && (
        <div style={{ background: 'var(--warning-light)', border: '1px solid var(--warning)', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: '1.5rem', color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <AlertTriangle size={18} />
          <span>Not connected to the live monitoring stream. Ensure the backend is running.</span>
        </div>
      )}

      {liveEvents.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
          <Activity size={48} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem', display: 'block' }} />
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>No Active Interviews</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>
            Live events will appear here when candidates start their interviews.
          </p>
        </div>
      ) : (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <Activity size={16} color="var(--primary)" />
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{liveEvents.length} events</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {liveEvents.map((event) => (
              <div key={event.id} className="card" style={{
                padding: '1rem 1.25rem',
                borderLeft: `3px solid ${stateColors[event.state] || 'var(--border-primary)'}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%',
                      background: `${stateColors[event.state] || 'var(--primary)'}20`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {event.state === 'INTEGRITY_ALERT' ? <AlertTriangle size={16} color={stateColors[event.state]} /> : <User size={16} color={stateColors[event.state] || 'var(--primary)'} />}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.candidateName || 'Unknown'}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.1rem' }}>{event.details}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                    <span style={{
                      padding: '0.25rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                      background: `${stateColors[event.state] || 'var(--primary)'}20`,
                      color: stateColors[event.state] || 'var(--primary)',
                    }}>
                      {event.state}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', minWidth: 80, textAlign: 'right' }}>
                      {event.receivedAt?.toLocaleTimeString()}
                    </span>
                    {event.interviewId && (
                      <div style={{ display: 'flex', gap: '0.375rem' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem', fontSize: '0.75rem' }}
                          title="Pause Interview"
                          onClick={() => handleEmergency(event.interviewId, 'pause')}
                        >
                          <Pause size={13} />
                        </button>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.375rem', color: 'var(--error)', borderColor: 'var(--error)' }}
                          title="Terminate Interview"
                          onClick={() => handleEmergency(event.interviewId, 'terminate')}
                        >
                          <XCircle size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
