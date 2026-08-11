import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    interviewSession: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewSession', required: true },
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    qaIndex: { type: Number, required: true },
    path: { type: String, required: true },
    durationSeconds: Number,
    fileSize: Number,
    recordingType: { type: String, enum: ['AUDIO_ONLY', 'AUDIO_VIDEO'], default: 'AUDIO_ONLY' },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewRecording', schema);
