import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    action: { type: String, required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    interviewSession: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession' },
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    ipAddress: String,
    userAgent: String,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

export default mongoose.model('AuditLog', schema);
