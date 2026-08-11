import Result from '../../models/Result.js';
import Candidate from '../../models/Candidate.js';
import AuditLog from '../../models/AuditLog.js';
import { getEmailService } from '../email/EmailService.js';

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // check hourly

/**
 * Sends the automatic 2-3 day follow-up email for any Result whose
 * followUpDueAt has passed and hasn't been sent yet. Runs on an interval so it
 * survives being checked across server restarts (state lives in the DB, not memory).
 */
async function processDueFollowUps() {
  try {
    const now = new Date();
    const due = await Result.find({
      followUpDueAt: { $lte: now },
      followUpSent: false,
    });

    if (!due.length) return;

    const emailService = getEmailService();

    for (const result of due) {
      try {
        const candidate = await Candidate.findById(result.candidate);
        if (!candidate) {
          result.followUpSent = true; // nothing to send to, don't retry forever
          await result.save();
          continue;
        }

        const emailResult = await emailService.sendFollowUp(candidate, result.status);
        result.followUpSent = true;
        await result.save();

        await AuditLog.create({
          action: 'RESULT_FOLLOW_UP_SENT',
          candidateId: candidate._id,
          newValue: { status: result.status, emailSuccess: emailResult.success },
        });
      } catch (err) {
        console.error(`[FollowUpScheduler] Failed to send follow-up for result ${result._id}:`, err);
        // leave followUpSent = false so it retries on the next tick
      }
    }
  } catch (err) {
    console.error('[FollowUpScheduler] Error while processing due follow-ups:', err);
  }
}

let intervalHandle = null;

export function startFollowUpScheduler() {
  if (intervalHandle) return;
  console.log('[FollowUpScheduler] Started — checking for due follow-up emails hourly.');
  // Run once shortly after startup, then on a fixed interval
  setTimeout(processDueFollowUps, 10 * 1000);
  intervalHandle = setInterval(processDueFollowUps, CHECK_INTERVAL_MS);
}

export function stopFollowUpScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}
