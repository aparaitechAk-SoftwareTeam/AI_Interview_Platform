import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import { protectAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// @desc    Admin login
// @route   POST /api/admin/auth/login
// @access  Public
router.post('/login', async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = (email || '').toLowerCase().trim();
    const admin = await Admin.findOne({ email: normalizedEmail });
    if (!admin || !(await admin.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin._id },
      process.env.JWT_SECRET || 'supersecretjwttokendesigndev1234',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Create Audit Log
    await AuditLog.create({
      action: 'ADMIN_LOGIN',
      admin: admin._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { email: admin.email },
    });

    res.status(200).json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current admin profile
// @route   GET /api/admin/auth/me
// @access  Private (Admin)
router.get('/me', protectAdmin, (req, res) => {
  res.status(200).json({
    success: true,
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      name: req.admin.name,
    },
  });
});

export default router;
