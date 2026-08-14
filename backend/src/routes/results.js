import express from 'express';
import InterviewSession from '../models/InterviewSession.js';
import Candidate from '../models/Candidate.js';
import Result from '../models/Result.js';
import { protectAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { getEmailService } from '../services/email/EmailService.js';

const router = express.Router();

// Admin decides result status (APPROVE, HOLD, REJECT)
router.post('/decide', protectAdmin, async (req, res, next) => {
  try {
    const { sessionId, decision, feedback, adminComment, candidateFeedback, reinterviewNote } = req.body; // 'APPROVED' | 'HOLD' | 'REJECTED' | 'REINTERVIEW'

    if (!sessionId || !decision) {
      return res.status(400).json({ success: false, message: 'Session ID and decision status are required' });
    }

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const candidate = await Candidate.findById(session.candidate);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    let pipelineStage = 'UNDER_REVIEW';
    if (decision === 'APPROVED') pipelineStage = 'SHORTLISTED';
    else if (decision === 'HOLD') pipelineStage = 'HOLD';
    else if (decision === 'REJECTED') pipelineStage = 'REJECTED';
    else if (decision === 'REINTERVIEW') pipelineStage = 'REINTERVIEW';

    const oldStatus = session.status;
    session.adminNote = feedback || '';
    session.decidedAt = new Date();
    await session.save();

    candidate.pipelineStage = pipelineStage;
    candidate.pipelineHistory.push({
      stage: pipelineStage,
      changedBy: req.admin._id,
      note: `Admin review decision: ${decision}. Feedback: ${candidateFeedback || feedback || 'None'}`,
    });
    await candidate.save();

    // A HOLD or REJECTED decision gets an automatic follow-up email 2-3 days later
    const needsFollowUp = decision === 'HOLD' || decision === 'REJECTED';
    const followUpDueAt = needsFollowUp
      ? new Date(Date.now() + (2 + Math.random()) * 24 * 60 * 60 * 1000) // ~2-3 days out
      : undefined;

    // 1. Create or update Result document FIRST
    const resultDoc = await Result.findOneAndUpdate(
      { candidate: candidate._id },
      {
        interviewSession: session._id,
        status: decision,
        scores: session.scores,
        feedback: feedback || '',
        adminComment: adminComment || '',
        candidateFeedback: candidateFeedback || '',
        reinterviewNote: reinterviewNote || '',
        decidedBy: req.admin._id,
        decidedAt: new Date(),
        decisionEmailStatus: 'PENDING',
        followUpDueAt,
        followUpSent: false,
      },
      { upsert: true, new: true }
    );

    // 2. Now attempt to send the email notification
    const emailService = getEmailService();
    let decisionEmailStatus = 'PENDING';
    const overallScore = session.scores?.overall || 0;

    try {
      if (decision === 'APPROVED') {
        if (candidate.approvalEmailSent) {
          console.log(`[Results] Approval email already sent to ${candidate.email}, skipping.`);
          decisionEmailStatus = 'SENT';
        } else {
          const emailResult = await emailService.sendDecisionEmail(candidate, decision, candidateFeedback || feedback || '');
          if (emailResult.success) {
            decisionEmailStatus = 'SENT';
            candidate.approvalEmailSent = true;
            candidate.approvalEmailSentAt = new Date();
            await candidate.save();
          } else {
            decisionEmailStatus = 'FAILED';
          }
        }
      } else if (decision === 'REJECTED') {
        if (candidate.rejectionEmailSent) {
          console.log(`[Results] Rejection email already sent to ${candidate.email}, skipping.`);
          decisionEmailStatus = 'SENT';
        } else {
          const emailResult = await emailService.sendDecisionEmail(candidate, decision, candidateFeedback || feedback || '');
          if (emailResult.success) {
            decisionEmailStatus = 'SENT';
            candidate.rejectionEmailSent = true;
            candidate.rejectionEmailSentAt = new Date();
            await candidate.save();
          } else {
            decisionEmailStatus = 'FAILED';
          }
        }
      } else {
        const emailResult = await emailService.sendDecisionEmail(candidate, decision, candidateFeedback || feedback || '');
        decisionEmailStatus = emailResult.success ? 'SENT' : 'FAILED';
      }
    } catch (emailErr) {
      console.error('[Results] Failed to send decision email:', emailErr);
      decisionEmailStatus = 'FAILED';
    }

    // Update Result document with final email status
    resultDoc.decisionEmailStatus = decisionEmailStatus;
    await resultDoc.save();

    // In-app notification so the candidate also sees the status change, not just email
    await Notification.create({
      recipient: candidate._id,
      recipientModel: 'Candidate',
      title: decision === 'APPROVED' ? 'You have been shortlisted!' : decision === 'HOLD' ? 'Application on hold' : 'Application update',
      message: decision === 'APPROVED'
        ? 'Congratulations! You have been shortlisted after your interview review.'
        : decision === 'HOLD'
          ? 'Your application is on hold. We will follow up within 2-3 days.'
          : 'Your application was not moved forward at this time. Thank you for your interest.',
      type: `DECISION_${decision}`,
      channels: ['IN_APP', 'EMAIL'],
      status: decisionEmailStatus,
    });

    await AuditLog.create({
      action: 'RESULT_DECISION',
      admin: req.admin._id,
      candidateId: candidate._id,
      interviewSession: session._id,
      oldValue: { status: oldStatus },
      newValue: { status: decision, pipelineStage },
    });

    let message = `Candidate decision updated to ${decision}`;
    if (decisionEmailStatus === 'FAILED') {
      if (decision === 'APPROVED') {
        message = 'Candidate approved, but notification email could not be sent.';
      } else if (decision === 'REJECTED') {
        message = 'Candidate rejected, but notification email could not be sent.';
      } else {
        message = `Candidate decision updated to ${decision}, but notification email could not be sent.`;
      }
    } else {
      if (decision === 'APPROVED') {
        message = 'Candidate approved and notification email sent.';
      } else if (decision === 'REJECTED') {
        message = 'Candidate rejected and notification email sent.';
      }
    }

    res.status(200).json({ 
      success: true, 
      statusUpdated: true,
      emailSent: decisionEmailStatus === 'SENT',
      message, 
      session, 
      decisionEmailStatus 
    });
  } catch (error) {
    next(error);
  }
});

// Admin releases results to the candidate
router.post('/release', protectAdmin, async (req, res, next) => {
  try {
    const { sessionId } = req.body;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    const candidate = await Candidate.findById(session.candidate);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    session.resultReleased = true;
    await session.save();

    candidate.status = 'RESULT_RELEASED';
    await candidate.save();

    await Result.findOneAndUpdate(
      { candidate: candidate._id },
      { status: 'RELEASED' }
    );

    await AuditLog.create({
      action: 'RESULT_RELEASE',
      admin: req.admin._id,
      candidateId: candidate._id,
      interviewSession: session._id,
    });

    await Notification.create({
      recipient: req.admin._id,
      recipientModel: 'Admin',
      title: 'Result Released',
      message: `Interview result for candidate ${candidate.name} (${candidate.email}) has been successfully released.`,
      type: 'RESULT_RELEASED',
    });

    res.status(200).json({ success: true, message: 'Result released to candidate portal', session });
  } catch (error) {
    next(error);
  }
});

// Candidate fetches their current decision/status (lightweight — works even before full results are released)
router.get('/candidate/:candidateId/status', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const result = await Result.findOne({ candidate: candidateId });
    if (!result) {
      return res.status(200).json({ success: true, data: null });
    }
    res.status(200).json({
      success: true,
      data: {
        status: result.status,
        feedback: result.feedback,
        decidedAt: result.decidedAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Candidate fetches released result details
router.get('/candidate/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const session = await InterviewSession.findOne({ candidate: candidateId, resultReleased: true })
      .populate('jobRole', 'name');

    if (!session) {
      return res.status(403).json({
        success: false,
        message: 'Results are either not finalized yet or have not been released by the recruiter.',
      });
    }

    res.status(200).json({
      success: true,
      scores: session.scores,
      report: session.report,
      completedAt: session.completedAt,
      jobRole: session.jobRole?.name,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
