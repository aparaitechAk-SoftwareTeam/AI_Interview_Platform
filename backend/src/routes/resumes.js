import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import Candidate from '../models/Candidate.js';
import { getLLMProvider } from '../services/ai/index.js';
import { getStorageProvider } from '../services/storage/index.js';

const router = express.Router();

// Only accept genuine resume documents - PDF or Word (.doc/.docx)
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
const ALLOWED_EXTENSIONS = /\.(pdf|doc|docx)$/i;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const extOk = ALLOWED_EXTENSIONS.test(file.originalname || '');
    const mimeOk = ALLOWED_MIME_TYPES.has(file.mimetype);
    if (!extOk || !mimeOk) {
      const err = new Error('Only PDF or Word (.doc/.docx) resume files are accepted.');
      err.status = 400;
      return cb(err);
    }
    cb(null, true);
  },
});

// Upload Resume + Auto-run AI Analysis
router.post('/upload/:candidateId', (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, message: 'Resume file must be under 5MB.' });
      }
      return res.status(err.status || 400).json({ success: false, message: err.message || 'Invalid file upload.' });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF or Word (.doc/.docx) resume file' });
    }

    const candidate = await Candidate.findById(candidateId).populate('jobRole');
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Extract real text content from the file — no more silent mock fallback.
    // If the file cannot be parsed or has no meaningful text, reject the upload
    // instead of pretending it succeeded, so the candidate re-uploads a real resume.
    let textContent = '';
    if (req.file.mimetype === 'application/pdf') {
      try {
        const parsedPdf = await pdf(req.file.buffer);
        textContent = (parsedPdf.text || '').trim();
      } catch (parseErr) {
        console.warn('[Resume Upload] Failed to extract text from PDF:', parseErr.message);
        return res.status(400).json({
          success: false,
          message: 'We could not read this PDF. It may be corrupted, empty, or an image-only scan. Please upload a text-based PDF resume.',
        });
      }
    } else {
      // .doc/.docx — plain buffer decoding is unreliable for real docx (zipped XML),
      // so we only trust it if we can find readable text content in it.
      const raw = req.file.buffer.toString('utf-8');
      // Strip non-printable/binary noise typical of a failed decode
      textContent = raw.replace(/[^\x20-\x7E\n\r\t]+/g, ' ').trim();
    }

    if (!textContent || textContent.length < 40) {
      return res.status(400).json({
        success: false,
        message: 'This file does not appear to contain readable resume content. Please upload a valid PDF or Word resume.',
      });
    }

    // Save file using StorageProvider (only after validation passes)
    const storage = getStorageProvider();
    const uploadResult = await storage.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // Run AI Resume Analyzer — this is resume-specific, driven by the actual extracted text,
    // so different resumes produce different extracted skills/projects/experience.
    let parsedData;
    try {
      const llm = getLLMProvider();
      parsedData = await llm.analyzeResume(textContent, candidate.jobRole);
    } catch (aiErr) {
      console.error('[Resume Upload] AI analyzer failed:', aiErr);
      return res.status(502).json({
        success: false,
        message: 'Resume analysis failed. Please try uploading again in a moment.',
      });
    }

    // Save to Candidate DB
    candidate.resume = {
      filename: uploadResult.filename,
      path: uploadResult.path,
      text: textContent,
      parsed: parsedData,
    };
    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Resume uploaded and analyzed successfully',
      data: {
        filename: uploadResult.filename,
        path: uploadResult.path,
        parsed: parsedData,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
