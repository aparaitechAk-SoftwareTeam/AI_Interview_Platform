import express from 'express';
import InterviewSession from '../models/InterviewSession.js';
import Notification from '../models/Notification.js';
import Admin from '../models/Admin.js';

const router = express.Router();

// Log anti-cheating event
router.post('/event', async (req, res, next) => {
  try {
    const { sessionId, eventType, details } = req.body;

    if (!sessionId || !eventType) {
      return res.status(400).json({ success: false, message: 'Session ID and event type are required' });
    }

    const session = await InterviewSession.findById(sessionId).populate('candidate');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const newEvent = {
      type: eventType,
      details: details || `Cheating event: ${eventType} detected`,
      at: new Date(),
    };

    session.antiCheatingEvents.push(newEvent);
    await session.save();

    // Generate notification if >= 3 cheating violations detected
    if (session.antiCheatingEvents.length >= 3) {
      const defaultAdmin = await Admin.findOne();
      if (defaultAdmin) {
        const exists = await Notification.exists({
          recipient: defaultAdmin._id,
          type: 'HIGH_INTEGRITY_RISK',
          message: new RegExp(session._id.toString()),
        });
        if (!exists) {
          await Notification.create({
            recipient: defaultAdmin._id,
            recipientModel: 'Admin',
            title: 'High Integrity Risk Alert',
            message: `Candidate ${session.candidate ? session.candidate.name : 'Unknown'} has triggered multiple anti-cheating violations (Count: ${session.antiCheatingEvents.length}). Session ID: ${session._id}`,
            type: 'HIGH_INTEGRITY_RISK',
          });
        }
      }
    }

    // Broadcast realtime integrity alert to Admin Live Monitoring
    if (global.io) {
      global.io.to('admin_monitoring').emit('admin_live_update', {
        interviewId: session._id,
        candidateName: session.candidate ? session.candidate.name : 'Unknown Candidate',
        state: 'INTEGRITY_ALERT',
        details: `${eventType}: ${details || 'Violation logged'}`,
        eventCount: session.antiCheatingEvents.length,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Integrity event logged successfully',
      eventCount: session.antiCheatingEvents.length,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
