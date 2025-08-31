const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Medicine = require('../models/Medicine');

const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await Medicine.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminUser = new User({
      email: 'admin@connectcare.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin',
      phone: '+1234567890'
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create sample doctors
    const doctors = [
      {
        email: 'dr.sarah@connectcare.com',
        password: 'doctor123',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: 'doctor',
        phone: '+1234567891',
        specialization: 'Cardiology',
        licenseNumber: 'LIC-001',
        experience: 15,
        bio: 'Experienced cardiologist with expertise in interventional cardiology and heart failure management.',
        consultationFee: 150,
        languages: ['English', 'Spanish'],
        availability: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '13:00', available: true },
          sunday: { start: '00:00', end: '00:00', available: false }
        }
      },
      {
        email: 'dr.michael@connectcare.com',
        password: 'doctor123',
        firstName: 'Michael',
        lastName: 'Chen',
        role: 'doctor',
        phone: '+1234567892',
        specialization: 'Family Medicine',
        licenseNumber: 'LIC-002',
        experience: 8,
        bio: 'Family physician dedicated to providing comprehensive care for patients of all ages.',
        consultationFee: 100,
        languages: ['English', 'Mandarin'],
        availability: {
          monday: { start: '08:00', end: '16:00', available: true },
          tuesday: { start: '08:00', end: '16:00', available: true },
          wednesday: { start: '08:00', end: '16:00', available: true },
          thursday: { start: '08:00', end: '16:00', available: true },
          friday: { start: '08:00', end: '16:00', available: true },
          saturday: { start: '00:00', end: '00:00', available: false },
          sunday: { start: '00:00', end: '00:00', available: false }
        }
      },
      {
        email: 'dr.emma@connectcare.com',
        password: 'doctor123',
        firstName: 'Emma',
        lastName: 'Wilson',
        role: 'doctor',
        phone: '+1234567893',
        specialization: 'Pediatrics',
        licenseNumber: 'LIC-003',
        experience: 12,
        bio: 'Pediatrician specializing in child development and preventive care.',
        consultationFee: 120,
        languages: ['English', 'French'],
        availability: {
          monday: { start: '09:00', end: '18:00', available: true },
          tuesday: { start: '09:00', end: '18:00', available: true },
          wednesday: { start: '09:00', end: '18:00', available: true },
          thursday: { start: '09:00', end: '18:00', available: true },
          friday: { start: '09:00', end: '18:00', available: true },
          saturday: { start: '09:00', end: '14:00', available: true },
          sunday: { start: '00:00', end: '00:00', available: false }
        }
      }
    ];

    for (const doctorData of doctors) {
      const user = new User({
        email: doctorData.email,
        password: doctorData.password,
        firstName: doctorData.firstName,
        lastName: doctorData.lastName,
        role: doctorData.role,
        phone: doctorData.phone
      });
      await user.save();

      const doctor = new Doctor({
        userId: user._id,
        specialization: doctorData.specialization,
        licenseNumber: doctorData.licenseNumber,
        experience: doctorData.experience,
        bio: doctorData.bio,
        consultationFee: doctorData.consultationFee,
        languages: doctorData.languages,
        availability: doctorData.availability,
        isVerified: true
      });
      await doctor.save();
    }
    console.log('Created sample doctors');

    // Create sample patients
    const patients = [
      {
        email: 'john.doe@email.com',
        password: 'patient123',
        firstName: 'John',
        lastName: 'Doe',
        role: 'patient',
        phone: '+1234567894',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        bloodGroup: 'A+',
        height: 175,
        weight: 70
      },
      {
        email: 'jane.smith@email.com',
        password: 'patient123',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'patient',
        phone: '+1234567895',
        dateOfBirth: '1990-07-22',
        gender: 'female',
        bloodGroup: 'O+',
        height: 165,
        weight: 55
      },
      {
        email: 'robert.brown@email.com',
        password: 'patient123',
        firstName: 'Robert',
        lastName: 'Brown',
        role: 'patient',
        phone: '+1234567896',
        dateOfBirth: '1978-11-08',
        gender: 'male',
        bloodGroup: 'B+',
        height: 180,
        weight: 80
      }
    ];

    for (const patientData of patients) {
      const user = new User({
        email: patientData.email,
        password: patientData.password,
        firstName: patientData.firstName,
        lastName: patientData.lastName,
        role: patientData.role,
        phone: patientData.phone,
        dateOfBirth: patientData.dateOfBirth,
        gender: patientData.gender
      });
      await user.save();

      const patient = new Patient({
        userId: user._id,
        bloodGroup: patientData.bloodGroup,
        height: patientData.height,
        weight: patientData.weight
      });
      await patient.save();
    }
    console.log('Created sample patients');

    // Create sample medicines
    const medicines = [
      {
        name: 'Paracetamol',
        genericName: 'Acetaminophen',
        brand: 'Tylenol',
        category: 'painkiller',
        description: 'Used to treat pain and fever. It is commonly used for the relief of headaches and other minor aches and pains.',
        dosageForm: 'tablet',
        strength: '500mg',
        price: 5.99,
        stockQuantity: 100,
        prescriptionRequired: false,
        sideEffects: ['Nausea', 'Stomach upset'],
        contraindications: ['Liver disease', 'Alcohol abuse'],
        manufacturer: 'Johnson & Johnson',
        tags: ['fever', 'pain', 'headache']
      },
      {
        name: 'Ibuprofen',
        genericName: 'Ibuprofen',
        brand: 'Advil',
        category: 'painkiller',
        description: 'Nonsteroidal anti-inflammatory drug used to treat pain, fever, and inflammation.',
        dosageForm: 'tablet',
        strength: '400mg',
        price: 7.99,
        stockQuantity: 75,
        prescriptionRequired: false,
        sideEffects: ['Stomach upset', 'Dizziness'],
        contraindications: ['Stomach ulcers', 'Kidney disease'],
        manufacturer: 'Pfizer',
        tags: ['inflammation', 'pain', 'fever']
      },
      {
        name: 'Amoxicillin',
        genericName: 'Amoxicillin',
        brand: 'Amoxil',
        category: 'antibiotic',
        description: 'Penicillin antibiotic that fights bacteria in the body. Used to treat many different types of infection.',
        dosageForm: 'capsule',
        strength: '500mg',
        price: 15.99,
        stockQuantity: 50,
        prescriptionRequired: true,
        sideEffects: ['Diarrhea', 'Nausea', 'Rash'],
        contraindications: ['Penicillin allergy'],
        manufacturer: 'GlaxoSmithKline',
        tags: ['infection', 'bacteria', 'antibiotic']
      },
      {
        name: 'Vitamin D3',
        genericName: 'Cholecalciferol',
        brand: 'Nature Made',
        category: 'vitamin',
        description: 'Vitamin D supplement that helps the body absorb calcium and maintain bone health.',
        dosageForm: 'tablet',
        strength: '1000 IU',
        price: 12.99,
        stockQuantity: 200,
        prescriptionRequired: false,
        sideEffects: ['Nausea', 'Constipation'],
        contraindications: ['High calcium levels'],
        manufacturer: 'Nature Made',
        tags: ['vitamin', 'bone health', 'calcium']
      },
      {
        name: 'Omeprazole',
        genericName: 'Omeprazole',
        brand: 'Prilosec',
        category: 'prescription',
        description: 'Proton pump inhibitor that decreases stomach acid production. Used to treat acid reflux and ulcers.',
        dosageForm: 'capsule',
        strength: '20mg',
        price: 25.99,
        stockQuantity: 60,
        prescriptionRequired: true,
        sideEffects: ['Headache', 'Diarrhea', 'Stomach pain'],
        contraindications: ['Liver disease'],
        manufacturer: 'AstraZeneca',
        tags: ['acid reflux', 'ulcer', 'stomach']
      }
    ];

    for (const medicineData of medicines) {
      const medicine = new Medicine(medicineData);
      await medicine.save();
    }
    console.log('Created sample medicines');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
