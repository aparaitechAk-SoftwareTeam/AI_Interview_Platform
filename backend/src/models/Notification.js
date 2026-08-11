import mongoose from 'mongoose';

const schema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'recipientModel' },
    recipientModel: { type: String, required: true, enum: ['Admin', 'Candidate'] },
    type: { type: String, required: true },
    title: { type: String, default: '' },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    channels: [{ type: String, enum: ['IN_APP', 'EMAIL'], default: 'IN_APP' }],
    status: { type: String, enum: ['PENDING', 'SENT', 'FAILED'], default: 'PENDING' },
  },
  { timestamps: true }
);

export default mongoose.model('Notification', schema);
