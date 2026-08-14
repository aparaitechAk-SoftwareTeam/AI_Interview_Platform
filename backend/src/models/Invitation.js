import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true, unique: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    code: { type: String, unique: true, required: true, index: true, uppercase: true },
    linkToken: { type: String, unique: true, required: true, index: true },
    status: {
      type: String,
      enum: ['UNUSED', 'OPENED', 'ACTIVATED', 'STARTED', 'COMPLETED', 'EXPIRED', 'REVOKED'],
      default: 'UNUSED',
    },
    active: { type: Boolean, default: true },
    singleUse: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    activatedAt: Date,
    deviceId: String,
    revokedAt: Date,
    revokedReason: String,
    reissueCount: { type: Number, default: 0 },
    previousCodes: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    
    // Email Delivery Tracking
    emailStatus: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED', 'DEVELOPMENT_PREVIEW', 'NOT_CONFIGURED'],
      default: 'PENDING',
    },
    emailDelivery: {
      status: { type: String, default: 'PENDING' },
      sentAt: Date,
      lastAttemptAt: Date,
      error: String,
      messageId: String,
    },
    emailSentAt: Date,
    emailLastAttemptAt: Date,
    emailFailureReason: String,
    emailAttemptCount: { type: Number, default: 0 },

    // WhatsApp Delivery Tracking (Independent)
    whatsAppStatus: {
      type: String,
      enum: ['NOT_REQUESTED', 'CONFIGURATION_REQUIRED', 'SENT', 'DELIVERED', 'READ', 'FAILED'],
      default: 'NOT_REQUESTED',
    },
    whatsAppDelivery: {
      status: { type: String, default: 'NOT_REQUESTED' },
      sentAt: Date,
      lastAttemptAt: Date,
      error: String,
      messageId: String,
    },
    whatsAppSentAt: Date,
    whatsAppLastAttemptAt: Date,
    whatsAppFailureReason: String,
    whatsAppAttemptCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

schema.index({ status: 1 });
schema.index({ expiresAt: 1 });

export default mongoose.model('Invitation', schema);
