import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    interviewSession: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    lastCompletedQuestionIndex: { type: Number, default: -1 },
    aiContext: { type: mongoose.Schema.Types.Mixed, default: {} },
    topicCoverage: [String],
    difficulty: { type: String, default: '3' },
    remainingTimeSeconds: { type: Number, required: true },
    scoreState: { type: mongoose.Schema.Types.Mixed, default: {} },
    sequenceNumber: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewCheckpoint', schema);
