import { test } from 'node:test';
import assert from 'node:assert';
import { getEmailService } from '../src/services/email/EmailService.js';
import { 
  invitationTemplate, 
  approvalTemplate, 
  rejectionTemplate 
} from '../src/services/email/templates.js';

test('Brevo SMTP Email Templates & Service Tests', async (t) => {

  await t.test('1. Templates Content Checks', () => {
    const candidateName = 'Rahul Sharma';
    const inviteCode = 'ABCD1234';
    const url = 'http://localhost:5173/interview';

    // Invitation Template Check
    const inviteHtml = invitationTemplate.html(candidateName, inviteCode, url);
    const inviteText = invitationTemplate.text(candidateName, inviteCode, url);
    assert.ok(inviteHtml.includes('Rahul Sharma'));
    assert.ok(inviteHtml.includes('ABCD1234'));
    assert.ok(inviteHtml.includes(url));
    assert.ok(inviteHtml.includes('Aparaitech Software'));
    assert.ok(inviteText.includes(inviteCode));

    // Approval Template Check
    const approvalHtml = approvalTemplate.html(candidateName, 85);
    const approvalText = approvalTemplate.text(candidateName, 85);
    assert.ok(approvalHtml.includes('APPROVED'));
    assert.ok(approvalHtml.includes('85/100'));
    assert.ok(approvalText.includes('85/100'));

    // Rejection Template Check
    const rejectionHtml = rejectionTemplate.html(candidateName, 45);
    const rejectionText = rejectionTemplate.text(candidateName, 45);
    assert.ok(rejectionHtml.includes('not been selected'));
    assert.ok(rejectionHtml.includes('45/100'));
    assert.ok(rejectionText.includes('45/100'));
  });

  await t.test('2. EmailService Mock Sender Fallback', async () => {
    // Force development/mock setup
    process.env.BREVO_API_KEY = 'your_brevo_api_key'; // Placeholder, should mock send
    
    const emailService = getEmailService();
    // Since BREVO_API_KEY is placeholder, email service should run in mock mode
    assert.strictEqual(emailService.isConfigured, false);

    const mockCandidate = { name: 'Test Candidate', email: 'test@example.com' };
    const res = await emailService.sendInvitationEmail(mockCandidate, 'MOCKCODE', 'http://mockurl');
    
    assert.ok(res.success);
    assert.ok(res.mock);
  });
});
