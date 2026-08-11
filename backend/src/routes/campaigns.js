import express from 'express';
import Campaign from '../models/Campaign.js';
import Candidate from '../models/Candidate.js';
import { protectAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Get campaigns list
router.get('/', async (req, res, next) => {
  try {
    const campaigns = await Campaign.find().populate('allowedRoles', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: campaigns.length, data: campaigns });
  } catch (error) {
    next(error);
  }
});

// Get campaign stats and details
router.get('/:id', async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('allowedRoles', 'name')
      .populate('defaultTemplate', 'name');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Get aggregated statistics for this campaign
    const totalInvited = await Candidate.countDocuments({ campaign: campaign._id });
    const totalActivated = await Candidate.countDocuments({ campaign: campaign._id, status: { $ne: 'INVITED' } });
    const totalCompleted = await Candidate.countDocuments({ campaign: campaign._id, status: 'COMPLETED' });
    
    // Average score helper
    const completedCandidates = await Candidate.find({ campaign: campaign._id, status: 'COMPLETED' }).populate('jobRole');
    
    const stats = {
      invited: totalInvited,
      activated: totalActivated,
      completed: totalCompleted,
      completionRate: totalInvited > 0 ? Math.round((totalCompleted / totalInvited) * 100) : 0,
    };

    res.status(200).json({ success: true, data: campaign, stats });
  } catch (error) {
    next(error);
  }
});

// Create campaign
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const { name, description, startDate, endDate, allowedRoles, defaultTemplate, inviteDefaults, candidateLimit, status } = req.body;

    if (!name || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Name, start date, and end date are required' });
    }

    const campaign = await Campaign.create({
      name,
      description,
      startDate,
      endDate,
      allowedRoles,
      defaultTemplate,
      inviteDefaults,
      candidateLimit,
      status,
    });

    await AuditLog.create({
      action: 'CAMPAIGN_CREATE',
      admin: req.admin._id,
      newValue: campaign,
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
});

// Update campaign
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const oldValue = JSON.parse(JSON.stringify(campaign));
    const updated = await Campaign.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      action: 'CAMPAIGN_UPDATE',
      admin: req.admin._id,
      oldValue,
      newValue: updated,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Archive campaign
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.status = 'ARCHIVED';
    await campaign.save();

    await AuditLog.create({
      action: 'CAMPAIGN_ARCHIVE',
      admin: req.admin._id,
      metadata: { id: campaign._id, name: campaign.name },
    });

    res.status(200).json({ success: true, message: 'Campaign archived successfully', data: campaign });
  } catch (error) {
    next(error);
  }
});

export default router;
