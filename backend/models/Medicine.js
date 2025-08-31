const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    enum: ['antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc', 'other']
  },
  description: {
    type: String,
    maxlength: 1000
  },
  dosageForm: {
    type: String,
    enum: ['tablet', 'capsule', 'liquid', 'injection', 'cream', 'ointment', 'drops', 'inhaler', 'other']
  },
  strength: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  stockQuantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  sideEffects: [{
    type: String,
    trim: true
  }],
  contraindications: [{
    type: String,
    trim: true
  }],
  manufacturer: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  },
  image: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for search functionality
medicineSchema.index({ name: 'text', genericName: 'text', brand: 'text', category: 'text' });

// Virtual for availability status
medicineSchema.virtual('isAvailable').get(function() {
  return this.stockQuantity > 0;
});

// Virtual for price with currency
medicineSchema.virtual('formattedPrice').get(function() {
  return `$${this.price.toFixed(2)}`;
});

// Ensure virtual fields are serialized
medicineSchema.set('toJSON', { virtuals: true });
medicineSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Medicine', medicineSchema);
