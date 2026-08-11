import mongoose from 'mongoose';
import { resumeSchema } from './Resume.js';
import { pipelineHistorySchema } from './PipelineHistory.js';

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    mobile: { type: String, unique: true, trim: true },
    college: { type: String, trim: true, default: '' },
    jobRole: { type: mongoose.Schema.Types.ObjectId, ref: 'JobRole', required: true },
    experienceLevel: {
      type: String,
      enum: ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'],
      default: 'Fresher',
    },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' },
    template: { type: mongoose.Schema.Types.ObjectId, ref: 'InterviewTemplate' },
    duration: { type: Number, enum: [5], default: 5 },
    schedulingMode: { type: String, enum: ['FLEXIBLE', 'EXACT'], default: 'FLEXIBLE' },
    validFrom: { type: Date, default: Date.now },
    validUntil: { type: Date },
    invitationExpiry: { type: Date },
    notes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'CandidateNote' }],
    tags: [{ type: String }],
    pipelineStage: {
      type: String,
      enum: ['INVITED', 'READY', 'INTERVIEWING', 'UNDER_REVIEW', 'SHORTLISTED', 'HOLD', 'REJECTED', 'SELECTED'],
      default: 'INVITED',
    },
    status: {
      type: String,
      enum: ['INVITED', 'ACTIVATED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'RESULT_RELEASED', 'DEACTIVATED'],
      default: 'INVITED',
    },
    resume: { type: resumeSchema, default: null },
    referenceSelfiePath: String,
    attemptsCount: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 1 },
    pipelineHistory: [pipelineHistorySchema],
    isActive: { type: Boolean, default: true },
    invitationEmailSent: { type: Boolean, default: false },
    invitationEmailSentAt: { type: Date },
    approvalEmailSent: { type: Boolean, default: false },
    approvalEmailSentAt: { type: Date },
    rejectionEmailSent: { type: Boolean, default: false },
    rejectionEmailSentAt: { type: Date },
  },
  { timestamps: true }
);

schema.index({ status: 1 });
schema.index({ pipelineStage: 1 });
schema.index({ name: 'text', email: 'text', college: 'text' });

export default mongoose.model('Candidate', schema);
