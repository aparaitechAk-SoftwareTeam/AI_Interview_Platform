import express from 'express';
import Candidate from '../models/Candidate.js';
import Invitation from '../models/Invitation.js';
import InterviewSession from '../models/InterviewSession.js';
import Campaign from '../models/Campaign.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const totalCandidates = await Candidate.countDocuments({ isActive: true });
    
    // Invitation counts
    const invitationsSent = await Invitation.countDocuments();
    const unusedInvitations = await Invitation.countDocuments({ status: 'UNUSED' });
    const openedInvitations = await Invitation.countDocuments({ status: 'OPENED' });
    const activatedInvitations = await Invitation.countDocuments({ status: 'ACTIVATED' });
    const expiredInvitations = await Invitation.countDocuments({ status: 'EXPIRED' });
    
    // Interview states
    const scheduledInterviews = await Candidate.countDocuments({ status: 'READY', isActive: true });
    const liveInterviews = await InterviewSession.countDocuments({ status: 'STARTED' });
    const completedInterviews = await InterviewSession.countDocuments({ status: 'COMPLETED' });
    
    // Results
    const resultsPendingReview = await InterviewSession.countDocuments({ status: 'COMPLETED', resultReleased: false });
    
    // Pipeline counts
    const shortlistedCount = await Candidate.countDocuments({ pipelineStage: 'SHORTLISTED', isActive: true });
    const selectedCount = await Candidate.countDocuments({ pipelineStage: 'SELECTED', isActive: true });
    const rejectedCount = await Candidate.countDocuments({ pipelineStage: 'REJECTED', isActive: true });
    const holdCount = await Candidate.countDocuments({ pipelineStage: 'HOLD', isActive: true });

    // Integrity count - candidates having more than 3 anti cheating logs
    const highIntegrityRisk = await InterviewSession.countDocuments({
      'antiCheatingEvents.3': { $exists: true } // Array has 4 or more elements
    });

    const campaignCount = await Campaign.countDocuments();

    // Lists
    const recentCandidates = await Candidate.find({ isActive: true })
      .populate('jobRole', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentInterviews = await InterviewSession.find()
      .populate('candidate', 'name email')
      .populate('jobRole', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      stats: {
        totalCandidates,
        invitationsSent,
        unusedInvitations,
        openedInvitations,
        activatedInvitations,
        expiredInvitations,
        scheduledInterviews,
        liveInterviews,
        completedInterviews,
        resultsPendingReview,
        shortlistedCount,
        selectedCount,
        rejectedCount,
        holdCount,
        highIntegrityRisk,
        campaignCount,
      },
      recentCandidates,
      recentInterviews,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
