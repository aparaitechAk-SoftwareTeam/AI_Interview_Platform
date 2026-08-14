import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';
import Candidate from '../models/Candidate.js';
import Invitation from '../models/Invitation.js';
import JobRole from '../models/JobRole.js';
import Campaign from '../models/Campaign.js';
import CandidateNote from '../models/CandidateNote.js';
import AuditLog from '../models/AuditLog.js';
import InterviewSession from '../models/InterviewSession.js';
import { protectAdmin } from '../middleware/auth.js';
import { generateInvitationCode, generateLinkToken } from '../utils/invitation.js';
import { getEmailService } from '../services/email/EmailService.js';
import { getInvitationService } from '../services/InvitationService.js';
import Notification from '../models/Notification.js';
import InterviewCheckpoint from '../models/InterviewCheckpoint.js';
import InterviewRecording from '../models/InterviewRecording.js';
import InterviewReport from '../models/InterviewReport.js';
import Result from '../models/Result.js';
import Resume from '../models/Resume.js';
import FaceProfile from '../models/FaceProfile.js';
import SystemCheck from '../models/SystemCheck.js';
import CalibrationSession from '../models/CalibrationSession.js';
import PipelineHistory from '../models/PipelineHistory.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Get candidates list (supports filters, search, sorting)
router.get('/', async (req, res, next) => {
  try {
    const { search, role, campaign, status, pipelineStage, tag } = req.query;
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { college: { $regex: search, $options: 'i' } },
      ];
    }
    if (role) filter.jobRole = role;
    if (campaign) filter.campaign = campaign;
    if (status) filter.status = status;
    if (pipelineStage) filter.pipelineStage = pipelineStage;
    if (tag) filter.tags = tag;

    const candidates = await Candidate.find(filter)
      .populate('jobRole', 'name')
      .populate('campaign', 'name')
      .sort({ createdAt: -1 });

    // Fetch invitation codes for all listed candidates
    const results = await Promise.all(
      candidates.map(async (c) => {
        const invite = await Invitation.findOne({ candidate: c._id });
        return {
          ...c.toObject(),
          invitation: invite ? { 
            code: invite.code, 
            status: invite.status, 
            expiresAt: invite.expiresAt, 
            linkToken: invite.linkToken,
            emailStatus: invite.emailStatus,
            emailSentAt: invite.emailSentAt,
            emailFailureReason: invite.emailFailureReason,
            emailAttemptCount: invite.emailAttemptCount
          } : null,
        };
      })
    );

    res.status(200).json({ success: true, count: results.length, data: results, candidates: results });
  } catch (error) {
    next(error);
  }
});

// Candidate Registry Overview (Pipeline counts & grouped list)
router.get('/registry', async (req, res, next) => {
  try {
    const candidates = await Candidate.find({ isActive: true })
      .populate('jobRole', 'name')
      .populate('campaign', 'name')
      .sort({ createdAt: -1 });

    const grouped = await Candidate.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$pipelineStage', count: { $sum: 1 } } }
    ]);

    const pipeline = Object.fromEntries(grouped.map(item => [item._id, item.count]));

    const listWithInvites = await Promise.all(
      candidates.map(async (c) => {
        const invite = await Invitation.findOne({ candidate: c._id });
        return {
          ...c.toObject(),
          fullName: c.name,
          phone: c.mobile,
          position: c.jobRole?.name || 'Software Engineer',
          invitation: invite ? {
            id: invite._id,
            code: invite.code,
            active: invite.active !== false,
            expiresAt: invite.expiresAt,
            emailDelivery: {
              status: invite.emailStatus || 'PENDING',
              sentAt: invite.emailSentAt || null,
              lastAttemptAt: invite.emailLastAttemptAt || null,
              error: invite.emailFailureReason || null,
            }
          } : null,
        };
      })
    );

    res.status(200).json({
      success: true,
      generatedAt: new Date().toISOString(),
      total: listWithInvites.length,
      pipeline,
      candidates: listWithInvites,
      data: listWithInvites,
    });
  } catch (error) {
    next(error);
  }
});

