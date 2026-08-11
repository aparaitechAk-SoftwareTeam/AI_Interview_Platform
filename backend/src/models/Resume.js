import mongoose from 'mongoose';

export const resumeSchema = new mongoose.Schema(
  {
    filename: String,
    path: String,
    text: String,
    parsed: {
      skills: [String],
      technologies: [String],
      projects: [String],
      education: [String],
      experience: [String],
      certifications: [String],
      keywords: [String],
    },
  },
  { timestamps: true }
);

export default mongoose.model('Resume', resumeSchema);
