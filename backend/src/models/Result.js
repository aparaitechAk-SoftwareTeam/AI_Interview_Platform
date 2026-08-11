import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, unique: true },
    interviewSession: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    status: {
      type: String,
      enum: ['PENDING_REVIEW', 'APPROVED', 'HOLD', 'REJECTED', 'RELEASED'],
      default: 'PENDING_REVIEW',
    },
    scores: {
      technical: Number,
      resume: Number,
      problemSolving: Number,
      hr: Number,
      aptitude: Number,
      communication: Number,
      overall: Number,
    },
    feedback: String,
    decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    decidedAt: Date,
    decisionEmailStatus: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
    followUpDueAt: Date,
    followUpSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model('Result', schema);
