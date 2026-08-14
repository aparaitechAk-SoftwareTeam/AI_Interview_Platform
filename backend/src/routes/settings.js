import express from 'express';
import AppSetting from '../models/AppSetting.js';
import AuditLog from '../models/AuditLog.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Helper to get effective interview settings
export async function getInterviewSettings() {
  let setting = await AppSetting.findOne({ key: 'interview-defaults' });
  if (!setting) {
    setting = await AppSetting.create({
      key: 'interview-defaults',
      value: {
        durationMinutes: 5,
        maxQuestions: 8,
        adaptiveDifficulty: true,
        recordingRetentionDays: 90,
        antiCheatingStrictness: 'Medium',
        calibrationRequired: true,
        weights: { technical: 40, aptitude: 10, resume: 20, communication: 10, problemSolving: 20 },
      },
    });
  }
  return setting.value;
}

// Get global platform interview settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await getInterviewSettings();
    res.status(200).json({ success: true, settings, data: settings });
  } catch (error) {
    next(error);
  }
});

// Update global platform interview settings
router.put('/', protectAdmin, async (req, res, next) => {
  try {
    const { durationMinutes, maxQuestions, adaptiveDifficulty, recordingRetentionDays, antiCheatingStrictness, calibrationRequired, weights } = req.body;

    const updatedValue = {
      durationMinutes: durationMinutes ? parseInt(durationMinutes) : 5,
      maxQuestions: maxQuestions ? parseInt(maxQuestions) : 8,
      adaptiveDifficulty: adaptiveDifficulty !== undefined ? Boolean(adaptiveDifficulty) : true,
      recordingRetentionDays: recordingRetentionDays ? parseInt(recordingRetentionDays) : 90,
      antiCheatingStrictness: antiCheatingStrictness || 'Medium',
      calibrationRequired: calibrationRequired !== undefined ? Boolean(calibrationRequired) : true,
      weights: weights || { technical: 40, aptitude: 10, resume: 20, communication: 10, problemSolving: 20 },
    };

    const setting = await AppSetting.findOneAndUpdate(
      { key: 'interview-defaults' },
      { value: updatedValue, updatedBy: req.admin._id },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await AuditLog.create({
      action: 'INTERVIEW_SETTINGS_UPDATED',
      admin: req.admin._id,
      newValue: setting.value,
    });

    res.status(200).json({ success: true, message: 'Settings updated successfully', settings: setting.value, data: setting.value });
  } catch (error) {
    next(error);
  }
});

export default router;
