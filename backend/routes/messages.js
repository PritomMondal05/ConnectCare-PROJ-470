const express = require('express');
const Message = require('../models/Message');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const { authenticateToken, requireDoctor, requirePatient } = require('../middleware/auth');

const router = express.Router();

// Send a message (authenticated users only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { receiverId, subject, message, messageType = 'general', priority = 'normal' } = req.body;

    // Validate receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver not found'
      });
    }

    // Create new message
    const newMessage = new Message({
      senderId: req.user._id,
      receiverId,
      subject,
      message,
      messageType,
      priority
    });

    await newMessage.save();

    // Populate the message with sender and receiver details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('senderId', 'firstName lastName email')
      .populate('receiverId', 'firstName lastName email');

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: populatedMessage
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while sending message'
    });
  }
});

// Get messages for current user (inbox)
router.get('/inbox', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    
    let query = { receiverId: req.user._id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const messages = await Message.find(query)
      .populate('senderId', 'firstName lastName email role')
      .populate('receiverId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({ receiverId: req.user._id, read: false });

    res.json({
      success: true,
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      unreadCount
    });
  } catch (error) {
    console.error('Get inbox error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching messages'
    });
  }
});

// Get sent messages for current user
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const messages = await Message.find({ senderId: req.user._id })
      .populate('senderId', 'firstName lastName email role')
      .populate('receiverId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({ senderId: req.user._id });

    res.json({
      success: true,
      messages,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get sent messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sent messages'
    });
  }
});

// Get messages between current user and another user
router.get('/conversation/:userId', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const otherUserId = req.params.userId;

    // Validate other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const messages = await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id }
      ]
    })
      .populate('senderId', 'firstName lastName email role')
      .populate('receiverId', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Message.countDocuments({
      $or: [
        { senderId: req.user._id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user._id }
      ]
    });

    res.json({
      success: true,
      messages: messages.reverse(), // Show oldest first for conversation view
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching conversation'
    });
  }
});

// Mark message as read
router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Ensure user is the receiver
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only mark messages sent to you as read'
      });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking message as read'
    });
  }
});

// Mark all messages as read
router.patch('/read-all', authenticateToken, async (req, res) => {
  try {
    await Message.updateMany(
      { receiverId: req.user._id, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      success: true,
      message: 'All messages marked as read'
    });
  } catch (error) {
    console.error('Mark all messages as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while marking messages as read'
    });
  }
});

// Delete message (only sender can delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Ensure user is the sender
    if (message.senderId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete messages you sent'
      });
    }

    await Message.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting message'
    });
  }
});

// Get unread message count
router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const count = await Message.countDocuments({ 
      receiverId: req.user._id, 
      read: false 
    });

    res.json({
      success: true,
      unreadCount: count
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching unread count'
    });
  }
});

module.exports = router;
