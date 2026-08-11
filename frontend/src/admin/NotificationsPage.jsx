import React, { useEffect, useState } from 'react';
import { notifications } from '../services/api.js';
import { Bell, BellOff, CheckCircle2, AlertTriangle, Eye, RefreshCw, Star, Info, Mail } from 'lucide-react';

export default function NotificationsPage() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await notifications.list();
      setList(res.data.data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notifications.read(id);
      setList(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'HIGH_INTEGRITY_RISK':
      case 'INVITE_FAILED':
        return <AlertTriangle size={18} color="var(--error)" />;
      case 'INTERVIEW_COMPLETED':
      case 'RESULT_RELEASED':
        return <CheckCircle2 size={18} color="var(--success)" />;
      case 'INTERVIEW_STARTED':
        return <Info size={18} color="var(--primary)" />;
      case 'INVITE_SENT':
        return <Mail size={18} color="var(--primary)" />;
      default:
        return <Bell size={18} color="var(--text-tertiary)" />;
    }
  };

  const filteredList = list.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = list.filter(n => !n.isRead).length;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>Notifications</h1>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '0.875rem' }}>Real-time system updates, integrity alerts, and audit highlights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={fetchNotifications} title="Refresh"><RefreshCw size={15} /></button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border-primary)', marginBottom: '1.5rem', paddingBottom: '0.25rem' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem',
            color: filter === 'all' ? 'var(--primary)' : 'var(--text-tertiary)',
            borderBottom: filter === 'all' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          All ({list.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem',
            color: filter === 'unread' ? 'var(--primary)' : 'var(--text-tertiary)',
            borderBottom: filter === 'unread' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('read')}
          style={{
            background: 'none', border: 'none', padding: '0.5rem 1rem',
            color: filter === 'read' ? 'var(--primary)' : 'var(--text-tertiary)',
            borderBottom: filter === 'read' ? '2px solid var(--primary)' : 'none',
            fontWeight: 600, cursor: 'pointer', fontSize: '0.95rem'
          }}
        >
          Read ({list.length - unreadCount})
        </button>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {loading ? (
          <p style={{ color: 'var(--text-tertiary)' }}>Loading alerts...</p>
        ) : filteredList.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <BellOff size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-tertiary)' }}>No notifications in this folder.</p>
          </div>
        ) : (
          filteredList.map((n) => (
            <div
              key={n._id}
              onClick={() => !n.isRead && handleMarkRead(n._id)}
              className="card"
              style={{
                display: 'flex', gap: '1rem', padding: '1.25rem', alignItems: 'flex-start',
                borderLeft: n.isRead ? '3px solid transparent' : '3px solid var(--primary)',
                background: n.isRead ? 'var(--bg-secondary)' : 'var(--bg-tertiary)',
                cursor: n.isRead ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ marginTop: '0.15rem' }}>
                {getAlertIcon(n.type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{n.title || 'Platform Alert'}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: '1.4' }}>
                  {n.message}
                </p>
                {!n.isRead && (
                  <span style={{ display: 'inline-block', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 600, marginTop: '0.5rem' }}>
                    ● Click to mark as read
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
