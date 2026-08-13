import nodemailer from 'nodemailer';
import { 
  invitationTemplate, 
  approvalTemplate, 
  rejectionTemplate 
} from './templates.js';

class EmailService {
  constructor() {
    this.provider = (process.env.MAIL_PROVIDER || 'smtp').toLowerCase();
    
    // Explicit SMTP variables
    this.host = process.env.SMTP_HOST || process.env.BREVO_SMTP_HOST;
    this.port = parseInt(process.env.SMTP_PORT || process.env.BREVO_SMTP_PORT || '587');
    this.user = process.env.SMTP_USER || process.env.BREVO_SMTP_USER;
    this.pass = process.env.SMTP_PASS || (this.provider === 'brevo' ? process.env.BREVO_API_KEY : '');

    const fromAddress = process.env.MAIL_FROM || process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER || process.env.BREVO_SMTP_USER || '';
    const fromName = process.env.MAIL_FROM_NAME || 'Aparaitech Recruitment';
    this.from = {
      name: fromName,
      address: fromAddress
    };
    this.replyTo = process.env.MAIL_REPLY_TO || fromAddress;

    this.transporter = null;
    this.isConfigured = false;
    this.verificationStatus = 'UNVERIFIED';

    if (this.provider === 'smtp') {
      if (this.host && this.user && this.pass && fromAddress &&
          !this._isPlaceholder(this.host) && !this._isPlaceholder(this.user) && !this._isPlaceholder(this.pass) && !this._isPlaceholder(fromAddress)) {
        try {
          const isGmail = this.host.includes('gmail.com') || process.env.SMTP_SERVICE === 'gmail';
          this.transporter = nodemailer.createTransport(isGmail ? {
            service: 'gmail',
            auth: {
              user: this.user,
              pass: this.pass,
            },
          } : {
            host: this.host,
            port: this.port,
            secure: this.port === 465,
            auth: {
              user: this.user,
              pass: this.pass,
            },
            tls: { rejectUnauthorized: false }
          });
          this.isConfigured = true;
          
          this.transporter.verify((err) => {
            if (err) {
              this.verificationStatus = `FAILED: ${err.message}`;
              console.error(`[Email Service] SMTP verification FAILED: ${err.message}`);
            } else {
              this.verificationStatus = 'VERIFIED_SUCCESS';
              console.log(`[Email Service] SMTP connection & authentication: VERIFIED SUCCESS`);
            }
          });
        } catch (error) {
          console.error('[Email Service] Failed to create SMTP transporter:', error.message);
          this.isConfigured = false;
          this.verificationStatus = `ERROR: ${error.message}`;
        }
      }
    } else if (this.provider === 'brevo') {
      const apiKey = process.env.BREVO_API_KEY;
      if (apiKey && !this._isPlaceholder(apiKey)) {
        this.isConfigured = true;
        this.verificationStatus = 'BREVO_API_KEY_PRESENT';
      }
    }

    this._logDiagnostic();
  }

  _isPlaceholder(val) {
    return !val || 
           val.startsWith('<') || 
           val.includes('PLACEHOLDER') || 
           val.includes('your_');
  }

  _mask(str) {
    if (!str) return 'NOT_CONFIGURED';
    if (str.length <= 4) return '****';
    return str.substring(0, 3) + '****' + str.substring(str.length - 3);
  }

  _logDiagnostic() {
    console.log('========================================================================');
    console.log('[Email Service Configuration Diagnostic]');
    console.log(` - Provider:     ${this.provider.toUpperCase()}`);
    console.log(` - SMTP Host:    ${this.host || 'N/A'}`);
    console.log(` - SMTP Port:    ${this.port || 'N/A'}`);
    console.log(` - SMTP User:    ${this._mask(this.user)}`);
    console.log(` - Mail From:    "${this.from.name}" <${this.from.address || 'MISSING'}>`);
    console.log(` - Configured:   ${this.isConfigured ? 'YES' : 'NO'}`);
    console.log('========================================================================');
  }

  getDiagnosticInfo() {
    return {
      provider: this.provider,
      host: this.host || null,
      port: this.port || null,
      userMasked: this._mask(this.user),
      from: `"${this.from.name}" <${this.from.address}>`,
      isConfigured: this.isConfigured,
      verificationStatus: this.verificationStatus,
    };
  }

  async sendEmail({ to, subject, html, text }) {
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      console.error(`[EMAIL] Attempted to send to invalid email address: "${to}"`);
      return { success: false, error: 'Invalid recipient email address' };
    }

