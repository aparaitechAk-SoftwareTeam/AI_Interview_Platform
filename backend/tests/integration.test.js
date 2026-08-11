import { test, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from '../src/config/db.js';

// Load models
import Admin from '../src/models/Admin.js';
import JobRole from '../src/models/JobRole.js';
import InterviewTemplate from '../src/models/InterviewTemplate.js';
import QuestionBankItem from '../src/models/QuestionBankItem.js';
import MandatoryQuestion from '../src/models/MandatoryQuestion.js';
import Campaign from '../src/models/Campaign.js';
import Candidate from '../src/models/Candidate.js';
import InterviewSession from '../src/models/InterviewSession.js';

test('AI Interview Platform Mongoose Models & CRUD Integration Tests', async (t) => {
  // Set test environment
  process.env.NODE_ENV = 'test';

  before(async () => {
    // Connect to in-memory database fallback
    await connectDB();
  });

  after(async () => {
    await mongoose.connection.close();
  });

  await t.test('1. Admin Account Creation & Password Verification', async () => {
    await Admin.deleteMany({});
    
    const pwHash = await bcrypt.hash('SecurePassword123!', 10);
    const admin = await Admin.create({
      name: 'Super Recruiter',
      email: 'recruiter@aiinterview.com',
      passwordHash: pwHash,
    });

    assert.strictEqual(admin.email, 'recruiter@aiinterview.com');
    assert.strictEqual(admin.name, 'Super Recruiter');
    
    // Check password comparing works
    const isMatch = await admin.comparePassword('SecurePassword123!');
    assert.ok(isMatch, 'Password comparing must return true for correct pass');
  });

  await t.test('2. Job Role CRUD & Default V1 Duration Enforcements', async () => {
    await JobRole.deleteMany({});
    
    const role = await JobRole.create({
      name: 'Full Stack JavaScript Engineer',
      description: 'Develop React frontend and Node microservices.',
      skills: ['React', 'NodeJS', 'Express'],
      experienceLevel: 'Junior',
    });

    assert.strictEqual(role.name, 'Full Stack JavaScript Engineer');
    assert.strictEqual(role.defaultDuration, 5, 'Default V1 Job Role duration must be exactly 5 minutes');

    // Attempting invalid duration should throw validator error
    let threw = false;
    try {
      await JobRole.create({
        name: 'Invalid Role',
        defaultDuration: 15,
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message.toLowerCase().includes('validation failed') || err.message.includes('valid enum value'));
    }
    assert.ok(threw, 'Should have thrown validation error for duration 15');
  });

  await t.test('3. Interview Template CRUD & Total Weights Sum Validation', async () => {
    await InterviewTemplate.deleteMany({});
    
    const role = await JobRole.findOne();
    assert.ok(role, 'Job Role must exist');

    // Technical weights sum must equal 100
    const validTemplate = await InterviewTemplate.create({
      name: 'SDE-1 Front-End Core Rubric',
      role: role._id,
      duration: 5,
      difficulty: '3',
      weights: {
        technical: 40,
        resume: 20,
        problemSolving: 15,
        hr: 10,
        aptitude: 10,
        communication: 5
      }
    });

    assert.strictEqual(validTemplate.name, 'SDE-1 Front-End Core Rubric');
    assert.strictEqual(validTemplate.duration, 5, 'Template V1 duration must be 5');

    // Attempting non-100 sum should fail
    let threw = false;
    try {
      await InterviewTemplate.create({
        name: 'Broken Weight Template',
        role: role._id,
        weights: {
          technical: 50,
          resume: 20,
          problemSolving: 10,
          hr: 10,
          aptitude: 5,
          communication: 10
        }
      });
    } catch (err) {
      threw = true;
      assert.ok(err.message.includes('sum to 100'));
    }
    assert.ok(threw, 'Should have thrown error for weights sum not equal to 100');
  });

  await t.test('4. Question Bank CRUD & Schema Validation', async () => {
    await QuestionBankItem.deleteMany({});
    const role = await JobRole.findOne();
    assert.ok(role, 'Job Role must exist');

    const q = await QuestionBankItem.create({
      question: 'Explain Virtual DOM reconciliation in React.',
      role: role._id,
      skill: 'React',
      category: 'technical',
      difficulty: '3',
      expectedCompetency: 'Student should mention Fiber, diffing algorithm, and state reconciler.',
    });

    assert.strictEqual(q.question, 'Explain Virtual DOM reconciliation in React.');
    assert.strictEqual(q.isActive, true);
    assert.strictEqual(q.difficulty, '3');
  });

  await t.test('5. Mandatory Question CRUD & AI Exclusives', async () => {
    await MandatoryQuestion.deleteMany({});

    const mq = await MandatoryQuestion.create({
      question: 'Explain the difference between SQL and NoSQL databases.',
      category: 'technical',
      topic: 'Databases',
      difficulty: '4',
      mustAsk: true,
      maxFollowUps: 1,
    });

    assert.strictEqual(mq.question, 'Explain the difference between SQL and NoSQL databases.');
    assert.strictEqual(mq.mustAsk, true);
    assert.strictEqual(mq.maxFollowUps, 1);
  });

  await t.test('6. Campaigns CRUD & Default Expiry Days', async () => {
    await Campaign.deleteMany({});
    const role = await JobRole.findOne();
    const temp = await InterviewTemplate.findOne();
    assert.ok(role && temp, 'Dependencies must exist');

    const camp = await Campaign.create({
      name: 'Spring Graduates Outreach 2026',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      allowedRoles: [role._id],
      defaultTemplate: temp._id,
      inviteDefaults: {
        duration: 5,
        expiryDays: 14,
      }
    });

    assert.strictEqual(camp.name, 'Spring Graduates Outreach 2026');
    assert.strictEqual(camp.status, 'DRAFT', 'Default status must be DRAFT');
    assert.strictEqual(camp.inviteDefaults.duration, 5, 'Invite duration must be V1 5 min');
  });

  await t.test('7. Candidate Creation with V1 Defaults & Pipelines', async () => {
    await Candidate.deleteMany({});
    const role = await JobRole.findOne();
    const temp = await InterviewTemplate.findOne();
    const camp = await Campaign.findOne();
    assert.ok(role && temp && camp, 'Dependencies must exist');

    const cand = await Candidate.create({
      name: 'John Doe',
      email: 'john.doe@example.com',
      mobile: '9876543210',
      jobRole: role._id,
      template: temp._id,
      campaign: camp._id,
      experienceLevel: 'Junior',
      duration: 5,
      pipelineHistory: [{ stage: 'INVITED', note: 'Single create test' }],
    });

    assert.strictEqual(cand.name, 'John Doe');
    assert.strictEqual(cand.duration, 5, 'Candidate duration must be V1 5 min');
    assert.strictEqual(cand.status, 'INVITED', 'Initial state must be INVITED');
    assert.strictEqual(cand.pipelineStage, 'INVITED');
  });

  await t.test('8. Interview Session Creation & Checkpoint Recovery States', async () => {
    await InterviewSession.deleteMany({});
    const cand = await Candidate.findOne();
    const role = await JobRole.findOne();
    const temp = await InterviewTemplate.findOne();
    assert.ok(cand && role && temp, 'Dependencies must exist');

    const sess = await InterviewSession.create({
      candidate: cand._id,
      jobRole: role._id,
      template: temp._id,
      duration: 5,
      status: 'STARTED',
      startedAt: new Date(),
    });

    assert.strictEqual(sess.status, 'STARTED');
    assert.strictEqual(sess.duration, 5);

    // Test session state enums
    sess.status = 'COMPLETED';
    await sess.save();
    assert.strictEqual(sess.status, 'COMPLETED');
  });
});
