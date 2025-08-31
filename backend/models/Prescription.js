const mongoose = require('mongoose');

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  prescriptionDate: {
    type: Date,
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  medications: [{
    medicine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true
    },
    duration: {
      type: String,
      required: true,
      trim: true
    },
    instructions: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    }
  }],
  instructions: {
    type: String,
    trim: true
  },
  followUpDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  isDigital: {
    type: Boolean,
    default: true
  },
  prescriptionNumber: {
    type: String,
    unique: true
  }
}, {
  timestamps: true
});

// Generate prescription number before saving
prescriptionSchema.pre('save', async function(next) {
  if (!this.prescriptionNumber) {
    const count = await this.constructor.countDocuments();
    this.prescriptionNumber = `PRES-${Date.now()}-${count + 1}`;
  }
  next();
});

// Virtual for total medications
prescriptionSchema.virtual('totalMedications').get(function() {
  return this.medications.length;
});

// Virtual for formatted date
prescriptionSchema.virtual('formattedDate').get(function() {
  return this.prescriptionDate.toLocaleDateString();
});

// Ensure virtual fields are serialized
prescriptionSchema.set('toJSON', { virtuals: true });
prescriptionSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Prescription', prescriptionSchema);