    // 1. SMTP Provider
    if (this.provider === 'smtp') {
      if (!this.isConfigured || !this.transporter) {
        const errorMsg = 'SMTP credentials missing or invalid. Please configure SMTP_USER & SMTP_PASS in environment.';
        console.error(`[EMAIL] Delivery failed for ${to}: ${errorMsg}`);
        return { success: false, error: errorMsg };
      }

      try {
        const info = await this.transporter.sendMail({
          from: `"${this.from.name}" <${this.from.address}>`,
          replyTo: this.replyTo,
          to,
          subject,
          text,
          html,
        });
        console.log(`[EMAIL] Sent successfully via SMTP to ${to} (${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.error(`[EMAIL] SMTP sendMail failed for ${to}: ${error.message}`);
        return { success: false, error: `SMTP error: ${error.message}` };
      }
    }

    // 2. Brevo REST API Provider
    if (this.provider === 'brevo') {
      const apiKey = process.env.BREVO_API_KEY;
      if (!apiKey || this._isPlaceholder(apiKey)) {
        return { success: false, error: 'BREVO_API_KEY missing or invalid in environment.' };
      }

      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': apiKey,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: this.from.name, email: this.from.address },
            to: [{ email: to }],
            subject: subject,
            htmlContent: html,
            textContent: text
          })
        });

        if (response.status === 201 || response.status === 200) {
          const data = await response.json();
          console.log(`[EMAIL] Sent successfully via Brevo REST API to ${to}: ${data.messageId}`);
          return { success: true, messageId: data.messageId };
        } else {
          const data = await response.json().catch(() => ({}));
          const apiErrMsg = data.message || `HTTP ${response.status} ${response.statusText}`;
          console.error(`[EMAIL] Brevo REST API failed for ${to}:`, apiErrMsg);
          return { success: false, error: `Brevo API error: ${apiErrMsg}` };
        }
      } catch (apiError) {
        console.error(`[EMAIL] Brevo REST API error for ${to}:`, apiError.message);
        return { success: false, error: `Brevo API error: ${apiError.message}` };
      }
    }

    return { success: false, error: `Unsupported MAIL_PROVIDER "${this.provider}"` };
  }

  /**
   * Sends an invitation email to a candidate
   */
  async sendInvitationEmail(candidate, inviteCode, inviteLink) {
    const subject = invitationTemplate.subject;
    const html = invitationTemplate.html(candidate.name, inviteCode, inviteLink);
    const text = invitationTemplate.text(candidate.name, inviteCode, inviteLink);

    console.log(`[EMAIL] Sending invitation email to ${candidate.email}`);
    const result = await this.sendEmail({ to: candidate.email, subject, html, text });
    if (result.success) {
      console.log(`[EMAIL] Invitation email sent to ${candidate.email}`);
    } else {
      console.log(`[EMAIL] Failed to send invitation email to ${candidate.email}: ${result.error}`);
    }
    return result;
  }

  /**
   * Sends bulk invitation email (shares template/logic with sendInvitationEmail)
   */
  async sendBulkInvitationEmail(candidate, inviteCode, inviteLink) {
    return this.sendInvitationEmail(candidate, inviteCode, inviteLink);
  }

  /**
   * Sends an approval email
   */
  async sendApprovalEmail(candidate, overallScore) {
    const subject = approvalTemplate.subject;
    const html = approvalTemplate.html(candidate.name, overallScore);
    const text = approvalTemplate.text(candidate.name, overallScore);

    console.log(`[EMAIL] Sending approval email to ${candidate.email}`);
    const result = await this.sendEmail({ to: candidate.email, subject, html, text });
    return result;
  }

  /**
   * Sends a rejection email
   */
  async sendRejectionEmail(candidate, overallScore) {
    const subject = rejectionTemplate.subject;
    const html = rejectionTemplate.html(candidate.name, overallScore);
    const text = rejectionTemplate.text(candidate.name, overallScore);

    console.log(`[EMAIL] Sending rejection email to ${candidate.email}`);
    const result = await this.sendEmail({ to: candidate.email, subject, html, text });
    return result;
  }

  /* Backward Compatibility Functions */

  async sendInvitation(candidate, inviteCode, inviteLink) {
    return this.sendInvitationEmail(candidate, inviteCode, inviteLink);
  }

  async sendDecisionUpdate(candidate, decision, feedback) {
    if (decision === 'APPROVED') {
      return this.sendApprovalEmail(candidate, 0);
    } else if (decision === 'REJECTED') {
      return this.sendRejectionEmail(candidate, 0);
    } else {
      const subject = `Update on your interview — application on hold`;
      const text = `Hello ${candidate.name},\n\nYour application is currently on hold. We will get back to you shortly.\n\nBest regards,\nAparaitech Recruitment`;
      const html = `<p>Hello <strong>${candidate.name}</strong>,</p><p>Your application is currently on hold. We will get back to you shortly.</p><p>Best regards,<br>Aparaitech Recruitment</p>`;
      return this.sendEmail({ to: candidate.email, subject, html, text });
    }
  }

  async sendFollowUp(candidate, decision) {
    const subject = decision === 'HOLD'
      ? `Following up on your application status`
      : `Thank you for your interest`;
    
    const body = decision === 'HOLD'
      ? `We wanted to follow up regarding your application for the position, which is currently on hold. Our team is still reviewing candidates and we will reach out as soon as a final decision is made. Thank you for your patience.`
      : `We wanted to once again thank you for taking the time to interview. While we are not moving forward at this time, we encourage you to keep an eye out for future openings.`;

    const text = `Hello ${candidate.name},\n\n${body}\n\nBest regards,\nAparaitech Recruitment`;
    const html = `<p>Hello <strong>${candidate.name}</strong>,</p><p>${body}</p><p>Best regards,<br>Aparaitech Recruitment</p>`;
    
    return this.sendEmail({ to: candidate.email, subject, html, text });
  }
}

let instance = null;
export const getEmailService = () => {
  if (!instance) {
    instance = new EmailService();
  }
  return instance;
};