// Create candidate + Auto-generate invitation
router.post('/', protectAdmin, async (req, res, next) => {
  try {
    const { name, email, mobile, college, jobRole, experienceLevel, campaign, template, duration, schedulingMode, validFrom, validUntil, invitationExpiry, tags } = req.body;

    if (!name || !email || !jobRole) {
      return res.status(400).json({ success: false, message: 'Name, email, and job role are required' });
    }

    // Duplicate checks
    const emailExists = await Candidate.findOne({ email, isActive: true });
    if (emailExists) {
      return res.status(400).json({ success: false, message: `Candidate with email ${email} already exists` });
    }

    // Set expiry dates
    const expiry = invitationExpiry ? new Date(invitationExpiry) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days default
    const validF = validFrom ? new Date(validFrom) : new Date();
    const validU = validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default

    const candidate = await Candidate.create({
      name,
      email,
      mobile,
      college,
      jobRole,
      experienceLevel,
      campaign,
      template,
      duration: 5,
      schedulingMode,
      validFrom: validF,
      validUntil: validU,
      invitationExpiry: expiry,
      tags: tags || [],
      pipelineHistory: [{ stage: 'INVITED', changedBy: req.admin._id, note: 'Candidate registered in platform' }],
    });

    // Create Invitation using shared InvitationService
    const invitationService = getInvitationService();
    const invitation = await invitationService.createInvitation(candidate._id, expiry);

    await AuditLog.create({
      action: 'CANDIDATE_CREATE',
      admin: req.admin._id,
      candidateId: candidate._id,
      newValue: candidate,
    });

    // Load full details with populated role
    const populated = await Candidate.findById(candidate._id).populate('jobRole', 'name');
    const inviteLink = invitationService.buildInterviewLink(invitation.linkToken);

    // Automatically send invitation email
    const emailResult = await invitationService.sendInvitationEmail(invitation._id, req.admin._id);

    // Generate Admin Notification for Invitation Sent / Failed
    await Notification.create({
      recipient: req.admin._id,
      recipientModel: 'Admin',
      title: emailResult.success ? 'Invitation Sent' : 'Invitation Delivery Failed',
      message: emailResult.success
        ? `Invitation successfully dispatched to candidate: ${candidate.name} (${candidate.email}) for role: ${populated.jobRole?.name || 'Assigned role'}.`
        : `Failed to dispatch invitation email to: ${candidate.name}. Reason: ${emailResult.error || 'SMTP failed'}.`,
      type: emailResult.success ? 'INVITE_SENT' : 'INVITE_FAILED',
    });

    res.status(201).json({
      success: true,
      data: populated,
      invitation: {
        code: invitation.code,
        linkToken: invitation.linkToken,
        inviteLink,
        expiresAt: expiry,
        emailStatus: emailResult.emailStatus || 'FAILED',
      },
    });
  } catch (error) {
    next(error);
  }
});

// View detailed candidate
router.get('/:id', async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id)
      .populate('jobRole')
      .populate('campaign')
      .populate('template')
      .populate({
        path: 'notes',
        populate: { path: 'admin', select: 'name' },
      });

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const invitation = await Invitation.findOne({ candidate: candidate._id });
    const session = await InterviewSession.findOne({ candidate: candidate._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: candidate,
      invitation,
      session,
    });
  } catch (error) {
    next(error);
  }
});

