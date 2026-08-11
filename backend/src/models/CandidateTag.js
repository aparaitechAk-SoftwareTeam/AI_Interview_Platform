import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    color: { type: String, default: '#3b82f6' },
  },
  { timestamps: true }
);

export default mongoose.model('CandidateTag', schema);
