import express from 'express';
import QuestionBankItem from '../models/QuestionBankItem.js';
import MandatoryQuestion from '../models/MandatoryQuestion.js';
import { protectAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// ==========================================
// QUESTION BANK ITEMS
// ==========================================

// Get question bank items (with query filters)
router.get('/', async (req, res, next) => {
  try {
    const { role, category, difficulty, skill } = req.query;
    const filter = { isActive: true };

    if (role) filter.role = role;
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (skill) filter.skill = { $regex: skill, $options: 'i' };

    const items = await QuestionBankItem.find(filter).populate('role', 'name').sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: items.length, data: items });
  } catch (error) {
    next(error);
  }
});

// Create question bank item
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const item = await QuestionBankItem.create(req.body);
    await AuditLog.create({
      action: 'QUESTION_BANK_CREATE',
      admin: req.admin._id,
      newValue: item,
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
});

// Update question bank item
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const item = await QuestionBankItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Question bank item not found' });
    }

    const oldValue = JSON.parse(JSON.stringify(item));
    const updated = await QuestionBankItem.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      action: 'QUESTION_BANK_UPDATE',
      admin: req.admin._id,
      oldValue,
      newValue: updated,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Deactivate question bank item
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const item = await QuestionBankItem.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Question bank item not found' });
    }

    item.isActive = false;
    await item.save();

    await AuditLog.create({
      action: 'QUESTION_BANK_DEACTIVATE',
      admin: req.admin._id,
      metadata: { id: item._id },
    });

    res.status(200).json({ success: true, message: 'Question bank item deactivated', data: item });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// MANDATORY QUESTIONS
// ==========================================

// Get all mandatory questions
router.get('/mandatory', async (req, res, next) => {
  try {
    const questions = await MandatoryQuestion.find({ isActive: true }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    next(error);
  }
});

// Create mandatory question
router.post('/mandatory', protectAdmin, async (req, res, next) => {
  try {
    const question = await MandatoryQuestion.create(req.body);
    await AuditLog.create({
      action: 'MANDATORY_QUESTION_CREATE',
      admin: req.admin._id,
      newValue: question,
    });
    res.status(201).json({ success: true, data: question });
  } catch (error) {
    next(error);
  }
});

// Update mandatory question
router.put('/mandatory/:id', protectAdmin, async (req, res, next) => {
  try {
    const question = await MandatoryQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Mandatory question not found' });
    }

    const oldValue = JSON.parse(JSON.stringify(question));
    const updated = await MandatoryQuestion.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      action: 'MANDATORY_QUESTION_UPDATE',
      admin: req.admin._id,
      oldValue,
      newValue: updated,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Deactivate mandatory question
router.delete('/mandatory/:id', protectAdmin, async (req, res, next) => {
  try {
    const question = await MandatoryQuestion.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ success: false, message: 'Mandatory question not found' });
    }

    question.isActive = false;
    await question.save();

    await AuditLog.create({
      action: 'MANDATORY_QUESTION_DEACTIVATE',
      admin: req.admin._id,
      metadata: { id: question._id },
    });

    res.status(200).json({ success: true, message: 'Mandatory question deactivated', data: question });
  } catch (error) {
    next(error);
  }
});

export default router;
