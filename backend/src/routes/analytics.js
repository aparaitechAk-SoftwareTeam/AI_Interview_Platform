import express from 'express';
import Candidate from '../models/Candidate.js';
import InterviewSession from '../models/InterviewSession.js';
import Campaign from '../models/Campaign.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const { campaignId, roleId } = req.query;
    
    // Base filters
    const candFilter = { isActive: true };
    const sessionFilter = {};

    if (campaignId) {
      candFilter.campaign = campaignId;
      sessionFilter.campaign = campaignId;
    }
    if (roleId) {
      candFilter.jobRole = roleId;
      sessionFilter.jobRole = roleId;
    }

    const totalCands = await Candidate.countDocuments(candFilter);
    const completedSessions = await InterviewSession.find({ ...sessionFilter, status: 'COMPLETED' });
    const totalCompleted = completedSessions.length;

    // Averages calculations
    let avgOverall = 0;
    let avgTechnical = 0;
    let avgCommunication = 0;
    let avgProblemSolving = 0;
    let avgAptitude = 0;
    let avgResume = 0;

    if (totalCompleted > 0) {
      const sums = completedSessions.reduce((acc, sess) => {
        acc.overall += sess.scores.overall || 0;
        acc.technical += sess.scores.technical || 0;
        acc.communication += sess.scores.communication || 0;
        acc.problemSolving += sess.scores.problemSolving || 0;
        acc.aptitude += sess.scores.aptitude || 0;
        acc.resume += sess.scores.resume || 0;
        return acc;
      }, { overall: 0, technical: 0, communication: 0, problemSolving: 0, aptitude: 0, resume: 0 });

      avgOverall = Math.round(sums.overall / totalCompleted);
      avgTechnical = Math.round(sums.technical / totalCompleted);
      avgCommunication = Math.round(sums.communication / totalCompleted);
      avgProblemSolving = Math.round(sums.problemSolving / totalCompleted);
      avgAptitude = Math.round(sums.aptitude / totalCompleted);
      avgResume = Math.round(sums.resume / totalCompleted);
    }

    // Pipeline funnel counts
    const invited = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'INVITED' });
    const ready = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'READY' });
    const interviewing = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'INTERVIEWING' });
    const underReview = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'UNDER_REVIEW' });
    const shortlisted = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'SHORTLISTED' });
    const selected = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'SELECTED' });
    const rejected = await Candidate.countDocuments({ ...candFilter, pipelineStage: 'REJECTED' });

    res.status(200).json({
      success: true,
      data: {
        totals: {
          candidates: totalCands,
          completed: totalCompleted,
          completionRate: totalCands > 0 ? Math.round((totalCompleted / totalCands) * 100) : 0,
        },
        averages: {
          overall: avgOverall,
          technical: avgTechnical,
          communication: avgCommunication,
          problemSolving: avgProblemSolving,
          aptitude: avgAptitude,
          resume: avgResume,
        },
        pipelineFunnel: {
          invited,
          ready,
          interviewing,
          underReview,
          shortlisted,
          selected,
          rejected,
        },
        competenciesDistribution: {
          technical: avgTechnical,
          communication: avgCommunication,
          problemSolving: avgProblemSolving,
          aptitude: avgAptitude,
          resume: avgResume,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
