import express from 'express';
import InterviewTemplate from '../models/InterviewTemplate.js';
import InterviewTemplateVersion from '../models/InterviewTemplateVersion.js';
import Candidate from '../models/Candidate.js';
import InterviewSession from '../models/InterviewSession.js';
import { protectAdmin } from '../middleware/auth.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

// Get all templates
router.get('/', async (req, res, next) => {
  try {
    const templates = await InterviewTemplate.find().populate('role', 'name').sort({ name: 1 });
    res.status(200).json({ success: true, count: templates.length, data: templates });
  } catch (error) {
    next(error);
  }
});

// Get single template
router.get('/:id', async (req, res, next) => {
  try {
    const template = await InterviewTemplate.findById(req.params.id).populate('role', 'name');
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }
    res.status(200).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// Create template
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const template = new InterviewTemplate({
      ...req.body,
    });
    await template.save();

    await AuditLog.create({
      action: 'TEMPLATE_CREATE',
      admin: req.admin._id,
      newValue: template,
    });

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    next(error);
  }
});

// Update template (supports versioning when used)
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const template = await InterviewTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const { changeSummary, ...updatedFields } = req.body;

    // Check if template is used by any candidate or session
    const isUsedInCandidate = await Candidate.exists({ template: template._id });
    const isUsedInSession = await InterviewSession.exists({ template: template._id });
    const isUsed = isUsedInCandidate || isUsedInSession;

    let responseMsg = 'Template updated';
    let savedTemplate = null;

    if (isUsed) {
      // Create version snapshot of current config before updating
      const snapshot = JSON.parse(JSON.stringify(template));
      
      const newVersion = await InterviewTemplateVersion.create({
        templateId: template._id,
        versionNumber: template.version,
        createdBy: req.admin._id,
        fullConfigSnapshot: snapshot,
        changeSummary: changeSummary || `Automated version backup (v${template.version})`,
      });

      // Update and increment version
      const oldVersionNumber = template.version;
      Object.assign(template, updatedFields);
      template.version = oldVersionNumber + 1;
      savedTemplate = await template.save();

      await AuditLog.create({
        action: 'TEMPLATE_VERSION_CREATE',
        admin: req.admin._id,
        oldValue: snapshot,
        newValue: savedTemplate,
        metadata: {
          previousVersionId: newVersion._id,
          version: savedTemplate.version,
        },
      });

      responseMsg = `Template was in use. Created version snapshot v${oldVersionNumber} and updated template to v${savedTemplate.version}`;
    } else {
      // Update directly (not in use yet)
      const oldValue = JSON.parse(JSON.stringify(template));
      Object.assign(template, updatedFields);
      savedTemplate = await template.save();

      await AuditLog.create({
        action: 'TEMPLATE_UPDATE',
        admin: req.admin._id,
        oldValue,
        newValue: savedTemplate,
      });
    }

    res.status(200).json({ success: true, message: responseMsg, data: savedTemplate });
  } catch (error) {
    next(error);
  }
});

// Compare versions of a template
router.get('/:id/versions', protectAdmin, async (req, res, next) => {
  try {
    const versions = await InterviewTemplateVersion.find({ templateId: req.params.id })
      .populate('createdBy', 'name')
      .sort({ versionNumber: -1 });
    res.status(200).json({ success: true, count: versions.length, data: versions });
  } catch (error) {
    next(error);
  }
});

// Restore previous version as a new template version
router.post('/:id/restore/:versionId', protectAdmin, async (req, res, next) => {
  try {
    const template = await InterviewTemplate.findById(req.params.id);
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const versionToRestore = await InterviewTemplateVersion.findById(req.params.versionId);
    if (!versionToRestore) {
      return res.status(404).json({ success: false, message: 'Version backup not found' });
    }

    const snapshot = JSON.parse(JSON.stringify(template));
    
    // Save current as backup
    const newVersionBackup = await InterviewTemplateVersion.create({
      templateId: template._id,
      versionNumber: template.version,
      createdBy: req.admin._id,
      fullConfigSnapshot: snapshot,
      changeSummary: `Backup before restoring v${versionToRestore.versionNumber}`,
    });

    // Apply snapshot config to template
    const restoredConfig = versionToRestore.fullConfigSnapshot;
    delete restoredConfig._id;
    delete restoredConfig.version;
    delete restoredConfig.createdAt;
    delete restoredConfig.updatedAt;

    Object.assign(template, restoredConfig);
    template.version = template.version + 1;
    await template.save();

    res.status(200).json({
      success: true,
      message: `Successfully restored version v${versionToRestore.versionNumber} config as version v${template.version}`,
      data: template,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
