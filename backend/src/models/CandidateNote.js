import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: true },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('CandidateNote', schema);
