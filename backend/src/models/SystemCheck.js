import mongoose from 'mongoose';

export const systemCheckSchema = new mongoose.Schema(
  {
    browser: String,
    isDesktop: Boolean,
    hasCamera: Boolean,
    hasMic: Boolean,
    hasSpeaker: Boolean,
    internetSpeed: Number,
    latency: Number,
    fullscreenSupport: Boolean,
    mediaRecorderSupport: Boolean,
    status: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
    checkedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('SystemCheck', systemCheckSchema);
