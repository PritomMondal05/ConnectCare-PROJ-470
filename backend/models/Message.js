const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  },
  messageType: {
    type: String,
    enum: ['general', 'appointment', 'prescription', 'emergency'],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ senderId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, createdAt: -1 });
messageSchema.index({ receiverId: 1, read: 1 });

// Virtual for sender name
messageSchema.virtual('senderName').get(function() {
  return this.senderId ? `${this.senderId.firstName} ${this.senderId.lastName}` : '';
});

// Virtual for receiver name
messageSchema.virtual('receiverName').get(function() {
  return this.receiverId ? `${this.receiverId.firstName} ${this.receiverId.lastName}` : '';
});

module.exports = mongoose.model('Message', messageSchema);
