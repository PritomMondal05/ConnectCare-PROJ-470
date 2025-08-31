const express = require('express');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authenticateToken, requireDoctor, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Create new appointment (requires authentication)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration,
      type,
      reason,
      symptoms,
      notes,
      isVirtual
    } = req.body;

    // Validate doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Validate patient exists and belongs to authenticated user
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    // Ensure the authenticated user is the patient trying to book the appointment
    if (patient.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only book appointments for yourself'
      });
    }

    // Check for time conflicts
    const conflictingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate,
      appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({
        success: false,
        message: 'Time slot is already booked'
      });
    }

    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      duration,
      type,
      reason: reason || 'General consultation',
      symptoms: symptoms ? [symptoms] : [],
      notes,
      isVirtual,
      status: 'scheduled'
    });

    await appointment.save();

    // Populate the appointment with full details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth')
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email phone');

    res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: populatedAppointment
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating appointment'
    });
  }
});

// Get all appointments for a patient
router.get('/patient/:patientId', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;
    let query = { patientId: req.params.patientId };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email phone')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// Get all appointments for a doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    let query = { doctorId: req.params.doctorId };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// Get appointments for current doctor (authenticated)
router.get('/doctor', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, date } = req.query;
    
    // Get doctor ID from authenticated user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    let query = { doctorId: doctor._id };

    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get current doctor appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// Get appointments for current patient (authenticated)
router.get('/patient', authenticateToken, requirePatient, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, upcoming } = req.query;
    
    // Get patient ID from authenticated user
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    let query = { patientId: patient._id };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.appointmentDate = { $gte: new Date() };
      query.status = { $in: ['scheduled', 'confirmed'] };
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email phone')
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ appointmentDate: 1, appointmentTime: 1 });

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      appointments,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get current patient appointments error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments'
    });
  }
});

// Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth gender')
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email phone');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.json({
      success: true,
      appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment'
    });
  }
});

// Update appointment
router.put('/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Update fields
    const {
      appointmentDate,
      appointmentTime,
      duration,
      type,
      reason,
      symptoms,
      notes,
      isVirtual,
      meetingLink
    } = req.body;

    if (appointmentDate) appointment.appointmentDate = appointmentDate;
    if (appointmentTime) appointment.appointmentTime = appointmentTime;
    if (duration) appointment.duration = duration;
    if (type) appointment.type = type;
    if (reason) appointment.reason = reason;
    if (symptoms) appointment.symptoms = symptoms;
    if (notes) appointment.notes = notes;
    if (isVirtual !== undefined) appointment.isVirtual = isVirtual;
    if (meetingLink) appointment.meetingLink = meetingLink;

    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth')
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment'
    });
  }
});

// Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status, cancellationReason, cancelledBy } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    appointment.status = status;
    
    if (status === 'cancelled') {
      appointment.cancellationReason = cancellationReason;
      appointment.cancelledBy = cancelledBy;
      appointment.cancellationDate = new Date();
    }

    await appointment.save();

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      status: appointment.status
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment status'
    });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/doctor/:doctorId/available-slots', async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date parameter is required'
      });
    }

    const doctor = await Doctor.findById(req.params.doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const appointmentDate = new Date(date);
    const dayOfWeek = appointmentDate.toLocaleDateString('en-US', { weekday: 'lowercase' });
    
    // Check if doctor is available on this day
    const dayAvailability = doctor.availability[dayOfWeek];
    if (!dayAvailability || !dayAvailability.available) {
      return res.json({
        success: true,
        availableSlots: []
      });
    }

    // Get booked appointments for this date
    const bookedAppointments = await Appointment.find({
      doctorId: req.params.doctorId,
      appointmentDate,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    // Generate time slots
    const startTime = dayAvailability.start;
    const endTime = dayAvailability.end;
    const slotDuration = 30; // minutes
    
    const slots = [];
    let currentTime = new Date(`2000-01-01T${startTime}`);
    const endDateTime = new Date(`2000-01-01T${endTime}`);
    
    while (currentTime < endDateTime) {
      const timeString = currentTime.toTimeString().slice(0, 5);
      
      // Check if slot is available
      const isBooked = bookedAppointments.some(appointment => 
        appointment.appointmentTime === timeString
      );
      
      if (!isBooked) {
        slots.push(timeString);
      }
      
      currentTime.setMinutes(currentTime.getMinutes() + slotDuration);
    }

    res.json({
      success: true,
      availableSlots: slots
    });
  } catch (error) {
    console.error('Get available slots error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots'
    });
  }
});

// Get appointment statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const todayAppointments = await Appointment.countDocuments({
      appointmentDate: {
        $gte: new Date().setHours(0, 0, 0, 0),
        $lt: new Date().setHours(23, 59, 59, 999)
      }
    });
    const upcomingAppointments = await Appointment.countDocuments({
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] }
    });
    const completedAppointments = await Appointment.countDocuments({ status: 'completed' });

    res.json({
      success: true,
      stats: {
        totalAppointments,
        todayAppointments,
        upcomingAppointments,
        completedAppointments
      }
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointment statistics'
    });
  }
});

// Update appointment status
router.put('/:id', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify the appointment belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update appointment status
    appointment.status = status;
    await appointment.save();

    // Populate the updated appointment
    const updatedAppointment = await Appointment.findById(appointment._id)
      .populate('patientId', 'userId bloodGroup height weight emergencyContact medicalHistory currentMedications')
      .populate('patientId.userId', 'firstName lastName email phone dateOfBirth')
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email phone');

    res.json({
      success: true,
      message: 'Appointment status updated successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Update appointment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating appointment status'
    });
  }
});

// Delete appointment
router.delete('/:id', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Verify the appointment belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (appointment.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Appointment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Appointment deleted successfully'
    });
  } catch (error) {
    console.error('Delete appointment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting appointment'
    });
  }
});

module.exports = router;
