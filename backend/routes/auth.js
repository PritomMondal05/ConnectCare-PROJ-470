const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register user
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('firstName').notEmpty().trim(),
  body('lastName').notEmpty().trim(),
  body('role').isIn(['doctor', 'patient', 'admin']).optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password, firstName, lastName, role = 'patient', ...profileData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }

    // Create new user
    const newUser = new User({
      email,
      password,
      firstName,
      lastName,
      role,
      ...profileData
    });

    await newUser.save();

    // Create role-specific profile
    if (role === 'doctor') {
      const doctorProfile = new Doctor({
        userId: newUser._id,
        specialization: profileData.specialization || 'General Medicine',
        licenseNumber: profileData.licenseNumber || `LIC-${Date.now()}`,
        experience: profileData.experience || 0
      });
      await doctorProfile.save();
    } else if (role === 'patient') {
      const patientProfile = new Patient({
        userId: newUser._id,
        bloodGroup: profileData.bloodGroup,
        height: profileData.height,
        weight: profileData.weight
      });
      await patientProfile.save();
    } else if (role === 'admin') {
      // No separate Admin model; user role is sufficient
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser._id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: newUser.toPublicJSON()
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
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

    let profile = null;
    if (user.role === 'doctor') {
      profile = await Doctor.findOne({ userId: user._id }).populate('userId');
    } else if (user.role === 'patient') {
      profile = await Patient.findOne({ userId: user._id }).populate('userId');
    }

    res.json({
      success: true,
      user: user.toPublicJSON(),
      profile
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching profile' 
    });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
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

    // Update user fields
    const { firstName, lastName, phone, dateOfBirth, gender, address } = req.body;
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phone) user.phone = phone;
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (gender) user.gender = gender;
    if (address) user.address = address;

    await user.save();

    // Update role-specific profile
    if (user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: user._id });
      if (doctorProfile) {
        const { specialization, experience, bio, consultationFee } = req.body;
        if (specialization) doctorProfile.specialization = specialization;
        if (experience !== undefined) doctorProfile.experience = experience;
        if (bio) doctorProfile.bio = bio;
        if (consultationFee !== undefined) doctorProfile.consultationFee = consultationFee;
        await doctorProfile.save();
      }
    } else if (user.role === 'patient') {
      const patientProfile = await Patient.findOne({ userId: user._id });
      if (patientProfile) {
        const { bloodGroup, height, weight, emergencyContact } = req.body;
        if (bloodGroup) patientProfile.bloodGroup = bloodGroup;
        if (height !== undefined) patientProfile.height = height;
        if (weight !== undefined) patientProfile.weight = weight;
        if (emergencyContact) patientProfile.emergencyContact = emergencyContact;
        await patientProfile.save();
      }
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toPublicJSON()
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating profile' 
    });
  }
});

module.exports = router;
