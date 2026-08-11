import nodemailer from 'nodemailer';
import { 
  invitationTemplate, 
  approvalTemplate, 
  rejectionTemplate 
} from './templates.js';

class EmailService {
  constructor() {
    this.host = process.env.BREVO_SMTP_HOST;
    this.port = parseInt(process.env.BREVO_SMTP_PORT || '587');
    this.user = process.env.BREVO_SMTP_USER;
    this.pass = process.env.BREVO_API_KEY;

    const fromEmail = process.env.MAIL_FROM_EMAIL;
    const fromName = process.env.MAIL_FROM_NAME || 'Aparaitech Software';
    this.from = fromEmail ? `"${fromName}" <${fromEmail}>` : null;

    this.transporter = null;
    this.isConfigured = false;

    // Configuration Validation
    if (!this.host || !this.user || !this.pass || !fromEmail ||
        this._isPlaceholder(this.host) || this._isPlaceholder(this.user) || this._isPlaceholder(this.pass) || this._isPlaceholder(fromEmail)) {
      console.warn('========================================================================');
      console.warn('[Email Config Error] Email service is NOT configured correctly!');
      console.warn('Missing or placeholder values found in environment variables:');
      if (!this.host || this._isPlaceholder(this.host)) console.warn(' - BREVO_SMTP_HOST');
      if (!this.port) console.warn(' - BREVO_SMTP_PORT');
      if (!this.user || this._isPlaceholder(this.user)) console.warn(' - BREVO_SMTP_USER');
      if (!this.pass || this._isPlaceholder(this.pass)) console.warn(' - BREVO_API_KEY');
      if (!fromEmail || this._isPlaceholder(fromEmail)) console.warn(' - MAIL_FROM_EMAIL');
      console.warn('All emails will be mocked and logged in the backend console.');
      console.warn('========================================================================');
    } else {
      try {
        this.transporter = nodemailer.createTransport({
          host: this.host,
          port: this.port,
          secure: this.port === 465,
          auth: {
            user: this.user,
            pass: this.pass,
          },
        });
        this.isConfigured = true;
        console.log(`[Email Service] SMTP configuration verified: YES`);
        
        this.transporter.verify((err, success) => {
          if (err) {
            console.error(`[Email Service] SMTP connection validation: FAILED (${err.message}). Will use REST API fallback if API key is valid.`);
          } else {
            console.log(`[Email Service] SMTP connection verification: SUCCESS`);
          }
        });
      } catch (error) {
        console.error('[Email Service] Failed to create SMTP transporter:', error.message);
        this.isConfigured = false;
      }
    }
  }

  /**
   * Helper to verify if a setting uses a placeholder value
   */
  _isPlaceholder(val) {
    return !val || 
           val.startsWith('<') || 
           val.includes('PLACEHOLDER') || 
           val.includes('your_');
  }

  /**
   * Safe centralized email sender with REST API fallback
   */
  async sendEmail({ to, subject, html, text }) {
    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      console.error(`[EMAIL] Attempted to send to invalid email address: "${to}"`);
      return { success: false, error: 'Invalid email address' };
    }

    // 1. Try sending via SMTP if transporter was established
    if (this.isConfigured && this.transporter) {
      try {
        const info = await this.transporter.sendMail({
          from: this.from,
          to,
          subject,
          text,
          html,
        });
        console.log(`[EMAIL] Sent successfully via Brevo SMTP: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
      } catch (error) {
        console.warn(`[EMAIL] Brevo SMTP relay failed (${error.message}). Attempting Brevo REST API fallback...`);
      }
    }

    // 2. Fallback: Try sending via Brevo Transactional Email REST API using the API Key
    if (this.pass && !this._isPlaceholder(this.pass)) {
      try {
        const fromEmail = process.env.MAIL_FROM_EMAIL || 'krushnarathod.aparaitech@gmail.com';
        const fromName = process.env.MAIL_FROM_NAME || 'Aparaitech Software';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': this.pass,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: {
              name: fromName,
              email: fromEmail
            },
            to: [
              {
                email: to
              }
            ],
            subject: subject,
            htmlContent: html,
            textContent: text
          })
        });

        if (response.status === 201 || response.status === 200) {
          const data = await response.json();
          console.log(`[EMAIL] Sent successfully via Brevo REST API: ${data.messageId}`);
          return { success: true, messageId: data.messageId };
        } else {
          const data = await response.json().catch(() => ({}));
          console.error('[EMAIL] Brevo REST API transmission failed:', data);
          return { success: false, error: data.message || 'REST API delivery failed' };
        }
      } catch (apiError) {
        console.error('[EMAIL] Brevo REST API request failed:', apiError.message);
        return { success: false, error: apiError.message };
      }
    }

    // 3. Mock fallback for local development preview
    this._logEmailMock({ to, subject, text });
    return { success: true, mock: true };
  }

  _logEmailMock({ to, subject, text }) {
    console.log('\n=================== MOCK EMAIL LOG ===================');
    console.log(`To:      ${to}`);
    console.log(`From:    ${this.from || 'no-reply@aparaitech.com'}`);
    console.log(`Subject: ${subject}`);
    console.log('------------------------------------------------------');
    console.log(text.trim());
    console.log('======================================================\n');
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
      console.log(`[EMAIL] Invitation email sent to ${candidate.email}${result.mock ? ' (MOCKED)' : ''}`);
    } else {
      console.log(`[EMAIL] Failed to send invitation email to ${candidate.email}`);
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
    if (result.success) {
      console.log(`[EMAIL] Approval email sent to ${candidate.email}${result.mock ? ' (MOCKED)' : ''}`);
    } else {
      console.log(`[EMAIL] Failed to send approval email to ${candidate.email}`);
    }
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
    if (result.success) {
      console.log(`[EMAIL] Rejection email sent to ${candidate.email}${result.mock ? ' (MOCKED)' : ''}`);
    } else {
      console.log(`[EMAIL] Failed to send rejection email to ${candidate.email}`);
    }
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
      const text = `Hello ${candidate.name},\n\nYour application is currently on hold. We will get back to you shortly.\n\nBest regards,\nAparaitech Software`;
      const html = `<p>Hello <strong>${candidate.name}</strong>,</p><p>Your application is currently on hold. We will get back to you shortly.</p><p>Best regards,<br>Aparaitech Software</p>`;
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

    const text = `Hello ${candidate.name},\n\n${body}\n\nBest regards,\nAparaitech Software`;
    const html = `<p>Hello <strong>${candidate.name}</strong>,</p><p>${body}</p><p>Best regards,<br>Aparaitech Software</p>`;
    
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
