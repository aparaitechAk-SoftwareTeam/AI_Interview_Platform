import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';
import JobRole from '../models/JobRole.js';
import Campaign from '../models/Campaign.js';
import InterviewTemplate from '../models/InterviewTemplate.js';

export async function seedInitialData() {
  try {
    const targetEmail = (process.env.ADMIN_EMAIL || 'admin@aiinterview.com').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'AdminPassword123!';
    const name = 'Platform Admin';

    console.log(`[Startup Seed] Checking if admin exists: ${targetEmail}`);
    const existingAdmin = await Admin.findOne({ email: targetEmail });

    if (!existingAdmin) {
      console.log(`[Startup Seed] Creating new admin account...`);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      try {
        const admin = new Admin({
          email: targetEmail,
          passwordHash,
          name,
        });
        await admin.save();
        console.log(`[Startup Seed] Admin created successfully!`);
      } catch (saveErr) {
        if (saveErr.code === 11000) {
          console.log(`[Startup Seed] Admin index exists (E11000), updating existing document...`);
          const docToUpdate = await Admin.findOne({ email: targetEmail });
          if (docToUpdate) {
            const updateSalt = await bcrypt.genSalt(10);
            docToUpdate.passwordHash = await bcrypt.hash(password, updateSalt);
            await docToUpdate.save();
            console.log(`[Startup Seed] Admin password updated successfully.`);
          }
        } else {
          throw saveErr;
        }
      }
    } else {
      // Verify password is correct; update if stale
      const passwordOk = await existingAdmin.comparePassword(password);
      if (!passwordOk) {
        console.log(`[Startup Seed] Admin exists but password mismatch — resetting to default...`);
        const salt = await bcrypt.genSalt(10);
        existingAdmin.passwordHash = await bcrypt.hash(password, salt);
        await existingAdmin.save();
        console.log(`[Startup Seed] Admin password reset successfully.`);
      } else {
        console.log(`[Startup Seed] Admin already exists.`);
      }
    }

    // Seed Job Roles
    const countRoles = await JobRole.countDocuments();
    let defaultRole;
    if (countRoles === 0) {
      console.log(`[Startup Seed] Seeding default job roles...`);
      const roles = [
        {
          name: 'Software Engineer (Frontend)',
          description: 'Responsible for building stunning, user-facing UI components and logic.',
          requiredSkills: ['React', 'JavaScript', 'CSS', 'Vite'],
          experienceLevel: 'Junior',
          defaultDuration: 5
        },
        {
          name: 'Software Engineer (Backend)',
          description: 'Focuses on designing performant APIs, services, and database schemas.',
          requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
          experienceLevel: 'Mid',
          defaultDuration: 5
        },
        {
          name: 'Product Manager',
          description: 'Drives the strategy, roadmap, and feature definition of product lifecycle.',
          requiredSkills: ['Agile', 'Product Strategy', 'UI/UX', 'Analytics'],
          experienceLevel: 'Senior',
          defaultDuration: 5
        }
      ];

      for (const r of roles) {
        const jobRole = new JobRole(r);
        await jobRole.save();
        console.log(`[Startup Seed] Created JobRole: ${r.name}`);
      }
      defaultRole = await JobRole.findOne();
    } else {
      defaultRole = await JobRole.findOne();
    }

    // Seed Template & Campaign
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
        duration: 5,
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
      console.log(`[Startup Seed] Created default template.`);
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
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        allowedRoles: [defaultRole._id],
        defaultTemplate: defaultTemplate ? defaultTemplate._id : null,
      });
      await defaultCampaign.save();
      console.log(`[Startup Seed] Created default campaign: ${defaultCampaign.name}`);
    }

    console.log(`[Startup Seed] Seeding completed.`);
  } catch (error) {
    console.error(`[Startup Seed] Error: ${error.message}`);
  }
}
