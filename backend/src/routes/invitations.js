import express from 'express';
import Invitation from '../models/Invitation.js';
import Candidate from '../models/Candidate.js';

const router = express.Router();

// Verify Invitation Code
router.get('/verify-code/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const invitation = await Invitation.findOne({ code: code.toUpperCase() }).populate({
      path: 'candidate',
      populate: { path: 'jobRole', select: 'name' },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invalid invitation code' });
    }

    if (invitation.status === 'REVOKED') {
      return res.status(403).json({ success: false, message: 'This invitation has been revoked' });
    }

    if (new Date() > invitation.expiresAt || invitation.status === 'EXPIRED') {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(403).json({ success: false, message: 'This invitation has expired' });
    }

    if (invitation.status === 'COMPLETED') {
      return res.status(403).json({ success: false, message: 'This interview has already been completed' });
    }

    // Single-use enforcement: once a code has been activated (successfully used to
    // enter the portal) it cannot be used again. Candidates who need another attempt
    // must be issued a fresh code by an admin (see /candidates/:id/regenerate-code).
    if (['ACTIVATED', 'STARTED'].includes(invitation.status)) {
      return res.status(403).json({
        success: false,
        message: 'This invitation code has already been used and cannot be reused. Please contact the recruiter to receive a new code.',
      });
    }

    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
});

// Verify Invitation Link Secure Token
router.get('/verify-link/:token', async (req, res, next) => {
  try {
    const { token } = req.params;
    const invitation = await Invitation.findOne({ linkToken: token }).populate({
      path: 'candidate',
      populate: { path: 'jobRole', select: 'name' },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invalid secure link token' });
    }

    if (invitation.status === 'REVOKED') {
      return res.status(403).json({ success: false, message: 'This invitation has been revoked' });
    }

    if (new Date() > invitation.expiresAt || invitation.status === 'EXPIRED') {
      invitation.status = 'EXPIRED';
      await invitation.save();
      return res.status(403).json({ success: false, message: 'This invitation has expired' });
    }

    if (invitation.status === 'COMPLETED') {
      return res.status(403).json({ success: false, message: 'This interview has already been completed' });
    }

    if (['ACTIVATED', 'STARTED'].includes(invitation.status)) {
      return res.status(403).json({
        success: false,
        message: 'This invitation link has already been used and cannot be reused. Please contact the recruiter to receive a new code.',
      });
    }

    res.status(200).json({ success: true, data: invitation });
  } catch (error) {
    next(error);
  }
});

// Activate Invitation
router.post('/activate', async (req, res, next) => {
  try {
    const { invitationId, deviceId } = req.body;

    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'Invitation not found' });
    }

    if (invitation.status === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Interview already completed' });
    }

    if (['ACTIVATED', 'STARTED'].includes(invitation.status)) {
      return res.status(400).json({
        success: false,
        message: 'This invitation code has already been used and cannot be reused. Please contact the recruiter to receive a new code.',
      });
    }

    // Lock deviceId and update status
    invitation.status = 'ACTIVATED';
    invitation.activatedAt = new Date();
    if (deviceId) {
      invitation.deviceId = deviceId;
    }
    await invitation.save();

    // Update candidate status to ACTIVATED and pipeline to READY
    const candidate = await Candidate.findById(invitation.candidate);
    if (candidate) {
      candidate.status = 'ACTIVATED';
      candidate.pipelineStage = 'READY';
      candidate.pipelineHistory.push({
        stage: 'READY',
        note: 'Invitation activated by candidate',
      });
      await candidate.save();
    }

    res.status(200).json({ success: true, message: 'Invitation activated successfully', data: invitation });
  } catch (error) {
    next(error);
  }
});

export default router;
