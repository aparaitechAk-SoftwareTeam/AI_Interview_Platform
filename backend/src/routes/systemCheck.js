import express from 'express';
import Candidate from '../models/Candidate.js';

const router = express.Router();

// Save system compatibility checks
router.post('/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { browser, isDesktop, hasCamera, hasMic, hasSpeaker, internetSpeed, latency, fullscreenSupport, mediaRecorderSupport, status } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Save checks directly to Candidate
    // We can also set Candidate status to READY if checks pass
    if (status === 'PASS' && candidate.status === 'ACTIVATED') {
      candidate.status = 'READY';
      candidate.pipelineStage = 'READY';
      await candidate.save();
    }

    res.status(200).json({
      success: true,
      message: 'System check details saved successfully',
      candidateStatus: candidate.status,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
