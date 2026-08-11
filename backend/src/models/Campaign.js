import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    allowedRoles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'JobRole' }],
    defaultTemplate: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTemplate' },
    inviteDefaults: {
      duration: { type: Number, enum: [5], default: 5 },
      expiryDays: { type: Number, default: 7 },
    },
    tags: [String],
    candidateLimit: { type: Number, default: 100 },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'],
      default: 'DRAFT',
    },
  },
  { timestamps: true }
);

export default mongoose.model('Campaign', schema);
