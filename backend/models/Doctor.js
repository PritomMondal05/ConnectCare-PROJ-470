const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  specialization: {
    type: String,
    required: true,
    trim: true
  },
  licenseNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  experience: {
    type: Number,
    min: 0,
    default: 0
  },
  education: [{
    degree: String,
    institution: String,
    year: Number
  }],
  certifications: [{
    name: String,
    issuingAuthority: String,
    year: Number
  }],
  languages: [{
    type: String,
    trim: true
  }],
  consultationFee: {
    type: Number,
    min: 0,
    default: 0
  },
  availability: {
    monday: { start: String, end: String, available: { type: Boolean, default: false } },
    tuesday: { start: String, end: String, available: { type: Boolean, default: false } },
    wednesday: { start: String, end: String, available: { type: Boolean, default: false } },
    thursday: { start: String, end: String, available: { type: Boolean, default: false } },
    friday: { start: String, end: String, available: { type: Boolean, default: false } },
    saturday: { start: String, end: String, available: { type: Boolean, default: false } },
    sunday: { start: String, end: String, available: { type: Boolean, default: false } }
  },
  bio: {
    type: String,
    maxlength: 1000
  },
  rating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Virtual for full name
doctorSchema.virtual('fullName').get(function() {
  return `${this.userId.firstName} ${this.userId.lastName}`;
});

// Ensure virtual fields are serialized
doctorSchema.set('toJSON', { virtuals: true });
doctorSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Doctor', doctorSchema);
