import 'dotenv/config';
import http from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { connectDB } from './config/db.js';
import { seedInitialData } from './utils/seed.js';
import { startFollowUpScheduler } from './services/scheduler/FollowUpScheduler.js';

const PORT = process.env.PORT || 4000;

async function startServer() {
  // Connect to Database (with memory server fallback)
  await connectDB();

  // Run startup seeder
  await seedInitialData();

  // Start background job that sends the 2-3 day follow-up emails for HOLD/REJECTED decisions
  startFollowUpScheduler();

  const server = http.createServer(app);

  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
    : ['http://localhost:5173'];

  // Initialize Socket.IO with CORS
  const io = new Server(server, {
    cors: {
      origin: allowedOrigins.includes('*') ? '*' : allowedOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Make io available globally
  global.io = io;

  // Real-time events connection handling
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] New client connected: ${socket.id}`);

    // Join admin monitoring room
    socket.on('join_admin_monitoring', () => {
      socket.join('admin_monitoring');
      console.log(`[Socket.IO] Socket ${socket.id} joined admin_monitoring`);
    });

    // Join specific interview session room
    socket.on('join_interview_room', (data) => {
      const { interviewId } = data;
      if (interviewId) {
        socket.join(`interview_${interviewId}`);
        console.log(`[Socket.IO] Socket ${socket.id} joined room: interview_${interviewId}`);
      }
    });

    // Candidate sends live event
    socket.on('candidate_activity', (data) => {
      const { interviewId, candidateName, state, details } = data;
      // Broadcast status update to all admins
      io.to('admin_monitoring').emit('admin_live_update', {
        interviewId,
        candidateName,
        state,
        details,
        timestamp: new Date(),
      });
    });

    // Admin triggers emergency action
    socket.on('admin_emergency_action', (data) => {
      const { interviewId, action } = data; // 'pause' | 'terminate' | 'resume'
      io.to(`interview_${interviewId}`).emit('emergency_control', { action });
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ FATAL: Port ${PORT} is already in use by another process. Please check if another instance of the AI Interview backend is running, or terminate the process listening on port ${PORT}.`);
      process.exit(1);
    } else {
      console.error('[Server] Server error event:', err);
      process.exit(1);
    }
  });

  server.listen(PORT, () => {
    console.log(`[Server] running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup error:', err);
  process.exit(1);
});
