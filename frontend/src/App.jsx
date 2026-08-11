import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Components
import ErrorBoundary from './components/ErrorBoundary.jsx';

// Contexts
import { AdminAuthProvider } from './context/AdminAuthContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';

// Protected Route Wrapper
import { ProtectedAdminRoute } from './routes/ProtectedAdminRoute.jsx';

// Layouts
import AdminLayout from './layouts/AdminLayout.jsx';

// Admin Pages
import AdminLogin from './admin/LoginPage.jsx';
import AdminDashboard from './admin/DashboardPage.jsx';
import CandidatesPage from './admin/CandidatesPage.jsx';
import CandidateDetailPage from './admin/CandidateDetailPage.jsx';
import JobRolesPage from './admin/JobRolesPage.jsx';
import TemplatesPage from './admin/TemplatesPage.jsx';
import QuestionBankPage from './admin/QuestionBankPage.jsx';
import CampaignsPage from './admin/CampaignsPage.jsx';
import LiveMonitorPage from './admin/LiveMonitorPage.jsx';
import ResultsPage from './admin/ResultsPage.jsx';
import AnalyticsPage from './admin/AnalyticsPage.jsx';
import NotificationsPage from './admin/NotificationsPage.jsx';
import AuditLogPage from './admin/AuditLogPage.jsx';

// Candidate Pages
import InvitePage from './candidate/InvitePage.jsx';
import InviteLinkPage from './candidate/InviteLinkPage.jsx';
import CandidateDashboard from './candidate/DashboardPage.jsx';
import ResumePage from './candidate/ResumePage.jsx';
import IdentityPage from './candidate/IdentityPage.jsx';
import SystemCheckPage from './candidate/SystemCheckPage.jsx';
import CalibrationPage from './candidate/CalibrationPage.jsx';
import InstructionsPage from './candidate/InstructionsPage.jsx';
import InterviewRoomPage from './candidate/InterviewRoomPage.jsx';
import ResultReleasedPage from './candidate/ResultReleasedPage.jsx';

export default function App() {
  return (
    <ThemeProvider>
      <AdminAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Redirects */}
            <Route path="/" element={<Navigate to="/interview" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

            {/* Admin Auth */}
            <Route path="/admin/login" element={<AdminLogin />} />

            {/* Admin Portal (Protected) */}
            <Route path="/admin/*" element={
              <ProtectedAdminRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="dashboard" element={<ErrorBoundary title="Unable to load Dashboard"><AdminDashboard /></ErrorBoundary>} />
                    <Route path="candidates" element={<ErrorBoundary title="Unable to load Candidates"><CandidatesPage /></ErrorBoundary>} />
                    <Route path="candidates/:id" element={<ErrorBoundary title="Unable to load Candidate details"><CandidateDetailPage /></ErrorBoundary>} />
                    <Route path="job-roles" element={<ErrorBoundary title="Unable to load Job Roles"><JobRolesPage /></ErrorBoundary>} />
                    <Route path="templates" element={<ErrorBoundary title="Unable to load Templates"><TemplatesPage /></ErrorBoundary>} />
                    <Route path="question-bank" element={<ErrorBoundary title="Unable to load Question Bank"><QuestionBankPage /></ErrorBoundary>} />
                    <Route path="campaigns" element={<ErrorBoundary title="Unable to load Campaigns"><CampaignsPage /></ErrorBoundary>} />
                    <Route path="live" element={<ErrorBoundary title="Unable to load Live Monitor"><LiveMonitorPage /></ErrorBoundary>} />
                    <Route path="results" element={<ErrorBoundary title="Unable to load Results"><ResultsPage /></ErrorBoundary>} />
                    <Route path="analytics" element={<ErrorBoundary title="Unable to load Analytics"><AnalyticsPage /></ErrorBoundary>} />
                    <Route path="notifications" element={<ErrorBoundary title="Unable to load Notifications"><NotificationsPage /></ErrorBoundary>} />
                    <Route path="audit-log" element={<ErrorBoundary title="Unable to load Audit Log"><AuditLogPage /></ErrorBoundary>} />
                    <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                  </Routes>
                </AdminLayout>
              </ProtectedAdminRoute>
            } />

            {/* Candidate Portal */}
            <Route path="/interview" element={<InvitePage />} />
            <Route path="/interview/invite/:token" element={<InviteLinkPage />} />
            <Route path="/interview/dashboard" element={<CandidateDashboard />} />
            <Route path="/interview/resume" element={<ResumePage />} />
            <Route path="/interview/identity" element={<IdentityPage />} />
            <Route path="/interview/system-check" element={<SystemCheckPage />} />
            <Route path="/interview/calibration" element={<CalibrationPage />} />
            <Route path="/interview/instructions" element={<InstructionsPage />} />
            <Route path="/interview/session/start" element={<InterviewRoomPage />} />
            <Route path="/interview/results/:id" element={<ResultReleasedPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/interview" replace />} />
          </Routes>
        </BrowserRouter>
      </AdminAuthProvider>
    </ThemeProvider>
  );
}
