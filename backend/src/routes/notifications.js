import express from 'express';
import Notification from '../models/Notification.js';

const router = express.Router();

// Get list of notifications for a recipient
router.get('/', async (req, res, next) => {
  try {
    const { recipientId } = req.query;
    const filter = {};
    if (recipientId) {
      filter.recipient = recipientId;
    }
    const list = await Notification.find(filter).sort({ createdAt: -1 }).limit(50);
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    next(error);
  }
});

// Mark notification as read
router.post('/:id/read', async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { $set: { isRead: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
});

export default router;
