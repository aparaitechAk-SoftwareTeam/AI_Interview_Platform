import express from 'express';
import AuditLog from '../models/AuditLog.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Retrieve immutable audit log trails
router.get('/', protectAdmin, async (req, res, next) => {
  try {
    const list = await AuditLog.find()
      .populate('admin', 'name email')
      .populate('candidate', 'name email')
      .sort({ createdAt: -1 })
      .limit(100);
    res.status(200).json({ success: true, count: list.length, data: list });
  } catch (error) {
    next(error);
  }
});

export default router;
