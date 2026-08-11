# Task List - Brevo SMTP Email Notification System

- [x] Update `.env.example` with Brevo SMTP environment variables
- [x] Update Mongoose schema `Candidate.js` with email tracking fields
- [x] Create `templates.js` under `backend/src/services/email/` with HTML and text templates
- [x] Refactor `EmailService.js` to use `BREVO_*` variables, validate config on startup, and expose the requested functions
- [x] Update `InvitationService.js` to support duplicate email prevention on candidate creation and enforce sending on explicit resend action
- [x] Modify `candidates.js` to process bulk imports asynchronously in batches
- [x] Modify `results.js` to send approval/rejection emails upon database status update and handle errors gracefully
- [x] Create `email.js` route for SMTP connection test (`GET /api/admin/email/test`)
- [x] Register new email routes in `app.js`
- [x] Improve `CandidatesPage.jsx` frontend to show email status
- [ ] Add credentials to `backend/.env`
- [ ] Verify SMTP configuration and email sending
- [ ] Create walkthrough.md summarizing accomplishments
