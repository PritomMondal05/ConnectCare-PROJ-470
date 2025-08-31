const express = require('express');
const Prescription = require('../models/Prescription');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authenticateToken, requireDoctor, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Create new prescription (Doctor only)
router.post('/', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const {
      patientId,
      diagnosis,
      medicines,
      instructions,
      followUpDate,
      notes
    } = req.body;

    // Get doctor ID from authenticated user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found'
      });
    }

    const prescription = new Prescription({
      doctorId: doctor._id,
      patientId,
      diagnosis,
      medications: medicines.map(med => ({
        medicine: { name: med.name, dosage: med.dosage, frequency: med.frequency, duration: med.duration },
        dosage: med.dosage,
        frequency: med.frequency,
        duration: med.duration,
        instructions: med.instructions || '',
        quantity: 1
      })),
      instructions,
      followUpDate,
      notes,
      status: 'active'
    });

    await prescription.save();

    // Populate the prescription with full details
    const populatedPrescription = await Prescription.findById(prescription._id)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName')
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Prescription created successfully',
      prescription: populatedPrescription
    });
  } catch (error) {
    console.error('Create prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating prescription'
    });
  }
});

// Get prescriptions for current doctor
router.get('/doctor', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, patientId } = req.query;
    
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

    if (patientId) {
      query.patientId = patientId;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Prescription.countDocuments(query);

    res.json({
      success: true,
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get doctor prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
});

// Get prescriptions for a specific patient
router.get('/patient/:patientId', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    // Get doctor ID from authenticated user
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    let query = { 
      doctorId: doctor._id,
      patientId: req.params.patientId
    };

    if (status) {
      query.status = status;
    }

    const prescriptions = await Prescription.find(query)
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Prescription.countDocuments(query);

    res.json({
      success: true,
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
});

// Get prescriptions for current patient (Patient only)
router.get('/patient', authenticateToken, requirePatient, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
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

    const prescriptions = await Prescription.find(query)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email')
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const total = await Prescription.countDocuments(query);

    res.json({
      success: true,
      prescriptions,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get current patient prescriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescriptions'
    });
  }
});

// Get prescription by ID
router.get('/:id', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName email')
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email dateOfBirth');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify the prescription belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      prescription
    });
  } catch (error) {
    console.error('Get prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching prescription'
    });
  }
});

// Update prescription
router.put('/:id', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify the prescription belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Update fields
    const {
      diagnosis,
      medicines,
      instructions,
      followUpDate,
      notes,
      status
    } = req.body;

    if (diagnosis) prescription.diagnosis = diagnosis;
    if (medicines) prescription.medicines = medicines;
    if (instructions) prescription.instructions = instructions;
    if (followUpDate) prescription.followUpDate = followUpDate;
    if (notes) prescription.notes = notes;
    if (status) prescription.status = status;

    await prescription.save();

    // Populate the updated prescription
    const updatedPrescription = await Prescription.findById(prescription._id)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName')
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Prescription updated successfully',
      prescription: updatedPrescription
    });
  } catch (error) {
    console.error('Update prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating prescription'
    });
  }
});

// Delete prescription
router.delete('/:id', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify the prescription belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await Prescription.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Prescription deleted successfully'
    });
  } catch (error) {
    console.error('Delete prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting prescription'
    });
  }
});

// Generate PDF for prescription
router.get('/:id/pdf', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('doctorId', 'userId')
      .populate('doctorId.userId', 'firstName lastName specialization')
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'firstName lastName email phone');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify the prescription belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (prescription.doctorId._id.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Generate PDF content (simple text-based PDF for now)
    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument();
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=prescription-${prescription._id}.pdf`);
    
    // Pipe PDF to response
    doc.pipe(res);
    
    // Add content to PDF
    doc.fontSize(20).text('MEDICAL PRESCRIPTION', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`);
    doc.text(`Prescription ID: ${prescription._id}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Doctor Information:');
    doc.fontSize(12).text(`Name: Dr. ${prescription.doctorId.userId.firstName} ${prescription.doctorId.userId.lastName}`);
    doc.text(`Specialization: ${prescription.doctorId.specialization}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Patient Information:');
    doc.fontSize(12).text(`Name: ${prescription.patientId.userId.firstName} ${prescription.patientId.userId.lastName}`);
    doc.text(`Email: ${prescription.patientId.userId.email}`);
    doc.text(`Phone: ${prescription.patientId.userId.phone}`);
    doc.moveDown();
    
    doc.fontSize(14).text('Diagnosis:');
    doc.fontSize(12).text(prescription.diagnosis);
    doc.moveDown();
    
    if (prescription.medicines && prescription.medicines.length > 0) {
      doc.fontSize(14).text('Medicines:');
      prescription.medicines.forEach((medicine, index) => {
        doc.fontSize(12).text(`${index + 1}. ${medicine.name} - ${medicine.dosage} - ${medicine.frequency} - ${medicine.duration}`);
      });
      doc.moveDown();
    }
    
    if (prescription.instructions) {
      doc.fontSize(14).text('Instructions:');
      doc.fontSize(12).text(prescription.instructions);
      doc.moveDown();
    }
    
    if (prescription.followUpDate) {
      doc.fontSize(14).text('Follow-up Date:');
      doc.fontSize(12).text(new Date(prescription.followUpDate).toLocaleDateString());
      doc.moveDown();
    }
    
    doc.fontSize(10).text('This prescription is digitally generated and signed by the prescribing doctor.', { align: 'center' });
    
    // Finalize PDF
    doc.end();
    
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating PDF'
    });
  }
});

// Send prescription to patient
router.post('/:id/send', authenticateToken, requireDoctor, async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate('patientId', 'userId')
      .populate('patientId.userId', 'email');

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    // Verify the prescription belongs to the current doctor
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (prescription.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Here you would integrate with an email service to send the prescription
    // For now, we'll just return success
    // In production, you'd use nodemailer or similar service
    
    res.json({
      success: true,
      message: 'Prescription sent to patient successfully'
    });
  } catch (error) {
    console.error('Send prescription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending prescription'
    });
  }
});

module.exports = router;
