import mongoose from 'mongoose';

export const pipelineHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ['INVITED', 'READY', 'INTERVIEWING', 'UNDER_REVIEW', 'SHORTLISTED', 'HOLD', 'REJECTED', 'SELECTED'],
      required: true,
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    note: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

export default mongoose.model('PipelineHistory', pipelineHistorySchema);
