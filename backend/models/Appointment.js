const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
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
  appointmentDate: {
    type: Date,
    required: true
  },
  appointmentTime: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    default: 30, // minutes
    min: 15,
    max: 120
  },
  type: {
    type: String,
    enum: ['consultation', 'follow-up', 'emergency', 'routine', 'specialist'],
    default: 'consultation'
  },
  status: {
    type: String,
    enum: ['scheduled', 'confirmed', 'in-progress', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  reason: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 1000
  },
  isVirtual: {
    type: Boolean,
    default: false
  },
  meetingLink: {
    type: String
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  reminderDate: {
    type: Date
  },
  cancellationReason: {
    type: String,
    trim: true
  },
  cancelledBy: {
    type: String,
    enum: ['patient', 'doctor', 'admin']
  },
  cancellationDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Index for efficient querying
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, appointmentTime: 1 });
appointmentSchema.index({ patientId: 1, appointmentDate: 1 });

// Virtual for appointment datetime
appointmentSchema.virtual('appointmentDateTime').get(function() {
  const date = new Date(this.appointmentDate);
  const [hours, minutes] = this.appointmentTime.split(':');
  date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  return date;
});

// Virtual for end time
appointmentSchema.virtual('endTime').get(function() {
  const [hours, minutes] = this.appointmentTime.split(':');
  const endMinutes = parseInt(minutes) + this.duration;
  const endHours = parseInt(hours) + Math.floor(endMinutes / 60);
  const finalMinutes = endMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${finalMinutes.toString().padStart(2, '0')}`;
});

// Virtual for formatted date
appointmentSchema.virtual('formattedDate').get(function() {
  return this.appointmentDate.toLocaleDateString();
});

// Ensure virtual fields are serialized
appointmentSchema.set('toJSON', { virtuals: true });
appointmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
