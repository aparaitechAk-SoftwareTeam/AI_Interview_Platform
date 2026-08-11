import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['technical', 'resume', 'problemSolving', 'hr', 'aptitude', 'communication'],
      required: true,
    },
    topic: { type: String, required: true, trim: true },
    difficulty: { type: String, enum: ['1', '2', '3', '4', '5'], default: '3' },
    mustAsk: { type: Boolean, default: true },
    allowAIFollowUp: { type: Boolean, default: true },
    maxFollowUps: { type: Number, default: 2 },
    expectedCompetency: { type: String, default: '' },
    evaluationRubric: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('MandatoryQuestion', schema);
