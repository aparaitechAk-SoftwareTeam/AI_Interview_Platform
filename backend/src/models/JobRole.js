import mongoose from 'mongoose';

const weightsSchema = new mongoose.Schema(
  {
    technical: { type: Number, default: 40, min: 0, max: 100 },
    resume: { type: Number, default: 20, min: 0, max: 100 },
    problemSolving: { type: Number, default: 15, min: 0, max: 100 },
    hr: { type: Number, default: 10, min: 0, max: 100 },
    aptitude: { type: Number, default: 10, min: 0, max: 100 },
    communication: { type: Number, default: 5, min: 0, max: 100 },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    description: { type: String, default: '', trim: true },
    skills: [String],
    requiredSkills: [String],
    preferredSkills: [String],
    experienceLevel: {
      type: String,
      enum: ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'],
      default: 'Fresher',
    },
    defaultDifficulty: {
      type: String,
      enum: ['1', '2', '3', '4', '5', 'Adaptive'],
      default: 'Adaptive',
    },
    defaultDuration: { type: Number, enum: [5], default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

schema.index({ isActive: 1 });

export default mongoose.model('JobRole', schema);
