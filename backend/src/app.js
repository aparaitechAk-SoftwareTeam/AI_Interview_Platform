import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler } from './middleware/errorHandler.js';

// Import routes (we will create these modules next)
import adminAuthRoutes from './routes/adminAuth.js';
import dashboardRoutes from './routes/dashboard.js';
import candidateRoutes from './routes/candidates.js';
import jobRoleRoutes from './routes/jobRoles.js';
import templateRoutes from './routes/templates.js';
import questionBankRoutes from './routes/questionBank.js';
import campaignRoutes from './routes/campaigns.js';
import invitationRoutes from './routes/invitations.js';
import resumeRoutes from './routes/resumes.js';
import identityRoutes from './routes/identity.js';
import systemCheckRoutes from './routes/systemCheck.js';
import calibrationRoutes from './routes/calibration.js';
import interviewRoutes from './routes/interviews.js';
import antiCheatingRoutes from './routes/antiCheating.js';
import reportRoutes from './routes/reports.js';
import resultRoutes from './routes/results.js';
import notificationRoutes from './routes/notifications.js';
import analyticsRoutes from './routes/analytics.js';
import exportRoutes from './routes/exports.js';
import auditLogRoutes from './routes/auditLog.js';
import emailRoutes from './routes/email.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Helmet Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : ['http://localhost:5173'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Request Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Uploaded Files static folder
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const { getEmailService } = await import('./services/email/EmailService.js').catch(() => ({ getEmailService: () => ({ isConfigured: false }) }));
  const emailService = getEmailService();

  let outboundIp = 'Unknown';
  try {
    const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) });
    if (ipRes.ok) {
      const ipData = await ipRes.json();
      outboundIp = ipData.ip;
    }
  } catch (err) {
    // Fallback or ignore timeout
  }

  res.status(200).json({
    success: true,
    server: 'Running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    environment: process.env.NODE_ENV || 'development',
    emailConfigured: emailService ? emailService.isConfigured : false,
    emailDiagnostic: emailService?.getDiagnosticInfo ? emailService.getDiagnosticInfo() : null,
    outboundIp,
    timestamp: new Date().toISOString(),
  });
});

// Import mongoose so health check works
import mongoose from 'mongoose';

// Mounting routes
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/candidates', candidateRoutes);
app.use('/api/job-roles', jobRoleRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/question-bank', questionBankRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/identity', identityRoutes);
app.use('/api/system-check', systemCheckRoutes);
app.use('/api/calibration', calibrationRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/anti-cheating', antiCheatingRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/audit-log', auditLogRoutes);
app.use('/api/admin/email', emailRoutes);

// General error handling middleware
app.use(errorHandler);

export default app;
