const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const router = express.Router();

// Update any user's profile (Admin only)
router.put('/users/:userId/profile', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      firstName,
      lastName,
      phone,
      address,
      dateOfBirth,
      gender,
      // doctor-specific
      specialization,
      experience,
      bio,
      consultationFee,
      // patient-specific
      bloodGroup,
      height,
      weight,
      emergencyContact
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (gender !== undefined) user.gender = gender;
    await user.save();

    if (user.role === 'doctor') {
      const doc = await Doctor.findOne({ userId: user._id });
      if (doc) {
        if (specialization !== undefined) doc.specialization = specialization;
        if (experience !== undefined) doc.experience = experience;
        if (bio !== undefined) doc.bio = bio;
        if (consultationFee !== undefined) doc.consultationFee = consultationFee;
        await doc.save();
      }
    }
    if (user.role === 'patient') {
      const pat = await Patient.findOne({ userId: user._id });
      if (pat) {
        if (bloodGroup !== undefined) pat.bloodGroup = bloodGroup;
        if (height !== undefined) pat.height = height;
        if (weight !== undefined) pat.weight = weight;
        if (emergencyContact !== undefined) pat.emergencyContact = emergencyContact;
        await pat.save();
      }
    }

    res.json({ success: true, message: 'Profile updated', user: user.toPublicJSON ? user.toPublicJSON() : user });
  } catch (error) {
    console.error('Admin update user profile error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating profile' });
  }
});

module.exports = router;


