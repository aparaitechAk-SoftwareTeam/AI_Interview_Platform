import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    interviewSession: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession' },
    interviewId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession' },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' },
    qaIndex: { type: Number, default: 0 },
    path: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    fileSize: { type: Number, default: 0 },
    recordingType: { type: String, enum: ['AUDIO_ONLY', 'AUDIO_VIDEO', 'PROCTORING_VIDEO'], default: 'AUDIO_VIDEO' },
    status: {
      type: String,
      enum: ['PENDING', 'UPLOADING', 'PROCESSING', 'READY', 'FAILED', 'DELETED'],
      default: 'PENDING',
    },
    mimeType: { type: String, default: 'video/webm' },
    storageKey: { type: String, select: false },
    expectedChunks: { type: Number, default: 0 },
    expectedBytes: { type: Number, default: 0 },
    chunks: [
      {
        index: { type: Number, required: true },
        size: { type: Number, required: true },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    lastError: String,
    finalizedAt: Date,
    deletedAt: Date,
    deleteReason: String,
    retentionUntil: Date,
  },
  { timestamps: true }
);

export default mongoose.model('InterviewRecording', schema);
