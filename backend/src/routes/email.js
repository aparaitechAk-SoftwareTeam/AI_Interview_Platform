import express from 'express';
import { protectAdmin } from '../middleware/auth.js';
import { getEmailService } from '../services/email/EmailService.js';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * @desc    Test SMTP/Brevo Email Connection
 * @route   GET /api/admin/email/test
 * @access  Private (Admin)
 */
router.get('/test', protectAdmin, async (req, res, next) => {
  try {
    const emailService = getEmailService();
    
    // Log the test action in Audit Logs
    await AuditLog.create({
      action: 'EMAIL_SERVICE_TEST_CONNECTION',
      admin: req.admin._id,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 1. If SMTP is configured and connects successfully
    if (emailService.isConfigured && emailService.transporter) {
      const smtpVerified = await new Promise((resolve) => {
        emailService.transporter.verify((error) => {
          if (error) {
            console.warn('[Email Test Route] SMTP verification failed:', error.message);
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });

      if (smtpVerified) {
        return res.status(200).json({
          success: true,
          message: 'Email service is configured correctly.'
        });
      }
    }

    // 2. Fallback: Check if the API key can authenticate via Brevo REST API
    if (emailService.pass && !emailService.pass.startsWith('<') && !emailService.pass.includes('PLACEHOLDER')) {
      try {
        const fromEmail = process.env.MAIL_FROM_EMAIL || 'krushnarathod.aparaitech@gmail.com';
        const fromName = process.env.MAIL_FROM_NAME || 'Aparaitech Software';

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': emailService.pass,
            'content-type': 'application/json'
          },
          body: JSON.stringify({
            sender: { name: fromName, email: fromEmail },
            to: [{ email: fromEmail }],
            subject: 'Email Probe Test Connection',
            htmlContent: '<p>Email connection test verification probe.</p>'
          })
        });

        if (response.status === 201 || response.status === 200) {
          return res.status(200).json({
            success: true,
            message: 'Email service is configured correctly.'
          });
        }
      } catch (err) {
        console.error('[Email Test Route] REST API probe failed:', err.message);
      }
    }

    return res.status(200).json({
      success: false,
      message: 'Email service configuration is invalid.'
    });
  } catch (error) {
    console.error('[Email Test Route] Unexpected error during connection test:', error.message);
    res.status(200).json({
      success: false,
      message: 'Email service configuration is invalid.'
    });
  }
});

export default router;
