import express from 'express';
import JobRole from '../models/JobRole.js';
import { protectAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Get all job roles (supports active-only filtering)
router.get('/', async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.activeOnly === 'true') {
      filter.isActive = true;
    }
    const roles = await JobRole.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, count: roles.length, data: roles });
  } catch (error) {
    next(error);
  }
});

// Get single job role
router.get('/:id', async (req, res, next) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job role not found' });
    }
    res.status(200).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
});

// Create new job role (Admin only)
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const { name, description, requiredSkills, preferredSkills, experienceLevel, defaultDifficulty, defaultDuration } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const roleExists = await JobRole.findOne({ name });
    if (roleExists) {
      return res.status(400).json({ success: false, message: 'Job role with this name already exists' });
    }

    const role = await JobRole.create({
      name,
      description,
      requiredSkills,
      preferredSkills,
      experienceLevel,
      defaultDifficulty,
      defaultDuration,
    });

    await AuditLog.create({
      action: 'JOB_ROLE_CREATE',
      admin: req.admin._id,
      newValue: role,
    });

    res.status(201).json({ success: true, data: role });
  } catch (error) {
    next(error);
  }
});

// Update job role (Admin only)
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job role not found' });
    }

    const oldValue = JSON.parse(JSON.stringify(role));

    const updatedRole = await JobRole.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      action: 'JOB_ROLE_UPDATE',
      admin: req.admin._id,
      oldValue,
      newValue: updatedRole,
    });

    res.status(200).json({ success: true, data: updatedRole });
  } catch (error) {
    next(error);
  }
});

// Deactivate job role safely (Admin only)
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const role = await JobRole.findById(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Job role not found' });
    }

    role.isActive = false;
    await role.save();

    await AuditLog.create({
      action: 'JOB_ROLE_DEACTIVATE',
      admin: req.admin._id,
      candidateId: null,
      metadata: { id: role._id, name: role.name },
    });

    res.status(200).json({ success: true, message: 'Job role deactivated successfully', data: role });
  } catch (error) {
    next(error);
  }
});

export default router;
