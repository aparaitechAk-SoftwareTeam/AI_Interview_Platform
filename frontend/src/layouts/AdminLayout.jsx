import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import {
  LayoutDashboard, Users, Briefcase, FileText, BookOpen,
  Megaphone, Video, BarChart2, Bell, ClipboardList, Settings,
  LogOut, ChevronLeft, ChevronRight, Sun, Moon, Bot, Activity
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin/dashboard' },
  { label: 'Candidates', icon: Users, to: '/admin/candidates' },
  { label: 'Job Roles', icon: Briefcase, to: '/admin/job-roles' },
  { label: 'Templates', icon: FileText, to: '/admin/templates' },
  { label: 'Question Bank', icon: BookOpen, to: '/admin/question-bank' },
  { label: 'Campaigns', icon: Megaphone, to: '/admin/campaigns' },
  { label: 'Live Monitor', icon: Activity, to: '/admin/live' },
  { label: 'Results', icon: Video, to: '/admin/results' },
  { label: 'Analytics', icon: BarChart2, to: '/admin/analytics' },
  { label: 'Notifications', icon: Bell, to: '/admin/notifications' },
  { label: 'Audit Log', icon: ClipboardList, to: '/admin/audit-log' },
];

export default function AdminLayout({ children }) {
  const { admin, logout } = useAdminAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="app-container" style={{ background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 70 : 260,
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-primary)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{
          padding: collapsed ? '1.25rem 0' : '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
          minHeight: 70,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Bot size={20} color="#fff" />
          </div>
          {!collapsed && (
            <div>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                AI Interview
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>
                Admin Portal
              </div>
            </div>
          )}
        </div>

        {/* Nav Links */}
        <nav style={{ flex: 1, padding: collapsed ? '1rem 0' : '1rem 0.75rem', overflowY: 'auto', overflowX: 'hidden' }}>
          {navItems.map(({ label, icon: Icon, to }) => (
            <NavLink
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: collapsed ? 0 : '0.75rem',
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0.875rem' : '0.75rem 1rem',
                borderRadius: 8,
                marginBottom: 2,
                color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--primary-light)' : 'transparent',
                fontWeight: 500,
                fontSize: '0.9rem',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              })}
            >
              <Icon size={18} strokeWidth={2} />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: collapsed ? '1rem 0' : '1rem 0.75rem', borderTop: '1px solid var(--border-primary)' }}>
          <button
            onClick={toggle}
            title={collapsed ? 'Toggle theme' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : '0.75rem', justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0.875rem' : '0.75rem 1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--text-secondary)', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500,
              marginBottom: 4,
            }}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            {!collapsed && (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
          </button>

          <button
            onClick={handleLogout}
            title={collapsed ? 'Logout' : undefined}
            style={{
              width: '100%', display: 'flex', alignItems: 'center',
              gap: collapsed ? 0 : '0.75rem', justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '0.875rem' : '0.75rem 1rem',
              background: 'transparent', border: 'none', cursor: 'pointer',
              color: 'var(--error)', borderRadius: 8, fontSize: '0.9rem', fontWeight: 500,
            }}
          >
            <LogOut size={18} />
            {!collapsed && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100vh', overflowY: 'auto' }}>
        {/* Topbar */}
        <header style={{
          height: 70, background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 2rem', position: 'sticky', top: 0, zIndex: 5,
        }}>
          <button
            onClick={() => setCollapsed((p) => !p)}
            style={{
              background: 'transparent', border: '1px solid var(--border-primary)',
              borderRadius: 8, padding: '0.5rem', cursor: 'pointer',
              color: 'var(--text-secondary)', display: 'flex', alignItems: 'center',
            }}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: '0.85rem',
            }}>
              {admin?.name?.[0] || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {admin?.name || 'Admin'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                {admin?.email}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div style={{ padding: '2rem', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
