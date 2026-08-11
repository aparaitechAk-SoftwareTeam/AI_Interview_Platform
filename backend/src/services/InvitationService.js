import Invitation from '../models/Invitation.js';
import Candidate from '../models/Candidate.js';
import AuditLog from '../models/AuditLog.js';
import Notification from '../models/Notification.js';
import { generateInvitationCode, generateLinkToken } from '../utils/invitation.js';
import { getEmailService } from './email/EmailService.js';

class InvitationService {
  /**
   * Generates a unique invitation code, retrying on collision
   */
  async generateUniqueCode() {
    let attempts = 0;
    while (attempts < 10) {
      const code = generateInvitationCode();
      const existing = await Invitation.findOne({ code });
      if (!existing) {
        return code;
      }
      attempts++;
    }
    throw new Error('Collision limit reached generating unique invitation code');
  }

  /**
   * Generates a unique secure link token, retrying on collision
   */
  async generateUniqueToken() {
    let attempts = 0;
    while (attempts < 10) {
      const token = generateLinkToken();
      const existing = await Invitation.findOne({ linkToken: token });
      if (!existing) {
        return token;
      }
      attempts++;
    }
    throw new Error('Collision limit reached generating unique link token');
  }

  /**
   * Builds the secure interview invitation link
   */
  buildInterviewLink(linkToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return `${frontendUrl}/interview/invite/${linkToken}`;
  }

  /**
   * Creates an invitation for a candidate
   */
  async createInvitation(candidateId, expiresAt) {
    const code = await this.generateUniqueCode();
    const linkToken = await this.generateUniqueToken();

    const invitation = await Invitation.create({
      candidate: candidateId,
      code,
      linkToken,
      expiresAt: expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // default 7 days
    });

    return invitation;
  }

