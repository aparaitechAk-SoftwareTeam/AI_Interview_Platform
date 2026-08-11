import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, unique: true },
    code: { type: String, unique: true, required: true, index: true, uppercase: true },
    linkToken: { type: String, unique: true, required: true, index: true },
    status: {
      type: String,
      enum: ['UNUSED', 'OPENED', 'ACTIVATED', 'STARTED', 'COMPLETED', 'EXPIRED', 'REVOKED'],
      default: 'UNUSED',
    },
    expiresAt: { type: Date, required: true },
    activatedAt: Date,
    deviceId: String,
    revokedAt: Date,
    revokedReason: String,
    reissueCount: { type: Number, default: 0 },
    previousCodes: [String],
    emailStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'DEVELOPMENT_PREVIEW'],
      default: 'PENDING',
    },
    emailSentAt: Date,
    emailLastAttemptAt: Date,
    emailFailureReason: String,
    emailAttemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

schema.index({ status: 1 });
schema.index({ expiresAt: 1 });

export default mongoose.model('Invitation', schema);
