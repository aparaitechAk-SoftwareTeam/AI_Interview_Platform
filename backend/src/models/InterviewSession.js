import mongoose from 'mongoose';
import { systemCheckSchema } from './SystemCheck.js';

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, default: '3' },
    topic: { type: String, default: 'General' },
    askedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const interviewAnswerSchema = new mongoose.Schema(
  {
    transcript: { type: String, default: '' },
    recordingPath: String,
    answeredAt: { type: Date, default: Date.now },
    scores: {
      technical: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      hr: { type: Number, default: 0 },
      aptitude: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
    },
    reasoning: String,
    feedback: String,
  },
  { _id: false }
);

const qaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: { type: String, default: '3' },
    topic: { type: String, default: 'General' },
    askedAt: { type: Date, default: Date.now },
    answer: { type: String, default: '' },
    recordingPath: String,
    answeredAt: Date,
    scores: {
      technical: Number,
      resume: Number,
      problemSolving: Number,
      hr: Number,
      aptitude: Number,
      communication: Number,
    },
    reasoning: String,
    feedback: String,
  },
  { _id: true }
);

const antiCheatingEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    details: String,
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    jobRole: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTemplate' },
    duration: { type: Number, default: 5 },
    status: {
      type: String,
      enum: ['READY', 'STARTED', 'PAUSED', 'INTERRUPTED', 'RECOVERING', 'COMPLETED', 'TERMINATED', 'FAILED'],
      default: 'READY',
    },
    startedAt: Date,
    completedAt: Date,
    currentQuestionIndex: { type: Number, default: 0 },
    qa: [qaSchema],
    antiCheatingEvents: [antiCheatingEventSchema],
    scores: {
      technical: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
      problemSolving: { type: Number, default: 0 },
      hr: { type: Number, default: 0 },
      aptitude: { type: Number, default: 0 },
      communication: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    report: {
      summary: { type: String, default: '' },
      strengths: [String],
      weaknesses: [String],
      recommendation: {
        type: String,
        enum: ['STRONGLY_RECOMMENDED', 'RECOMMENDED', 'CONSIDER', 'NEEDS_REVIEW', 'NOT_RECOMMENDED', 'PENDING'],
        default: 'PENDING',
      },
    },
    resultReleased: { type: Boolean, default: false },
    adminNote: { type: String, default: '' },
    decidedAt: Date,
    attemptNumber: { type: Number, default: 1 },
    systemCheck: systemCheckSchema,
    calibrationAudioPath: String,
  },
  { timestamps: true }
);

// Register individual subschemas as models to satisfy list requirements
mongoose.model('InterviewQuestion', interviewQuestionSchema);
mongoose.model('InterviewAnswer', interviewAnswerSchema);
mongoose.model('AntiCheatingEvent', antiCheatingEventSchema);

export default mongoose.model('InterviewSession', schema);
export { qaSchema, antiCheatingEventSchema };
