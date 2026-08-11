import express from 'express';
import InterviewSession from '../models/InterviewSession.js';
import Candidate from '../models/Candidate.js';
import { protectAdmin } from '../middleware/auth.js';
import { getLLMProvider } from '../services/ai/index.js';

const router = express.Router();

// Retrieve detailed interview timeline report
router.get('/session/:id', protectAdmin, async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('candidate')
      .populate('jobRole')
      .populate('template');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session report not found' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// Regenerate AI final evaluation report
router.post('/session/:id/regenerate', protectAdmin, async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id).populate('candidate');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const llm = getLLMProvider();
    const report = await llm.generateFinalReport(session, session.candidate);

    session.report = {
      summary: report.summary,
      strengths: report.strengths,
      weaknesses: report.weaknesses,
      recommendation: report.recommendation,
    };
    await session.save();

    res.status(200).json({ success: true, message: 'Report regenerated successfully', data: session.report });
  } catch (error) {
    next(error);
  }
});

export default router;
