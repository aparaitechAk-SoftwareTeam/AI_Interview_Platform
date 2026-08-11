import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    interviewSession: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true, unique: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    overallScore: { type: Number, required: true },
    sectionScores: {
      technical: Number,
      resume: Number,
      problemSolving: Number,
      hr: Number,
      aptitude: Number,
      communication: Number,
    },
    strengths: [String],
    weaknesses: [String],
    recommendation: {
      type: String,
      enum: ['STRONGLY_RECOMMENDED', 'RECOMMENDED', 'CONSIDER', 'NEEDS_REVIEW', 'NOT_RECOMMENDED'],
    },
    summary: String,
  },
  { timestamps: true }
);

export default mongoose.model('InterviewReport', schema);
