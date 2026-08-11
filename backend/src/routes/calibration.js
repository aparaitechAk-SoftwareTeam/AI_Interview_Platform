import express from 'express';
import multer from 'multer';
import Candidate from '../models/Candidate.js';
import { getStorageProvider } from '../services/storage/index.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Upload calibration audio chunk and return verification stats
router.post('/:candidateId', upload.single('audio'), async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Audio file is required for calibration' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Save calibration audio
    const storage = getStorageProvider();
    const uploadResult = await storage.uploadFile(
      req.file.buffer,
      `calibration-${candidateId}.webm`,
      req.file.mimetype
    );

    res.status(200).json({
      success: true,
      message: 'Calibration sample processed successfully',
      audioPath: uploadResult.path,
      noiseLevel: 12.5, // Mock calibration data
      transcriptionText: 'Hello test 1 2 3 checking microphone levels.',
      status: 'PASS',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
