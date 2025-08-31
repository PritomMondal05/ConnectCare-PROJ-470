const express = require('express');
const Patient = require('../models/Patient');
const User = require('../models/User');
const { authenticateToken, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Get current patient profile (authenticated patient only)
router.get('/me', authenticateToken, requirePatient, async (req, res) => {
  try {
    // Get patient ID from authenticated user
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    // Populate user details
    const populatedPatient = await Patient.findById(patient._id)
      .populate('userId', 'firstName lastName email phone profileImage dateOfBirth gender');

    res.json({
      success: true,
      patient: populatedPatient
    });
  } catch (error) {
    console.error('Get current patient error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patient profile'
    });
  }
});

// Get all patients (with basic filtering and pagination)
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 10 } = req.query;

    // Build query
    const userQuery = {};
    if (search) {
      userQuery.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Find patient documents and populate basic user fields
    const patients = await Patient.find({})
      .populate({
        path: 'userId',
        match: userQuery,
        select: 'firstName lastName email phone profileImage',
      })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    // Filter out entries where populate match removed the user
    const filteredPatients = patients.filter(p => p.userId);

    // For total count respecting the search on user fields, fetch matching users then count patients with those users
    let total = 0;
    if (search) {
      const matchingUsers = await User.find(userQuery).select('_id');
      const matchingUserIds = matchingUsers.map(u => u._id);
      total = await Patient.countDocuments({ userId: { $in: matchingUserIds } });
    } else {
      total = await Patient.countDocuments({});
    }

    res.json({
      success: true,
      patients: filteredPatients,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching patients',
    });
  }
});

module.exports = router;