  /**
   * Sends or resends the invitation email, updating invitation status fields
   */
  async sendInvitationEmail(invitationId, adminId = null, forceSend = false) {
    const invitation = await Invitation.findById(invitationId);
    if (!invitation) {
      throw new Error(`Invitation ${invitationId} not found`);
    }

    const candidate = await Candidate.findById(invitation.candidate)
      .populate('jobRole')
      .populate('campaign');

    if (!candidate) {
      throw new Error(`Candidate associated with invitation ${invitationId} not found`);
    }

    // Duplicate Prevention Check
    if (candidate.invitationEmailSent && !forceSend) {
      console.log(`[InvitationService] Invitation email already sent to ${candidate.email}, skipping automatic resend.`);
      return { success: true, emailStatus: invitation.emailStatus || 'SENT', skipped: true };
    }

    const inviteLink = this.buildInterviewLink(invitation.linkToken);
    const emailService = getEmailService();

    invitation.emailAttemptCount += 1;
    invitation.emailLastAttemptAt = new Date();

    try {
      const result = await emailService.sendInvitation(candidate, invitation.code, inviteLink);
      
      if (result.success) {
        if (result.mock) {
          invitation.emailStatus = 'DEVELOPMENT_PREVIEW';
        } else {
          invitation.emailStatus = 'SENT';
          invitation.emailSentAt = new Date();
        }
        await invitation.save();

        // Mark candidate invitation as sent
        candidate.invitationEmailSent = true;
        candidate.invitationEmailSentAt = new Date();
        await candidate.save();

        await AuditLog.create({
          action: 'INVITATION_EMAIL_SENT',
          admin: adminId,
          candidateId: candidate._id,
          newValue: { emailStatus: invitation.emailStatus },
        });

        return { success: true, emailStatus: invitation.emailStatus };
      } else {
        invitation.emailStatus = 'FAILED';
        invitation.emailFailureReason = result.error || 'Unknown transporter error';
        await invitation.save();

        await AuditLog.create({
          action: 'INVITATION_EMAIL_FAILED',
          admin: adminId,
          candidateId: candidate._id,
          newValue: { failureReason: invitation.emailFailureReason },
        });

        return { success: false, error: invitation.emailFailureReason };
      }
    } catch (error) {
      console.error(`[InvitationService] Send email failed:`, error);
      invitation.emailStatus = 'FAILED';
      invitation.emailFailureReason = error.message;
      await invitation.save();

      await AuditLog.create({
        action: 'INVITATION_EMAIL_FAILED',
        admin: adminId,
        candidateId: candidate._id,
        newValue: { failureReason: error.message },
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Resends an existing invitation
   */
  async resendInvitation(candidateId, adminId = null) {
    const invitation = await Invitation.findOne({ candidate: candidateId });
    if (!invitation) {
      throw new Error('No invitation exists for candidate');
    }
    
    // Revive invitation status if appropriate
    if (invitation.status === 'REVOKED') {
      invitation.status = 'UNUSED';
      invitation.revokedAt = undefined;
      invitation.revokedReason = undefined;
    }
    
    await invitation.save();
    return this.sendInvitationEmail(invitation._id, adminId, true); // Force send
  }

  /**
   * Regenerates (reissues) a brand new invitation code + link for a candidate.
   * Used by admins when the old code was already consumed (single-use), lost,
   * or otherwise needs to be replaced. The candidate is emailed the new code
   * automatically so they can retry.
   */
  async regenerateCode(candidateId, adminId = null, reason = '') {
    const invitation = await Invitation.findOne({ candidate: candidateId });
    if (!invitation) {
      throw new Error('No invitation exists for candidate');
    }

    const newCode = await this.generateUniqueCode();
    const newLinkToken = await this.generateUniqueToken();

    invitation.previousCodes = invitation.previousCodes || [];
    invitation.previousCodes.push(invitation.code);
    invitation.code = newCode;
    invitation.linkToken = newLinkToken;
    invitation.reissueCount = (invitation.reissueCount || 0) + 1;
    invitation.status = 'UNUSED';
    invitation.activatedAt = undefined;
    invitation.deviceId = undefined;
    invitation.revokedAt = undefined;
    invitation.revokedReason = undefined;
    invitation.emailStatus = 'PENDING';
    await invitation.save();

    const candidate = await Candidate.findById(candidateId);
    if (candidate) {
      candidate.status = 'INVITED';
      candidate.pipelineStage = 'INVITED';
      candidate.pipelineHistory.push({
        stage: 'INVITED',
        changedBy: adminId || undefined,
        note: reason || 'Admin regenerated invitation code',
      });
      await candidate.save();
    }

    await AuditLog.create({
      action: 'INVITATION_CODE_REGENERATED',
      admin: adminId,
      candidateId,
      newValue: { code: newCode, reason },
    });

    // Email the candidate their new code so they can retry immediately (Force send)
    const emailResult = await this.sendInvitationEmail(invitation._id, adminId, true);

    await Notification.create({
      recipient: candidateId,
      recipientModel: 'Candidate',
      title: 'New Invitation Code Issued',
      message: 'Your interview invitation code has been reset. A new code has been sent to your email — please check your inbox to retry.',
      type: 'INVITATION_CODE_REGENERATED',
      channels: ['IN_APP', 'EMAIL'],
    });

    return { invitation, emailResult };
  }

  /**
   * Revokes an invitation
   */
  async revokeInvitation(candidateId, reason, adminId = null) {
    const invitation = await Invitation.findOne({ candidate: candidateId });
    if (!invitation) {
      throw new Error('No invitation exists for candidate');
    }

    invitation.status = 'REVOKED';
    invitation.revokedAt = new Date();
    invitation.revokedReason = reason || 'Revoked by administrator';
    await invitation.save();

    await AuditLog.create({
      action: 'INVITATION_REVOKE',
      admin: adminId,
      candidateId,
      newValue: { status: 'REVOKED', reason },
    });

    return invitation;
  }
}

export const getInvitationService = () => {
  return new InvitationService();
};
