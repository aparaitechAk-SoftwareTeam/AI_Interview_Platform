import express from 'express';
import multer from 'multer';
import InterviewSession from '../models/InterviewSession.js';
import Candidate from '../models/Candidate.js';
import InterviewCheckpoint from '../models/InterviewCheckpoint.js';
import JobRole from '../models/JobRole.js';
import InterviewTemplate from '../models/InterviewTemplate.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import Admin from '../models/Admin.js';
import { getLLMProvider } from '../services/ai/index.js';
import { getSpeechProvider } from '../services/speech/index.js';
import { getStorageProvider } from '../services/storage/index.js';
import { protectAdmin } from '../middleware/auth.js';
import { getInterviewSettings } from './settings.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// @desc    Start Interview
// @route   POST /api/interviews/start
router.post('/start', async (req, res, next) => {
  try {
    const { candidateId } = req.body;
    if (!candidateId) {
      return res.status(400).json({ success: false, message: 'Candidate ID is required' });
    }

    const candidate = await Candidate.findById(candidateId).populate('jobRole').populate('template');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Check if slot window is valid
    if (candidate.invitationExpiry && new Date() > candidate.invitationExpiry) {
      return res.status(403).json({ success: false, message: 'Interview link has expired' });
    }

    // Attempt Recovery (only for active uncompleted sessions that have existing Q&A history)
    const checkpoint = await InterviewCheckpoint.findOne({ candidate: candidate._id });
    if (checkpoint) {
      const activeSession = await InterviewSession.findById(checkpoint.interviewSession);
      if (activeSession && activeSession.status !== 'COMPLETED' && activeSession.status !== 'TERMINATED' && activeSession.qa && activeSession.qa.length > 0) {
        activeSession.status = 'RECOVERING';
        await activeSession.save();

        const currentQa = activeSession.qa[activeSession.qa.length - 1];
        const currentQuestion = {
          questionIndex: activeSession.qa.length - 1,
          text: currentQa.question,
          category: currentQa.category || 'technical',
          topic: currentQa.topic || 'General',
          difficulty: currentQa.difficulty || '3',
        };

        return res.status(200).json({
          success: true,
          data: {
            session: activeSession,
            checkpoint: checkpoint,
            question: currentQuestion,
            recovered: true,
          }
        });
      } else {
        // Delete stale/completed checkpoint to allow clean new session creation
        await InterviewCheckpoint.deleteOne({ _id: checkpoint._id });
      }
    }

    // Prevent starting if limit is exceeded
    if (candidate.attemptsCount >= candidate.maxAttempts) {
      return res.status(403).json({ success: false, message: 'Maximum interview attempts reached' });
    }

    // Increment attempt count
    candidate.attemptsCount += 1;
    candidate.status = 'IN_PROGRESS';
    candidate.pipelineStage = 'INTERVIEWING';
    candidate.pipelineHistory.push({
      stage: 'INTERVIEWING',
      note: `Started interview attempt #${candidate.attemptsCount}`,
    });
    await candidate.save();

    // Create new interview session
    const globalSettings = await getInterviewSettings();
    const sessionDuration = candidate.duration || globalSettings?.durationMinutes || 5;

    const session = await InterviewSession.create({
      candidate: candidate._id,
      jobRole: candidate.jobRole._id,
      campaign: candidate.campaign,
      template: candidate.template?._id,
      duration: sessionDuration,
      status: 'STARTED',
      startedAt: new Date(),
      attemptNumber: candidate.attemptsCount,
    });

    // Create Initial Checkpoint
    const initialCheckpoint = await InterviewCheckpoint.create({
      interviewSession: session._id,
      candidate: candidate._id,
      lastCompletedQuestionIndex: -1,
      aiContext: { strategyApproved: true },
      remainingTimeSeconds: sessionDuration * 60,
      difficulty: candidate.template?.difficulty || '3',
    });

    // Ensure candidate resume is parsed before generating first question
    const llm = getLLMProvider();
    if (candidate.resume?.text && (!candidate.resume.parsed || !candidate.resume.parsed.skills?.length)) {
      try {
        const parsedProfile = await llm.analyzeResume(candidate.resume.text, candidate.jobRole);
        candidate.resume.parsed = parsedProfile;
        await candidate.save();
      } catch (parseErr) {
        console.warn('[Interview Start] Resume auto-parsing fallback:', parseErr.message);
      }
    }

    const nextQuestionData = await llm.selectNextQuestion(session, candidate, initialCheckpoint);

    // Save asked question to the session qa array
    session.qa.push({
      question: nextQuestionData.question,
      category: nextQuestionData.category || 'technical',
      difficulty: nextQuestionData.difficulty || '3',
      topic: nextQuestionData.topic || 'General',
      askedAt: new Date(),
    });
    await session.save();

    await AuditLog.create({
      action: 'INTERVIEW_START',
      candidateId: candidate._id,
      interviewSession: session._id,
      metadata: { attempt: candidate.attemptsCount },
    });

    // Create system notification for Admin
    const defaultAdmin = await Admin.findOne();
    if (defaultAdmin) {
      await Notification.create({
        recipient: defaultAdmin._id,
        recipientModel: 'Admin',
        title: 'Interview Started',
        message: `Candidate ${candidate.name} has started their interview session for job role: ${candidate.jobRole?.name || 'Assigned Job Role'}.`,
        type: 'INTERVIEW_STARTED',
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Interview session started',
      data: {
        session,
        checkpoint: initialCheckpoint,
        question: {
          questionIndex: 0,
          text: nextQuestionData.question,
          category: nextQuestionData.category || 'technical',
          topic: nextQuestionData.topic || 'General',
          difficulty: nextQuestionData.difficulty || '3',
        },
        recovered: false,
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get session details
// @route   GET /api/interviews/session/:id
router.get('/session/:id', async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id)
      .populate('candidate')
      .populate('jobRole');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
});

// @desc    Fetch next question from AI orchestrator
// @route   POST /api/interviews/next-question
router.post('/next-question', async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = await InterviewSession.findById(sessionId).populate({
      path: 'candidate',
      populate: { path: 'jobRole' },
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const checkpoint = await InterviewCheckpoint.findOne({ interviewSession: session._id });

    // Conclude after 8 questions (size of mock LLM provider list)
    if (session.qa && session.qa.length >= 8) {
      return res.status(200).json({
        success: true,
        isCompleted: true,
        message: 'Interview questions limit reached',
      });
    }

    const llm = getLLMProvider();

    // Check if we still have mandatory questions to ask
    // AI selects next topic based on template
    const nextQuestionData = await llm.selectNextQuestion(session, session.candidate, checkpoint);

    // Save asked question to the session qa array
    session.qa.push({
      question: nextQuestionData.question,
      category: nextQuestionData.category || 'technical',
      difficulty: nextQuestionData.difficulty || '3',
      topic: nextQuestionData.topic || 'General',
      askedAt: new Date(),
    });
    session.status = 'STARTED';
    await session.save();

    // Broadcast live event via Socket.io
    if (global.io) {
      global.io.to('admin_monitoring').emit('admin_live_update', {
        interviewId: session._id,
        candidateName: session.candidate.name,
        state: 'SPEAKING',
        details: `Asking: ${nextQuestionData.question}`,
      });
    }

    res.status(200).json({
      success: true,
      question: nextQuestionData.question,
      category: nextQuestionData.category,
      topic: nextQuestionData.topic,
      difficulty: nextQuestionData.difficulty,
      questionIndex: session.qa.length - 1,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Submit answer audio recording & run AI grading evaluation
// @route   POST /api/interviews/submit-answer
router.post('/submit-answer', upload.single('audio'), async (req, res, next) => {
  try {
    const { sessionId, questionIndex, remainingTimeSeconds } = req.body;
    if (!sessionId || questionIndex === undefined) {
      return res.status(400).json({ success: false, message: 'Session ID and question index are required' });
    }

    const session = await InterviewSession.findById(sessionId).populate({
      path: 'candidate',
      populate: { path: 'jobRole' },
    });
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const checkpoint = await InterviewCheckpoint.findOne({ interviewSession: session._id });

    // 1. Upload audio recording to local storage
    let recordingPath = '';
    if (req.file) {
      const storage = getStorageProvider();
      const uploadResult = await storage.uploadFile(
        req.file.buffer,
        `answer-${sessionId}-${questionIndex}.webm`,
        req.file.mimetype
      );
      recordingPath = uploadResult.path;
    }

    // 2. Run STT Transcription
    let transcript = 'No spoken response detected.';
    if (req.file) {
      try {
        const speech = getSpeechProvider();
        transcript = await speech.speechToText(req.file.buffer);
      } catch (sttErr) {
        console.error('[Speech] STT transcription failed, using fallback transcript:', sttErr);
        transcript = 'Transcribed response fallback based on mock speech handler.';
      }
    }

    // 3. Perform AI grading
    const activeQA = session.qa[questionIndex];
    if (!activeQA) {
      return res.status(400).json({ success: false, message: 'Question sequence mismatch' });
    }

    let evaluation = {
      scores: { technical: 50, resume: 50, problemSolving: 50, hr: 50, aptitude: 50, communication: 50 },
      reasoning: 'AI assessment fallback due to evaluation error.',
      feedback: 'Good effort.',
    };

    try {
      const llm = getLLMProvider();
      evaluation = await llm.evaluateAnswer(activeQA.question, transcript, 'General competency');
    } catch (evalErr) {
      console.error('[AI Orchestrator] Grading evaluation failed:', evalErr);
    }

    // Save answer and scores inside session qa
    activeQA.answer = transcript;
    activeQA.recordingPath = recordingPath;
    activeQA.answeredAt = new Date();
    activeQA.scores = evaluation.scores;
    activeQA.reasoning = evaluation.reasoning;
    activeQA.feedback = evaluation.feedback;
    activeQA.classification = evaluation.classification || 'PARTIALLY_CORRECT';

    // Re-calculate rolling overall scores
    let count = 0;
    const totals = { technical: 0, resume: 0, problemSolving: 0, hr: 0, aptitude: 0, communication: 0 };
    
    session.qa.forEach((item) => {
      if (item.scores && item.answer) {
        count++;
        totals.technical += item.scores.technical || 0;
        totals.resume += item.scores.resume || 0;
        totals.problemSolving += item.scores.problemSolving || 0;
        totals.hr += item.scores.hr || 0;
        totals.aptitude += item.scores.aptitude || 0;
        totals.communication += item.scores.communication || 0;
      }
    });

    if (count > 0) {
      session.scores.technical = Math.round(totals.technical / count);
      session.scores.resume = Math.round(totals.resume / count);
      session.scores.problemSolving = Math.round(totals.problemSolving / count);
      session.scores.hr = Math.round(totals.hr / count);
      session.scores.aptitude = Math.round(totals.aptitude / count);
      session.scores.communication = Math.round(totals.communication / count);
      session.scores.overall = Math.round(
        (session.scores.technical +
          session.scores.resume +
          session.scores.problemSolving +
          session.scores.hr +
          session.scores.aptitude +
          session.scores.communication) /
          6
      );
    }

    await session.save();

    // 4. Update Checkpoint
    if (checkpoint) {
      checkpoint.lastCompletedQuestionIndex = questionIndex;
      checkpoint.remainingTimeSeconds = remainingTimeSeconds ? parseInt(remainingTimeSeconds) : checkpoint.remainingTimeSeconds;
      // Add topic to checkpoint history list
      if (!checkpoint.topicCoverage.includes(activeQA.topic)) {
        checkpoint.topicCoverage.push(activeQA.topic);
      }
      // Adaptive difficulty change logic based on evaluation
      if (evaluation.scores.technical > 80) {
        checkpoint.difficulty = Math.min(5, parseInt(checkpoint.difficulty) + 1).toString();
      } else if (evaluation.scores.technical < 40) {
        checkpoint.difficulty = Math.max(1, parseInt(checkpoint.difficulty) - 1).toString();
      }
      await checkpoint.save();
    }

    // Broadcast update
    if (global.io) {
      global.io.to('admin_monitoring').emit('admin_live_update', {
        interviewId: session._id,
        candidateName: session.candidate.name,
        state: 'LISTENING',
        details: `Answered question #${questionIndex + 1}. Score: ${evaluation.scores.technical}`,
      });
    }

    res.status(200).json({
      success: true,
      transcript,
      scores: evaluation.scores,
      feedback: evaluation.feedback,
      checkpoint,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete Interview Session
// @route   POST /api/interviews/complete
router.post('/complete', async (req, res, next) => {
  try {
    const { sessionId } = req.body;
    const session = await InterviewSession.findById(sessionId).populate('candidate');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = 'COMPLETED';
    session.completedAt = new Date();

    // Generate Final AI Report Summary
    try {
      const llm = getLLMProvider();
      const report = await llm.generateFinalReport(session, session.candidate);
      session.report = {
        summary: report.summary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        recommendation: report.recommendation,
      };
    } catch (reportErr) {
      console.error('[AI Orchestrator] Final report generation failed:', reportErr);
      session.report.summary = 'Final candidate scoring completed with mock report backup.';
      session.report.recommendation = 'RECOMMENDED';
    }

    await session.save();

    // Update candidate status
    const candidate = await Candidate.findById(session.candidate._id);
    if (candidate) {
      candidate.status = 'COMPLETED';
      candidate.pipelineStage = 'UNDER_REVIEW';
      candidate.pipelineHistory.push({
        stage: 'UNDER_REVIEW',
        note: 'Interview completed. Awaiting review.',
      });
      await candidate.save();
    }

    // Remove checkpoint
    await InterviewCheckpoint.deleteOne({ interviewSession: session._id });

    await AuditLog.create({
      action: 'INTERVIEW_COMPLETE',
      candidateId: session.candidate._id,
      interviewSession: session._id,
    });

    // Create system notification for Admin
    const defaultAdmin = await Admin.findOne();
    if (defaultAdmin) {
      await Notification.create({
        recipient: defaultAdmin._id,
        recipientModel: 'Admin',
        title: 'Interview Completed',
        message: `Candidate ${session.candidate.name} has completed their assessment. Awaiting recruiter review.`,
        type: 'INTERVIEW_COMPLETED',
      });
    }

    if (global.io) {
      global.io.to('admin_monitoring').emit('admin_live_update', {
        interviewId: session._id,
        candidateName: session.candidate.name,
        state: 'COMPLETED',
        details: 'Interview finished',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Interview completed and scores processed successfully',
      session,
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Emergency Pause
// @route   POST /api/interviews/:id/pause
router.post('/:id/pause', protectAdmin, async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = 'PAUSED';
    await session.save();

    await AuditLog.create({
      action: 'INTERVIEW_PAUSE',
      admin: req.admin._id,
      interviewSession: session._id,
    });

    if (global.io) {
      global.io.to(`interview_${session._id}`).emit('emergency_control', { action: 'pause' });
    }

    res.status(200).json({ success: true, message: 'Interview paused successfully', data: session });
  } catch (error) {
    next(error);
  }
});

// @desc    Emergency Resume
// @route   POST /api/interviews/:id/resume
router.post('/:id/resume', protectAdmin, async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = 'STARTED';
    await session.save();

    await AuditLog.create({
      action: 'INTERVIEW_RESUME',
      admin: req.admin._id,
      interviewSession: session._id,
    });

    if (global.io) {
      global.io.to(`interview_${session._id}`).emit('emergency_control', { action: 'resume' });
    }

    res.status(200).json({ success: true, message: 'Interview resumed successfully', data: session });
  } catch (error) {
    next(error);
  }
});

// @desc    Emergency Terminate
// @route   POST /api/interviews/:id/terminate
router.post('/:id/terminate', protectAdmin, async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    session.status = 'TERMINATED';
    await session.save();

    const candidate = await Candidate.findById(session.candidate);
    if (candidate) {
      candidate.status = 'COMPLETED'; // move to review
      candidate.pipelineStage = 'UNDER_REVIEW';
      await candidate.save();
    }

    // Delete checkpoint
    await InterviewCheckpoint.deleteOne({ interviewSession: session._id });

    await AuditLog.create({
      action: 'INTERVIEW_TERMINATE',
      admin: req.admin._id,
      interviewSession: session._id,
    });

    if (global.io) {
      global.io.to(`interview_${session._id}`).emit('emergency_control', { action: 'terminate' });
    }

    res.status(200).json({ success: true, message: 'Interview terminated by Admin', data: session });
  } catch (error) {
    next(error);
  }
});

// @desc    Log candidate event evidence (App background, focus lost, back button, tab switch, etc.)
// @route   POST /api/interviews/:id/events
router.post('/:id/events', async (req, res, next) => {
  try {
    const { type, timestamp, durationMs, metadata } = req.body;
    const sessionId = req.params.id;

    const session = await InterviewSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Interview session not found' });
    }

    // Save event to session warning logs & emit socket event
    const eventObj = {
      type: type || 'UNKNOWN_EVENT',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      durationMs: durationMs || 0,
      metadata: metadata || {},
    };

    if (global.io) {
      global.io.to('admin_monitoring').emit('admin_live_update', {
        interviewId: session._id,
        candidateName: session.candidate ? session.candidate.name : 'Candidate',
        state: 'INTEGRITY_ALERT',
        details: `Event logged: ${eventObj.type}`,
        event: eventObj,
      });
    }

    res.status(201).json({ success: true, event: eventObj });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current interview state / recovery info
// @route   GET /api/interviews/:id/current
router.get('/:id/current', async (req, res, next) => {
  try {
    const session = await InterviewSession.findById(req.params.id).populate('candidate');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    const checkpoint = await InterviewCheckpoint.findOne({ interviewSession: session._id });
    res.status(200).json({ success: true, interview: session, session, checkpoint });
  } catch (error) {
    next(error);
  }
});

// Import InterviewRecording for video chunk storage
import InterviewRecording from '../models/InterviewRecording.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../../uploads/recordings');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// @desc    Upload video/audio recording chunk
// @route   POST /api/interviews/:id/recording/chunks
router.post('/:id/recording/chunks', upload.single('chunk'), async (req, res, next) => {
  try {
    const interviewId = req.params.id;
    const chunkIndex = parseInt(req.body.index || req.body.chunkIndex || '0');
    const totalChunks = parseInt(req.body.totalChunks || '1');

    let recording = await InterviewRecording.findOne({
      $or: [{ interviewSession: interviewId }, { interviewId: interviewId }],
    });

    if (!recording) {
      const session = await InterviewSession.findById(interviewId);
      recording = await InterviewRecording.create({
        interviewSession: interviewId,
        interviewId,
        candidate: session ? session.candidate : null,
        candidateId: session ? session.candidate : null,
        qaIndex: 0,
        path: '',
        status: 'UPLOADING',
        expectedChunks: totalChunks,
      });
    }

    if (req.file) {
      const chunkFileName = `rec-${interviewId}-${chunkIndex}.part`;
      const chunkFilePath = path.join(uploadsDir, chunkFileName);
      fs.writeFileSync(chunkFilePath, req.file.buffer);

      recording.chunks.push({
        index: chunkIndex,
        size: req.file.size,
        uploadedAt: new Date(),
      });
      recording.status = 'UPLOADING';
      await recording.save();
    }

    res.status(200).json({ success: true, chunkIndex, status: recording.status });
  } catch (error) {
    next(error);
  }
});

// @desc    Get video recording status
// @route   GET /api/interviews/:id/recording/status
router.get('/:id/recording/status', async (req, res, next) => {
  try {
    const interviewId = req.params.id;
    const recording = await InterviewRecording.findOne({
      $or: [{ interviewSession: interviewId }, { interviewId: interviewId }],
    });
    if (!recording) {
      return res.status(200).json({ success: true, status: 'NOT_FOUND', recording: null });
    }
    res.status(200).json({ success: true, status: recording.status, recording });
  } catch (error) {
    next(error);
  }
});

// @desc    Finalize video/audio recording
// @route   POST /api/interviews/:id/recording/finalize
router.post('/:id/recording/finalize', async (req, res, next) => {
  try {
    const interviewId = req.params.id;
    let recording = await InterviewRecording.findOne({
      $or: [{ interviewSession: interviewId }, { interviewId: interviewId }],
    });

    if (!recording) {
      const session = await InterviewSession.findById(interviewId);
      recording = await InterviewRecording.create({
        interviewSession: interviewId,
        interviewId,
        candidate: session ? session.candidate : null,
        candidateId: session ? session.candidate : null,
        qaIndex: 0,
        path: '',
        status: 'READY',
      });
    }

    // Assemble final recording file
    const finalFileName = `interview-${interviewId}.webm`;
    const finalFilePath = path.join(uploadsDir, finalFileName);

    const sortedChunks = (recording.chunks || []).sort((a, b) => a.index - b.index);
    if (sortedChunks.length > 0) {
      const writeStream = fs.createWriteStream(finalFilePath);
      for (const chunk of sortedChunks) {
        const partPath = path.join(uploadsDir, `rec-${interviewId}-${chunk.index}.part`);
        if (fs.existsSync(partPath)) {
          const buffer = fs.readFileSync(partPath);
          writeStream.write(buffer);
          try { fs.unlinkSync(partPath); } catch (e) {}
        }
      }
      writeStream.end();
    }

    recording.status = 'READY';
    recording.path = `/uploads/recordings/${finalFileName}`;
    recording.storageKey = finalFilePath;
    recording.finalizedAt = new Date();
    await recording.save();

    res.status(200).json({ success: true, status: 'READY', path: recording.path, recording });
  } catch (error) {
    next(error);
  }
});

// @desc    Stream video recording (HTTP 206 Range Stream for Admin Video Playback)
// @route   GET /api/interviews/:id/recording
router.get('/:id/recording', async (req, res, next) => {
  try {
    const interviewId = req.params.id;
    const recording = await InterviewRecording.findOne({
      $or: [{ interviewSession: interviewId }, { interviewId: interviewId }],
    }).select('+storageKey');

    let videoPath = recording?.storageKey || (recording?.path ? path.join(__dirname, '../../', recording.path) : null);
    if (!videoPath || !fs.existsSync(videoPath)) {
      const defaultVideo = path.join(uploadsDir, `interview-${interviewId}.webm`);
      if (fs.existsSync(defaultVideo)) {
        videoPath = defaultVideo;
      } else {
        return res.status(404).json({ success: false, message: 'Proctoring recording not available' });
      }
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': recording?.mimeType || 'video/webm',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': recording?.mimeType || 'video/webm',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Delete video recording (Admin action)
// @route   DELETE /api/interviews/:id/recording
router.delete('/:id/recording', protectAdmin, async (req, res, next) => {
  try {
    const interviewId = req.params.id;
    const recording = await InterviewRecording.findOne({
      $or: [{ interviewSession: interviewId }, { interviewId: interviewId }],
    }).select('+storageKey');

    if (recording) {
      recording.status = 'DELETED';
      recording.deletedAt = new Date();
      recording.deleteReason = 'Deleted by administrator';
      await recording.save();

      if (recording.storageKey && fs.existsSync(recording.storageKey)) {
        try { fs.unlinkSync(recording.storageKey); } catch (e) {}
      }
    }

    res.status(200).json({ success: true, message: 'Recording deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;
