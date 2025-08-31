const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authentication' 
    });
  }
};

// Middleware to check if user is a doctor
const requireDoctor = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {});
    
    if (req.user.role !== 'doctor') {
      return res.status(403).json({ 
        success: false, 
        message: 'Doctor access required' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization' 
    });
  }
};

// Middleware to check if user is a patient
const requirePatient = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {});
    
    if (req.user.role !== 'patient') {
      return res.status(403).json({ 
        success: false, 
        message: 'Patient access required' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization' 
    });
  }
};

// Middleware to check if user is an admin
const requireAdmin = async (req, res, next) => {
  try {
    await authenticateToken(req, res, () => {});
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }
    
    next();
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error during authorization' 
    });
  }
};

module.exports = {
  authenticateToken,
  requireDoctor,
  requirePatient,
  requireAdmin
};
