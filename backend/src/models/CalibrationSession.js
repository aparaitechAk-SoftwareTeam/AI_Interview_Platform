import mongoose from 'mongoose';

export const calibrationSessionSchema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    audioPath: String,
    noiseLevel: Number,
    transcriptionText: String,
    status: { type: String, enum: ['PASS', 'FAIL'], default: 'PASS' },
    calibratedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model('CalibrationSession', calibrationSessionSchema);
