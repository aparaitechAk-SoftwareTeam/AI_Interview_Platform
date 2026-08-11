import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
    skill: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: ['technical', 'resume', 'problemSolving', 'hr', 'aptitude', 'communication'],
      required: true,
    },
    difficulty: { type: String, enum: ['1', '2', '3', '4', '5'], default: '3' },
    tags: [String],
    expectedCompetency: { type: String, default: '' },
    followUpAllowed: { type: Boolean, default: true },
    usageCount: { type: Number, default: 0 },
    lastUsed: Date,
    evaluationRubric: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('QuestionBankItem', schema);
