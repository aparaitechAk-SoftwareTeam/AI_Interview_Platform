/**
 * Email Templates Module
 * Provides HTML and plain-text templates for candidate communications.
 */

// Helper: Common wrapper layout for HTML emails
const getHtmlLayout = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Aparaitech Software AI Interview Platform</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f4f6f9;
      color: #334155;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      background-color: #f4f6f9;
      padding: 24px 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
    }
    .header {
      background: linear-gradient(135deg, #1e293b, #0f172a);
      color: #ffffff;
      padding: 32px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 700;
      letter-spacing: -0.025em;
    }
    .header p {
      margin: 4px 0 0 0;
      font-size: 14px;
      color: #94a3b8;
    }
    .content {
      padding: 32px 24px;
      line-height: 1.6;
      font-size: 16px;
    }
    .footer {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
    }
    .btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 12px 28px;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      margin: 24px 0;
      box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }
    .btn:hover {
      background-color: #1d4ed8;
    }
    .info-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .info-box table {
      width: 100%;
      border-collapse: collapse;
    }
    .info-box td {
      padding: 8px 0;
      font-size: 15px;
    }
    .info-box td.label {
      font-weight: 600;
      color: #64748b;
      width: 140px;
    }
    .info-box td.value {
      font-weight: 700;
      color: #0f172a;
    }
    .code-badge {
      font-family: Menlo, Monaco, Consolas, 'Courier New', monospace;
      background-color: #e2e8f0;
      color: #0f172a;
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 700;
    }
    .score-highlight {
      font-size: 24px;
      font-weight: 800;
      color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="container">
      <div class="header">
        <h1>Aparaitech Software</h1>
        <p>AI Interview Platform</p>
      </div>
      <div class="content">
        ${content}
      </div>
      <div class="footer">
        <p>This is an automated notification from Aparaitech Software AI Interview Platform.</p>
        <p>&copy; ${new Date().getFullYear()} Aparaitech Software. All rights reserved.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;

export const invitationTemplate = {
  subject: 'You’re Invited to Your AI Interview',
  html: (candidateName, invitationCode, interviewUrl) => getHtmlLayout(`
    <p>Hello <strong>${candidateName}</strong>,</p>
    <p>You have been invited to complete an AI-powered interview.</p>
    
    <div class="info-box">
      <table>
        <tr>
          <td class="label">Invitation Code:</td>
          <td class="value"><span class="code-badge">${invitationCode}</span></td>
        </tr>
      </table>
    </div>

    <p>Please use the following link to start your interview:</p>
    
    <div style="text-align: center;">
      <a href="${interviewUrl}" class="btn" target="_blank">Start Your Interview</a>
    </div>

    <div style="margin-top: 24px; font-size: 14px; color: #64748b; border-top: 1px solid #f1f5f9; padding-top: 16px;">
      <p><strong>Important Instructions:</strong></p>
      <ul style="padding-left: 20px; margin: 8px 0;">
        <li>Use the email address registered for your application.</li>
        <li>Keep your invitation code confidential.</li>
        <li>Complete the interview before the invitation expires.</li>
      </ul>
    </div>

    <p style="margin-top: 24px;">Best regards,<br><strong>Aparaitech Software Team</strong></p>
  `),
  text: (candidateName, invitationCode, interviewUrl) => `
Hello ${candidateName},

You have been invited to complete an AI-powered interview.

Your interview invitation code is:
${invitationCode}

Please use the following link to start your interview:
${interviewUrl}

Important:
- Use the email address registered for your application.
- Keep your invitation code confidential.
- Complete the interview before the invitation expires.

Best regards,
Aparaitech Software
AI Interview Platform
`
};

export const approvalTemplate = {
  subject: 'Interview Result - You Have Been Approved',
  html: (candidateName, overallScore) => getHtmlLayout(`
    <p>Hello <strong>${candidateName}</strong>,</p>
    <p>Congratulations!</p>
    <p>We are pleased to inform you that your AI interview has been reviewed and your application has been <strong>APPROVED</strong>.</p>
    
    <div class="info-box" style="text-align: center; padding: 24px 16px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600;">Interview Score</p>
      <div class="score-highlight">${overallScore}/100</div>
    </div>

    <p>Thank you for participating in the interview process.</p>
    <p>Our team will contact you regarding the next steps.</p>

    <p style="margin-top: 32px;">Best regards,<br><strong>Aparaitech Software Team</strong></p>
  `),
  text: (candidateName, overallScore) => `
Hello ${candidateName},

Congratulations!

We are pleased to inform you that your AI interview has been reviewed and your application has been APPROVED.

Interview Score:
${overallScore}/100

Thank you for participating in the interview process.

Our team will contact you regarding the next steps.

Best regards,
Aparaitech Software
AI Interview Platform
`
};

export const rejectionTemplate = {
  subject: 'Interview Result - Application Update',
  html: (candidateName, overallScore) => getHtmlLayout(`
    <p>Hello <strong>${candidateName}</strong>,</p>
    <p>Thank you for participating in our AI interview process.</p>
    <p>After reviewing your interview, we regret to inform you that your application has not been selected to move forward at this time.</p>
    
    <div class="info-box" style="text-align: center; padding: 24px 16px;">
      <p style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; font-weight: 600;">Interview Score</p>
      <div class="score-highlight" style="color: #64748b;">${overallScore}/100</div>
    </div>

    <p>We appreciate your time and effort.</p>
    <p>We encourage you to continue improving your skills and apply for future opportunities.</p>

    <p style="margin-top: 32px;">Best regards,<br><strong>Aparaitech Software Team</strong></p>
  `),
  text: (candidateName, overallScore) => `
Hello ${candidateName},

Thank you for participating in our AI interview process.

After reviewing your interview, we regret to inform you that your application has not been selected to move forward at this time.

Interview Score:
${overallScore}/100

We appreciate your time and effort.

We encourage you to continue improving your skills and apply for future opportunities.

Best regards,
Aparaitech Software
AI Interview Platform
`
};

export const decisionTemplate = {
  subject: (decision) => `AI Interview Result - Update on your status (${decision === 'APPROVED' ? 'ACCEPTED' : decision})`,
  html: (candidateName, decision, feedback, nextSteps) => getHtmlLayout(`
    <p>Hello <strong>${candidateName}</strong>,</p>
    <p>Your AI interview has been reviewed by our hiring team.</p>
    
    <div class="info-box">
      <table>
        <tr>
          <td class="label">Interview Status:</td>
          <td class="value"><span class="code-badge" style="background-color: ${
            decision === 'APPROVED' ? '#d1fae5' :
            decision === 'REJECTED' ? '#fee2e2' :
            decision === 'HOLD' ? '#fef3c7' : '#f3e8ff'
          }; color: ${
            decision === 'APPROVED' ? '#065f46' :
            decision === 'REJECTED' ? '#991b1b' :
            decision === 'HOLD' ? '#92400e' : '#6b21a8'
          }; padding: 6px 12px; border-radius: 6px; font-weight: 800;">${
            decision === 'APPROVED' ? 'ACCEPTED / SHORTLISTED' :
            decision === 'REJECTED' ? 'NOT SELECTED' :
            decision === 'HOLD' ? 'ON HOLD' : 'RE-INTERVIEW REQUIRED'
          }</span></td>
        </tr>
      </table>
    </div>

    ${feedback ? `
    <p><strong>Feedback from the hiring team:</strong></p>
    <blockquote style="margin: 16px 0; padding: 12px 16px; background-color: #f8fafc; border-left: 4px solid #3b82f6; font-style: italic; color: #475569;">
      "${feedback}"
    </blockquote>
    ` : ''}

    <p><strong>Next Steps:</strong></p>
    <p>${nextSteps}</p>

    <p style="margin-top: 32px;">Best regards,<br><strong>Aparaitech Software Team</strong></p>
  `),
  text: (candidateName, decision, feedback, nextSteps) => `
Hello ${candidateName},

Your AI interview has been reviewed by our hiring team.

Interview Status: ${decision === 'APPROVED' ? 'ACCEPTED' : decision}

Feedback:
${feedback || 'No feedback provided.'}

Next Steps:
${nextSteps}

Best regards,
Aparaitech Software
AI Interview Platform
`
};
