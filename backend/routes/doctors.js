const express = require('express');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const { authenticateToken, requireDoctor } = require('../middleware/auth');

const router = express.Router();

// Get current doctor profile (authenticated doctor only)
router.get('/me', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor profile not found' 
      });
    }
    
    const populatedDoctor = await Doctor.findById(doctor._id)
      .populate('userId', 'firstName lastName email phone profileImage dateOfBirth gender address');
    
    res.json({
      success: true,
      doctor: populatedDoctor
    });
  } catch (error) {
    console.error('Get current doctor error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching doctor profile' 
    });
  }
});

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const { specialization, search, page = 1, limit = 10 } = req.query;
    
    let query = { isActive: true };
    
    // Filter by specialization
    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }
    
    // Search functionality
    if (search) {
      query.$or = [
        { specialization: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } }
      ];
    }
    
    const doctors = await Doctor.find(query)
      .populate('userId', 'firstName lastName email phone profileImage')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ rating: -1, experience: -1 });
    
    const total = await Doctor.countDocuments(query);
    
    res.json({
      success: true,
      doctors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching doctors' 
    });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'firstName lastName email phone profileImage dateOfBirth gender address');
    
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }
    
    res.json({
      success: true,
      doctor
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching doctor' 
    });
  }
});

// Get doctor's appointments
router.get('/:id/appointments', async (req, res) => {
  try {
    const { date, status } = req.query;
    let query = { doctorId: req.params.id };
    
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }
    
    if (status) {
      query.status = status;
    }
    
    const appointments = await Appointment.find(query)
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email phone')
      .sort({ appointmentDate: 1, appointmentTime: 1 });
    
    res.json({
      success: true,
      appointments
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching appointments' 
    });
  }
});

// Update doctor availability
router.put('/:id/availability', async (req, res) => {
  try {
    const { availability } = req.body;
    
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Doctor not found' 
      });
    }
    
    doctor.availability = availability;
    await doctor.save();
    
    res.json({
      success: true,
      message: 'Availability updated successfully',
      availability: doctor.availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating availability' 
    });
  }
});

// Get doctor statistics
router.get('/:id/stats', async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    const totalAppointments = await Appointment.countDocuments({ doctorId });
    const completedAppointments = await Appointment.countDocuments({ 
      doctorId, 
      status: 'completed' 
    });
    const todayAppointments = await Appointment.countDocuments({
      doctorId,
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    
    const doctor = await Doctor.findById(doctorId);
    
    res.json({
      success: true,
      stats: {
        totalAppointments,
        completedAppointments,
        todayAppointments,
        rating: doctor.rating,
        experience: doctor.experience,
        totalReviews: doctor.totalReviews
      }
    });
  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching statistics' 
    });
  }
});

// Get specializations
router.get('/specializations/list', async (req, res) => {
  try {
    const specializations = await Doctor.distinct('specialization');
    
    res.json({
      success: true,
      specializations
    });
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching specializations' 
    });
  }
});

module.exports = router;
