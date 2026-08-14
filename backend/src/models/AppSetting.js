import mongoose from 'mongoose';

const appSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'interview-defaults',
    },
    value: {
      durationMinutes: { type: Number, default: 5, min: 5, max: 60 },
      maxQuestions: { type: Number, default: 8, min: 3, max: 30 },
      adaptiveDifficulty: { type: Boolean, default: true },
      recordingRetentionDays: { type: Number, default: 90, min: 1, max: 365 },
      antiCheatingStrictness: { type: String, enum: ['Low', 'Medium', 'High', 'Strict'], default: 'Medium' },
      calibrationRequired: { type: Boolean, default: true },
      weights: {
        technical: { type: Number, default: 40 },
        aptitude: { type: Number, default: 10 },
        resume: { type: Number, default: 20 },
        communication: { type: Number, default: 10 },
        problemSolving: { type: Number, default: 20 },
      },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
  },
  { timestamps: true }
);

const AppSetting = mongoose.model('AppSetting', appSettingSchema);
export default AppSetting;
