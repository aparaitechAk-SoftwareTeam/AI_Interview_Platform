import mongoose from 'mongoose';

export const faceProfileSchema = new mongoose.Schema(
  {
    referenceSelfiePath: { type: String, required: true },
    capturedAt: { type: Date, default: Date.now },
    verificationLogs: [
      {
        matchedImage: String,
        confidence: Number,
        status: { type: String, enum: ['VERIFIED', 'RETRY', 'FAILED'] },
        checkedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model('FaceProfile', faceProfileSchema);
