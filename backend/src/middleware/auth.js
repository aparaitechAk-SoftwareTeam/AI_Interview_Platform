import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Candidate from '../models/Candidate.js';

export const protectAdmin = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwttokendesigndev1234');
    req.admin = await Admin.findById(decoded.id).select('-passwordHash');
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Not authorized, admin not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

export const protectCandidate = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, candidate token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretjwttokendesigndev1234');
    req.candidate = await Candidate.findById(decoded.id);
    if (!req.candidate) {
      return res.status(401).json({ success: false, message: 'Not authorized, candidate not found' });
    }
    if (!req.candidate.isActive) {
      return res.status(401).json({ success: false, message: 'Not authorized, candidate deactivated' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, candidate token invalid' });
  }
};
