import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../src/config/db.js';
import Invitation from '../src/models/Invitation.js';
import Candidate from '../src/models/Candidate.js';

async function run() {
  await connectDB();
  
  const failedInvites = await Invitation.find({ emailStatus: 'FAILED' })
    .populate('candidate');
  
  console.log(`Found ${failedInvites.length} failed invitations:`);
  
  for (const inv of failedInvites) {
    console.log('\n----------------------------------------');
    console.log('Candidate Name:', inv.candidate?.name);
    console.log('Candidate Email:', inv.candidate?.email);
    console.log('Code:', inv.code);
    console.log('Failure Reason:', inv.emailFailureReason);
    console.log('Attempt Count:', inv.emailAttemptCount);
    console.log('Last Attempt:', inv.emailLastAttemptAt);
  }
  
  await mongoose.connection.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
