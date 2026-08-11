import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTemplate', required: true },
    versionNumber: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    previousVersionId: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTemplateVersion' },
    changeSummary: { type: String, default: '' },
    fullConfigSnapshot: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export default mongoose.model('InterviewTemplateVersion', schema);