// Update candidate profile
router.put('/:id', protectAdmin, async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const oldValue = JSON.parse(JSON.stringify(candidate));
    const updated = await Candidate.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    await AuditLog.create({
      action: 'CANDIDATE_UPDATE',
      admin: req.admin._id,
      candidateId: candidate._id,
      oldValue,
      newValue: updated,
    });

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// Helper function for cascading candidate data deletion
const performCandidateDataCleanup = async (candidateId = null) => {
  const query = candidateId ? { candidate: candidateId } : {};
  const notifQuery = candidateId ? { recipient: candidateId, recipientModel: 'Candidate' } : { recipientModel: 'Candidate' };
  const candQuery = candidateId ? { _id: candidateId } : {};

  await Promise.all([
    Invitation.deleteMany(query),
    InterviewSession.deleteMany(query),
    InterviewCheckpoint.deleteMany(query),
    InterviewRecording.deleteMany(query),
    InterviewReport.deleteMany(query),
    Result.deleteMany(query),
    CandidateNote.deleteMany(query),
    CalibrationSession.deleteMany(query),
    Resume.deleteMany(query),
    FaceProfile.deleteMany(query),
    SystemCheck.deleteMany(query),
    PipelineHistory.deleteMany(query),
    Notification.deleteMany(notifQuery),
    Candidate.deleteMany(candQuery),
  ]);
};

// Delete ALL candidates (Requires confirmText: 'DELETE')
const handleDeleteAllCandidates = async (req, res, next) => {
  try {
    const confirmText = req.body?.confirmText || req.query?.confirmText;
    if (confirmText !== 'DELETE') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation text "DELETE" is required to delete all candidates',
      });
    }

    const count = await Candidate.countDocuments();
    await performCandidateDataCleanup(null);

    await AuditLog.create({
      action: 'ALL_CANDIDATES_DELETE',
      admin: req.admin._id,
      newValue: { count },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted all ${count} candidates and associated data`,
      data: { deletedCount: count },
    });
  } catch (error) {
    next(error);
  }
};

router.delete('/all', protectAdmin, handleDeleteAllCandidates);
router.post('/delete-all', protectAdmin, handleDeleteAllCandidates);

// Bulk Delete Selected candidates by IDs array
router.post('/bulk-delete', protectAdmin, async (req, res, next) => {
  try {
    const { candidateIds } = req.body;
    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Array of candidateIds is required for bulk deletion' });
    }

    let deletedCount = 0;
    for (const candidateId of candidateIds) {
      const candidate = await Candidate.findById(candidateId);
      if (candidate) {
        await performCandidateDataCleanup(candidateId);
        deletedCount++;
      }
    }

    await AuditLog.create({
      action: 'BULK_CANDIDATES_DELETE',
      admin: req.admin._id,
      newValue: { requested: candidateIds.length, deletedCount },
    });

    return res.status(200).json({
      success: true,
      message: `Successfully deleted ${deletedCount} candidate(s)`,
      deletedCount,
    });
  } catch (error) {
    next(error);
  }
});

// Delete ONE candidate by ID
router.delete('/:id', protectAdmin, async (req, res, next) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const candidateName = candidate.name;
    const candidateEmail = candidate.email;

    await performCandidateDataCleanup(candidateId);

    await AuditLog.create({
      action: 'CANDIDATE_DELETE',
      admin: req.admin._id,
      candidateId,
      newValue: { name: candidateName, email: candidateEmail },
    });

    return res.status(200).json({
      success: true,
      message: `Candidate ${candidateName} deleted successfully`,
    });
  } catch (error) {
    next(error);
  }
});

// Add private note
router.post('/:id/notes', protectAdmin, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, message: 'Note text is required' });
    }

    const note = await CandidateNote.create({
      candidate: req.params.id,
      admin: req.admin._id,
      text,
    });

    await Candidate.findByIdAndUpdate(req.params.id, {
      $push: { notes: note._id },
    });

    res.status(201).json({ success: true, data: note });
  } catch (error) {
    next(error);
  }
});

// Allow retry / reschedule attempts
router.post('/:id/retry', protectAdmin, async (req, res, next) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Increment maximum allowed attempts
    candidate.maxAttempts = candidate.maxAttempts + 1;
    candidate.pipelineHistory.push({
      stage: 'INVITED',
      changedBy: req.admin._id,
      note: req.body.reason || 'Admin approved retry attempt — new invitation code issued',
    });
    await candidate.save();

    // Invitation codes are single-use, so a retry requires issuing a fresh code.
    // This also emails the candidate their new code automatically.
    const invitationService = getInvitationService();
    const { invitation, emailResult } = await invitationService.regenerateCode(
      candidate._id,
      req.admin._id,
      req.body.reason || 'Retry attempt approved by admin'
    );

    await AuditLog.create({
      action: 'CANDIDATE_RETRY_APPROVED',
      admin: req.admin._id,
      candidateId: candidate._id,
      metadata: { reason: req.body.reason },
    });

    res.status(200).json({
      success: true,
      message: 'Retry attempt approved. A new invitation code has been generated and emailed to the candidate.',
      data: candidate,
      invitation: {
        code: invitation.code,
        emailStatus: emailResult.emailStatus || (emailResult.success ? 'SENT' : 'FAILED'),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Extend invitation expiry
router.post('/:id/extend', protectAdmin, async (req, res, next) => {
  try {
    const { extensionDays } = req.body;
    const days = parseInt(extensionDays || '7');

    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const currentExpiry = candidate.invitationExpiry || new Date();
    const newExpiry = new Date(currentExpiry.getTime() + days * 24 * 60 * 60 * 1000);

    candidate.invitationExpiry = newExpiry;
    await candidate.save();

    const existingInvitation = await Invitation.findOne({ candidate: candidate._id });
    if (existingInvitation) {
      existingInvitation.expiresAt = newExpiry;
      // Only revive the code if it had expired and was never used — an already
      // ACTIVATED/STARTED code stays single-use and must be regenerated instead.
      if (existingInvitation.status === 'EXPIRED') {
        existingInvitation.status = 'UNUSED';
      }
      await existingInvitation.save();
    }

    await AuditLog.create({
      action: 'INVITATION_EXTEND_EXPIRY',
      admin: req.admin._id,
      candidateId: candidate._id,
      newValue: { newExpiry },
    });

    res.status(200).json({ success: true, message: `Expiry extended by ${days} days`, data: candidate });
  } catch (error) {
    next(error);
  }
});

// Download candidate import CSV template
router.get('/import-template', protectAdmin, (req, res) => {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=candidate_import_template.csv');
  const csvContent = 'Full Name,Email,Mobile,College / Company,Job Role,Experience Level,Campaign,Duration\nJohn Doe,john.doe@example.com,9876543210,State University,Software Engineer (Frontend),Fresher,Fall Internship 2026 Outreach,15\nJane Smith,jane.smith@example.com,9876543211,Tech Corp,Software Engineer (Backend),1-3 Years,Fall Internship 2026 Outreach,30\n';
  res.send(csvContent);
});

// Bulk Import validation preview
router.post('/import-preview', protectAdmin, upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a CSV or XLSX file' });
    }

    let rows = [];
    const filename = req.file.originalname;

    if (filename.endsWith('.csv')) {
      const fileContent = req.file.buffer.toString('utf-8');
      rows = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      });
    } else if (filename.endsWith('.xlsx')) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(req.file.buffer);
      const worksheet = workbook.getWorksheet(1);
      const headers = [];

      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          row.eachCell((cell) => {
            headers.push(cell.value ? cell.value.toString().trim() : '');
          });
        } else {
          const rowData = {};
          row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            const header = headers[colNumber - 1];
            if (header) {
              rowData[header] = cell.value;
            }
          });
          rows.push(rowData);
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Unsupported file type. Use CSV or XLSX' });
    }

    // Set maximum safe import limit of 500 rows
    if (rows.length > 500) {
      return res.status(400).json({ success: false, message: 'Safe import limit exceeded. Maximum 500 candidates allowed per import.' });
    }

    const defaultRole = await JobRole.findOne({ isActive: true });
    const defaultCampaign = await Campaign.findOne({ status: 'ACTIVE' });

    const previewRows = [];
    const emailsInFile = new Set();
    const mobilesInFile = new Set();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rawName = row['Full Name'] || row.Name || row.name || '';
      const name = typeof rawName === 'string' ? rawName.trim() : (rawName && rawName.toString ? rawName.toString().trim() : '');
      const rawEmail = row.Email || row.email || '';
      const email = typeof rawEmail === 'string' ? rawEmail.toLowerCase().trim() : (rawEmail && rawEmail.toString ? rawEmail.toString().toLowerCase().trim() : '');
      const mobileRaw = row.Mobile || row.mobile || '';
      const mobile = typeof mobileRaw === 'string' ? mobileRaw.trim() : (mobileRaw && mobileRaw.toString ? mobileRaw.toString().trim() : '');
      const college = row['College / Company'] || row.College || row.college || '';
      const roleName = row['Job Role'] || row.Role || row.role || '';
      let experienceLevel = row['Experience Level'] || row.experienceLevel || 'Fresher';
      const campaignName = row.Campaign || row.campaign || '';
      const durationVal = parseInt(row.Duration || row.duration || '30');

      let status = 'VALID';
      let reason = 'Ready to import';

      if (!name || !email) {
        status = 'MISSING_REQUIRED_FIELD';
        reason = 'Full Name and Email are required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        status = 'INVALID_EMAIL';
        reason = 'Invalid email format';
      } else if (emailsInFile.has(email)) {
        status = 'DUPLICATE';
        reason = 'Duplicate email found within the uploaded file';
      } else {
        emailsInFile.add(email);
        // Check DB duplicate
        const dbExists = await Candidate.findOne({ email, isActive: true });
        if (dbExists) {
          status = 'DUPLICATE';
          reason = 'Email already registered in the system';
        }
      }

      // Check duplicate mobile in file and database
      if (status === 'VALID' && mobile) {
        if (mobilesInFile.has(mobile)) {
          status = 'DUPLICATE';
          reason = 'Duplicate mobile found within the uploaded file';
        } else {
          mobilesInFile.add(mobile);
          const mobileExists = await Candidate.findOne({ mobile, isActive: true });
          if (mobileExists) {
            status = 'DUPLICATE';
            reason = 'Mobile number already registered in the system';
          }
        }
      }

      // Validate Experience Level
      if (status === 'VALID' && experienceLevel) {
        const allowedLevels = ['Fresher', 'Junior', 'Mid', 'Senior', 'Lead'];
        const trimmed = experienceLevel.toString().trim();
        const matched = allowedLevels.find(l => l.toLowerCase() === trimmed.toLowerCase());
        if (!matched) {
          status = 'INVALID';
          reason = `Experience Level must be one of: ${allowedLevels.join(', ')}`;
        } else {
          experienceLevel = matched; // normalize capitalization
        }
      }

      // Validate Duration
      let duration = 5;
      if (status === 'VALID') {
        const allowedDurations = [5];
        if (!allowedDurations.includes(durationVal)) {
          status = 'INVALID';
          reason = `Duration must be exactly 5 minutes for V1`;
        } else {
          duration = durationVal;
        }
      }

      // Match JobRole
      let resolvedRoleId = null;
      if (status === 'VALID') {
        let matchedRole = null;
        if (roleName) {
          matchedRole = await JobRole.findOne({ name: { $regex: `^${roleName.toString().trim()}$`, $options: 'i' }, isActive: true });
        }
        if (!matchedRole && defaultRole) {
          matchedRole = defaultRole;
        }
        if (matchedRole) {
          resolvedRoleId = matchedRole._id;
        } else {
          status = 'MISSING_ROLE';
          reason = 'Job role could not be resolved and no default role is active';
        }
      }

      // Match Campaign
      let resolvedCampaignId = null;
      if (status === 'VALID' && campaignName) {
        const matchedCamp = await Campaign.findOne({ name: { $regex: `^${campaignName.toString().trim()}$`, $options: 'i' } });
        if (matchedCamp) {
          resolvedCampaignId = matchedCamp._id;
        }
      } else if (status === 'VALID' && defaultCampaign) {
        resolvedCampaignId = defaultCampaign._id;
      }

      previewRows.push({
        rowNumber: i + 2,
        name,
        email,
        mobile,
        college,
        roleName: roleName || (defaultRole ? defaultRole.name : ''),
        resolvedRoleId,
        experienceLevel,
        campaignName: campaignName || (defaultCampaign ? defaultCampaign.name : ''),
        resolvedCampaignId,
        duration,
        status,
        reason,
        isValid: status === 'VALID'
      });
    }

    const summary = {
      total: previewRows.length,
      valid: previewRows.filter(r => r.isValid).length,
      invalid: previewRows.filter(r => !r.isValid && r.status !== 'DUPLICATE').length,
      duplicates: previewRows.filter(r => r.status === 'DUPLICATE').length,
    };

    res.status(200).json({ success: true, summary, rows: previewRows });
  } catch (error) {
    next(error);
  }
});

// Bulk Import confirmation
router.post('/import-confirm', protectAdmin, async (req, res, next) => {
  try {
    const { candidates } = req.body;
    if (!candidates || !Array.isArray(candidates)) {
      return res.status(400).json({ success: false, message: 'Invalid candidates payload' });
    }

    const summary = {
      total: candidates.length,
      imported: 0,
      duplicates: 0,
      invalid: 0,
      emailsSent: 0,
      emailsFailed: 0,
    };

    const results = [];
    const invitationService = getInvitationService();

    await AuditLog.create({
      action: 'BULK_IMPORT_STARTED',
      admin: req.admin._id,
      metadata: { count: candidates.length },
    });

    for (const item of candidates) {
      const { name, email, mobile, college, resolvedRoleId, experienceLevel, resolvedCampaignId, duration } = item;

      if (!name || !email || !resolvedRoleId) {
        summary.invalid++;
        results.push({ name, email, status: 'INVALID', error: 'Missing name, email or job role' });
        continue;
      }

      const duplicate = await Candidate.findOne({ email, isActive: true });
      if (duplicate) {
        summary.duplicates++;
        results.push({ name, email, status: 'DUPLICATE', error: 'Candidate already exists' });
        continue;
      }

      try {
        const expiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        
        // 1. Create candidate
        const candidate = await Candidate.create({
          name,
          email,
          mobile,
          college,
          jobRole: resolvedRoleId,
          experienceLevel,
          campaign: resolvedCampaignId,
          duration: 5,
          validFrom: new Date(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          invitationExpiry: expiry,
          pipelineHistory: [{ stage: 'INVITED', changedBy: req.admin._id, note: 'Bulk imported' }],
        });

        // 2. Create invitation
        const invitation = await invitationService.createInvitation(candidate._id, expiry);

        summary.imported++;
        await AuditLog.create({
          action: 'CANDIDATE_IMPORTED',
          admin: req.admin._id,
          candidateId: candidate._id,
        });

        // 3. Send invitation email to THIS specific candidate
        const emailResult = await invitationService.sendInvitationEmail(invitation._id, req.admin._id, true);

        if (emailResult.success) {
          summary.emailsSent++;
        } else {
          summary.emailsFailed++;
        }

        results.push({
          candidateId: candidate._id,
          name,
          email,
          status: 'IMPORTED',
          invitationCode: invitation.code,
          invitationLink: invitationService.buildInterviewLink(invitation.linkToken),
          emailStatus: emailResult.emailStatus || (emailResult.success ? 'SENT' : 'FAILED'),
          emailSent: emailResult.success,
          error: emailResult.success ? null : (emailResult.error || 'Email delivery failed'),
        });

      } catch (rowErr) {
        console.error(`Error importing row for ${email}:`, rowErr);
        summary.invalid++;
        results.push({ name, email, status: 'FAILED', error: rowErr.message });
      }
    }

    // Generate Admin System Notification
    const notifMsg = `Bulk import completed: ${summary.imported} candidates imported. ${summary.emailsSent} invitation emails sent successfully, ${summary.emailsFailed} failed.`;
    await Notification.create({
      recipient: req.admin._id,
      recipientModel: 'Admin',
      title: 'Bulk Import Finished',
      message: notifMsg,
      type: summary.emailsFailed > 0 ? 'WARNING' : 'INFO',
    });

    await AuditLog.create({
      action: 'BULK_IMPORT_COMPLETED',
      admin: req.admin._id,
      metadata: summary,
    });

    res.status(200).json({
      success: true,
      summary,
      rows: results,
    });

  } catch (error) {
    next(error);
  }
});

// Admin regenerates (reissues) the invitation code for a candidate.
// Used when the previous single-use code was already consumed, lost, or
// needs to be replaced for any reason. The candidate is emailed the new code.
router.post('/:id/regenerate-code', protectAdmin, async (req, res, next) => {
  try {
    const candidateId = req.params.id;
    const { reason } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const invitationService = getInvitationService();
    const { invitation, emailResult } = await invitationService.regenerateCode(candidateId, req.admin._id, reason);

    await Notification.create({
      recipient: req.admin._id,
      recipientModel: 'Admin',
      title: 'Invitation Code Regenerated',
      message: `A new invitation code was generated for ${candidate.name} (${candidate.email}). ${emailResult.success ? 'The candidate has been emailed.' : 'Email delivery failed — please resend manually.'}`,
      type: emailResult.success ? 'INFO' : 'WARNING',
    });

    if (emailResult.success) {
      return res.status(200).json({
        success: true,
        emailSent: true,
        message: emailResult.mock
          ? 'New invitation code generated (Email mocked in dev mode)'
          : 'New invitation code generated and email sent successfully',
        data: {
          code: invitation.code,
          linkToken: invitation.linkToken,
          inviteLink: invitationService.buildInterviewLink(invitation.linkToken),
          emailStatus: emailResult.emailStatus || (emailResult.mock ? 'DEVELOPMENT_PREVIEW' : 'SENT'),
        },
      });
    } else {
      return res.status(200).json({
        success: true,
        emailSent: false,
        message: `New invitation code generated (${invitation.code}), BUT email delivery failed: ${emailResult.error || 'Email service error'}. Please resend manually or check email settings.`,
        error: emailResult.error,
        data: {
          code: invitation.code,
          linkToken: invitation.linkToken,
          inviteLink: invitationService.buildInterviewLink(invitation.linkToken),
          emailStatus: 'FAILED',
          emailError: emailResult.error,
        },
      });
    }
  } catch (error) {
    next(error);
  }
});

// Resend invitation email
router.post('/:id/resend-email', protectAdmin, async (req, res, next) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const invitationService = getInvitationService();
    const result = await invitationService.resendInvitation(candidateId, req.admin._id);
    
    if (result.success) {
      const msg = result.emailStatus === 'DEVELOPMENT_PREVIEW'
        ? `Invitation email generated (Simulated in development mode for ${candidate.email})`
        : `Invitation email sent successfully to ${candidate.email}`;
      res.status(200).json({ 
        success: true, 
        message: msg, 
        emailStatus: result.emailStatus,
        emailSent: true,
        candidateName: candidate.name,
        candidateEmail: candidate.email
      });
    } else {
      res.status(200).json({ 
        success: false, 
        emailSent: false,
        message: `Failed to resend invitation email to ${candidate.email}: ${result.error || 'Mail delivery error'}. Please check SMTP/Brevo settings.`, 
        error: result.error,
        emailStatus: 'FAILED'
      });
    }
  } catch (error) {
    next(error);
  }
});

// Retry WhatsApp invitation independently
router.post('/:id/retry-whatsapp', protectAdmin, async (req, res, next) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    const invitation = await Invitation.findOne({ candidate: candidateId });
    if (!invitation) {
      return res.status(404).json({ success: false, message: 'No invitation record found for this candidate' });
    }

    const invitationService = getInvitationService();
    const result = await invitationService.sendWhatsAppInvitation(invitation._id, req.admin._id);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: `WhatsApp invitation sent successfully to ${candidate.mobile || candidate.phone || candidate.name}`,
        whatsAppStatus: 'SENT',
        whatsAppSent: true,
      });
    } else {
      res.status(200).json({
        success: false,
        whatsAppSent: false,
        whatsAppStatus: result.whatsAppStatus || 'CONFIGURATION_REQUIRED',
        message: result.whatsAppStatus === 'CONFIGURATION_REQUIRED'
          ? 'WhatsApp integration is implemented but real delivery is awaiting valid WhatsApp Business/Cloud API configuration.'
          : `Failed to send WhatsApp message: ${result.error || 'WhatsApp delivery error'}`,
        error: result.error,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
