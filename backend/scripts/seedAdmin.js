import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import Admin from '../src/models/Admin.js';
import JobRole from '../src/models/JobRole.js';
import Campaign from '../src/models/Campaign.js';
import InterviewTemplate from '../src/models/InterviewTemplate.js';
import { connectDB } from '../src/config/db.js';

dotenv.config();

const seed = async () => {
  try {
    // Connect to database
    await connectDB();

    // 1. Seed Admin
    const email = process.env.ADMIN_EMAIL || 'admin@aiinterview.com';
    const password = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    const name = 'Platform Admin';

    console.log(`[Seed Admin] Checking if admin already exists: ${email}`);
    const existingAdmin = await Admin.findOne({ email });

    if (existingAdmin) {
      console.log(`[Seed Admin] Admin already exists. Updating password...`);
      const salt = await bcrypt.genSalt(10);
      existingAdmin.passwordHash = await bcrypt.hash(password, salt);
      existingAdmin.name = name;
      await existingAdmin.save();
      console.log(`[Seed Admin] Admin updated successfully!`);
    } else {
      console.log(`[Seed Admin] Creating new admin account...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const admin = new Admin({
        email,
        passwordHash,
        name,
      });

      await admin.save();
      console.log(`[Seed Admin] Admin created successfully!`);
    }

    // 2. Seed Default Job Roles
    console.log(`[Seed JobRoles] Checking existing job roles...`);
    const countRoles = await JobRole.countDocuments();
    let defaultRole;
    if (countRoles === 0) {
      console.log(`[Seed JobRoles] Seeding default job roles...`);
      const roles = [
        {
          name: 'Software Engineer (Frontend)',
          description: 'Responsible for building stunning, user-facing UI components and logic.',
          requiredSkills: ['React', 'JavaScript', 'CSS', 'Vite'],
          experienceLevel: 'Junior',
          defaultDuration: 30
        },
        {
          name: 'Software Engineer (Backend)',
          description: 'Focuses on designing performant APIs, services, and database schemas.',
          requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
          experienceLevel: 'Mid',
          defaultDuration: 30
        },
        {
          name: 'Product Manager',
          description: 'Drives the strategy, roadmap, and feature definition of product lifecycle.',
          requiredSkills: ['Agile', 'Product Strategy', 'UI/UX', 'Analytics'],
          experienceLevel: 'Senior',
          defaultDuration: 45
        }
      ];

      for (const r of roles) {
        const jobRole = new JobRole(r);
        await jobRole.save();
        console.log(`[Seed JobRoles] Created JobRole: ${r.name}`);
      }
      defaultRole = await JobRole.findOne();
    } else {
      console.log(`[Seed JobRoles] Job roles already exist.`);
      defaultRole = await JobRole.findOne();
    }

    // 3. Seed Default Templates and Campaigns
    console.log(`[Seed InterviewTemplate] Seeding default template if none exist...`);
    const countTemplates = await InterviewTemplate.countDocuments();
    let defaultTemplate;
    if (countTemplates === 0 && defaultRole) {
      defaultTemplate = new InterviewTemplate({
        name: 'Standard Evaluation Rubric',
        role: defaultRole._id,
        version: 1,
        language: 'English',
        tone: 'Professional',
        speakingSpeed: 'Normal',
        duration: 30,
        difficulty: 'Adaptive',
        weights: {
          technical: 40,
          resume: 20,
          problemSolving: 15,
          hr: 10,
          aptitude: 10,
          communication: 5
        },
        mustCoverTopics: ['React', 'CSS Flexbox/Grid', 'State Management'],
        antiCheatingStrictness: 'Medium',
        calibrationRequired: true,
        recordingMode: 'AUDIO_ONLY',
        resultVisibility: 'ReleasedByAdmin',
        isActive: true
      });
      await defaultTemplate.save();
      console.log(`[Seed InterviewTemplate] Created default template.`);
    } else {
      defaultTemplate = await InterviewTemplate.findOne();
    }

    const countCampaigns = await Campaign.countDocuments();
    if (countCampaigns === 0 && defaultRole) {
      const defaultCampaign = new Campaign({
        name: 'Fall Internship 2026 Outreach',
        description: 'Outreach campaign for hiring fresh grads and interns.',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        allowedRoles: [defaultRole._id],
        defaultTemplate: defaultTemplate ? defaultTemplate._id : null,
      });
      await defaultCampaign.save();
      console.log(`[Seed Campaign] Created default campaign: ${defaultCampaign.name}`);
    }

    console.log(`[Seed Admin] Email: ${email}`);
    console.log(`[Seed Admin] Password: ${password}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Admin] Error seeding database: ${error.message}`);
    process.exit(1);
  }
};

seed();
