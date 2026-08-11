import mongoose from 'mongoose';

const categoryWeightsSchema = new mongoose.Schema(
  {
    technical: { type: Number, default: 40 },
    resume: { type: Number, default: 20 },
    problemSolving: { type: Number, default: 15 },
    hr: { type: Number, default: 10 },
    aptitude: { type: Number, default: 10 },
    communication: { type: Number, default: 5 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
    version: { type: Number, default: 1 },
    language: { type: String, enum: ['English', 'Marathi-English', 'Hindi-English'], default: 'English' },
    tone: { type: String, enum: ['Professional', 'Friendly', 'Strict'], default: 'Professional' },
    speakingSpeed: { type: String, enum: ['Slow', 'Normal', 'Slightly Fast'], default: 'Normal' },
    duration: { type: Number, enum: [5], default: 5 },
    difficulty: { type: String, enum: ['1', '2', '3', '4', '5', 'Adaptive'], default: 'Adaptive' },
    weights: { type: categoryWeightsSchema, default: () => ({}) },
    mustCoverTopics: [String],
    optionalTopics: [String],
    mandatoryQuestions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MandatoryQuestion' }],
    maxFollowUps: { type: Number, default: 2 },
    antiCheatingStrictness: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    calibrationRequired: { type: Boolean, default: true },
    recordingMode: {
      type: String,
      enum: ['NO_STORED_RECORDING', 'AUDIO_ONLY', 'AUDIO_VIDEO'],
      default: 'AUDIO_ONLY',
    },
    resultVisibility: { type: String, enum: ['Immediate', 'ReleasedByAdmin', 'Hidden'], default: 'ReleasedByAdmin' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.pre('save', function (next) {
  const w = this.weights;
  const total = w.technical + w.resume + w.problemSolving + w.hr + w.aptitude + w.communication;
  if (total !== 100) {
    return next(new Error(`Interview Template weights must sum to 100. Current sum: ${total}`));
  }
  next();
});

export default mongoose.model('InterviewTemplate', schema);
