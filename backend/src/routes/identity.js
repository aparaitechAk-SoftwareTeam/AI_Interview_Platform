import express from 'express';
import Candidate from '../models/Candidate.js';
import FaceProfile from '../models/FaceProfile.js';
import { getStorageProvider } from '../services/storage/index.js';
import { getFaceProvider } from '../services/face/index.js';

const router = express.Router();

// Upload Reference Selfie
router.post('/selfie/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { image } = req.body; // Expects Base64 image from frontend camera

    if (!image) {
      return res.status(400).json({ success: false, message: 'No image data provided' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Convert Base64 image to binary buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Save image using StorageProvider
    const storage = getStorageProvider();
    const uploadResult = await storage.uploadFile(buffer, `selfie-${candidateId}.jpg`, 'image/jpeg');

    candidate.referenceSelfiePath = uploadResult.path;
    candidate.status = 'ACTIVATED'; // proceed candidate workflow
    await candidate.save();

    res.status(200).json({
      success: true,
      message: 'Reference selfie saved successfully',
      path: uploadResult.path,
    });
  } catch (error) {
    next(error);
  }
});

// Compare live face photo against reference
router.post('/verify/:candidateId', async (req, res, next) => {
  try {
    const { candidateId } = req.params;
    const { image } = req.body; // Base64 live photo

    if (!image) {
      return res.status(400).json({ success: false, message: 'No live image provided' });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    if (!candidate.referenceSelfiePath) {
      return res.status(400).json({ success: false, message: 'Reference selfie has not been captured yet' });
    }

    // Convert Base64 image to buffer
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // Save live shot
    const storage = getStorageProvider();
    const uploadResult = await storage.uploadFile(buffer, `live-${candidateId}-${Date.now()}.jpg`, 'image/jpeg');

    // Perform Face Comparison using provider
    const faceProvider = getFaceProvider();
    const result = await faceProvider.compareFaces(candidate.referenceSelfiePath, uploadResult.path);

    // Save Verification log in FaceProfile
    let faceProfile = await FaceProfile.findOne({ referenceSelfiePath: candidate.referenceSelfiePath });
    if (!faceProfile) {
      faceProfile = new FaceProfile({ referenceSelfiePath: candidate.referenceSelfiePath });
    }

    faceProfile.verificationLogs.push({
      matchedImage: uploadResult.path,
      confidence: result.confidence,
      status: result.status,
      checkedAt: new Date(),
    });
    await faceProfile.save();

    res.status(200).json({
      success: true,
      matched: result.success,
      confidence: result.confidence,
      status: result.status,
      liveImagePath: uploadResult.path,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
