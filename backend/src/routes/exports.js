import express from 'express';
import ExcelJS from 'exceljs';
import Candidate from '../models/Candidate.js';
import InterviewSession from '../models/InterviewSession.js';
import { protectAdmin } from '../middleware/auth.js';

const router = express.Router();

// Export candidates list as CSV or Excel
router.get('/candidates', protectAdmin, async (req, res, next) => {
  try {
    const { format } = req.query; // 'csv' | 'xlsx'
    const candidates = await Candidate.find({ isActive: true }).populate('jobRole', 'name').populate('campaign', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Candidates Report');

    worksheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'College/Company', key: 'college', width: 25 },
      { header: 'Job Role', key: 'jobRole', width: 20 },
      { header: 'Campaign', key: 'campaign', width: 20 },
      { header: 'Pipeline Stage', key: 'pipelineStage', width: 18 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Expiry Date', key: 'invitationExpiry', width: 20 },
    ];

    candidates.forEach((cand) => {
      worksheet.addRow({
        name: cand.name,
        email: cand.email,
        mobile: cand.mobile || 'N/A',
        college: cand.college || 'N/A',
        jobRole: cand.jobRole ? cand.jobRole.name : 'N/A',
        campaign: cand.campaign ? cand.campaign.name : 'N/A',
        pipelineStage: cand.pipelineStage,
        status: cand.status,
        invitationExpiry: cand.invitationExpiry ? cand.invitationExpiry.toLocaleDateString() : 'N/A',
      });
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates_export.csv"');
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="candidates_export.xlsx"');
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    next(error);
  }
});

// Export interview session results
router.get('/results', protectAdmin, async (req, res, next) => {
  try {
    const { format } = req.query;
    const sessions = await InterviewSession.find({ status: 'COMPLETED' })
      .populate('candidate', 'name email college')
      .populate('jobRole', 'name');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Assessment Results');

    worksheet.columns = [
      { header: 'Candidate Name', key: 'name', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Job Role', key: 'jobRole', width: 20 },
      { header: 'Technical Score', key: 'technical', width: 15 },
      { header: 'Resume Score', key: 'resume', width: 15 },
      { header: 'Problem Solving', key: 'problemSolving', width: 18 },
      { header: 'Aptitude', key: 'aptitude', width: 15 },
      { header: 'Communication', key: 'communication', width: 18 },
      { header: 'Overall Score', key: 'overall', width: 15 },
      { header: 'Recommendation', key: 'recommendation', width: 20 },
    ];

    sessions.forEach((s) => {
      worksheet.addRow({
        name: s.candidate ? s.candidate.name : 'N/A',
        email: s.candidate ? s.candidate.email : 'N/A',
        jobRole: s.jobRole ? s.jobRole.name : 'N/A',
        technical: s.scores.technical,
        resume: s.scores.resume,
        problemSolving: s.scores.problemSolving,
        aptitude: s.scores.aptitude,
        communication: s.scores.communication,
        overall: s.scores.overall,
        recommendation: s.report ? s.report.recommendation : 'PENDING',
      });
    });

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="interview_results.csv"');
      await workbook.csv.write(res);
    } else {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="interview_results.xlsx"');
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    next(error);
  }
});

export default router;
