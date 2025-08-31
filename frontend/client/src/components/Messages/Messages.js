import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Messages.css';

const Messages = ({ user, onClose }) => {
  const [activeTab, setActiveTab] = useState('inbox');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({
    receiverId: '',
    subject: '',
    message: '',
    messageType: 'general',
    priority: 'normal'
  });
  const [recipients, setRecipients] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMessages();
    loadRecipients();
  }, [activeTab]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'inbox' ? '/inbox' : '/sent';
      const response = await axios.get(`/api/messages${endpoint}`);
      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipients = async () => {
    try {
      if (user.userType === 'patient') {
        // Patients can message doctors
        const response = await axios.get('/api/doctors');
        if (response.data.success) {
          setRecipients(response.data.doctors.map(doctor => ({
            id: doctor.userId._id,
            name: `Dr. ${doctor.userId.firstName} ${doctor.userId.lastName}`,
            specialization: doctor.specialization
          })));
        }
      } else if (user.userType === 'doctor') {
        // Doctors can message patients
        const response = await axios.get('/api/patients');
        if (response.data.success) {
          setRecipients(response.data.patients.map(patient => ({
            id: patient.userId._id,
            name: `${patient.userId.firstName} ${patient.userId.lastName}`,
            specialization: 'Patient'
          })));
        }
      }
    } catch (error) {
      console.error('Error loading recipients:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/messages', composeForm);
      if (response.data.success) {
        setShowCompose(false);
        setComposeForm({
          receiverId: '',
          subject: '',
          message: '',
          messageType: 'general',
          priority: 'normal'
        });
        loadMessages();
        alert('Message sent successfully!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const markAsRead = async (messageId) => {
    try {
      await axios.patch(`/api/messages/${messageId}/read`);
      loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await axios.delete(`/api/messages/${messageId}`);
        loadMessages();
        alert('Message deleted successfully');
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f97316';
      case 'normal': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'prescription': return '💊';
      case 'emergency': return '🚨';
      default: return '💬';
    }
  };

  if (loading) {
    return (
      <div className="messages-container">
        <div className="messages-loading">
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="messages-container">
      <div className="messages-content">
        <div className="messages-header">
          <h2>Messages</h2>
          <div className="header-actions">
            <button 
              className="compose-btn"
              onClick={() => setShowCompose(true)}
            >
              Compose
            </button>
            <button className="close-btn" onClick={onClose}>×</button>
          </div>
        </div>

        <div className="messages-body">
          <div className="messages-sidebar">
            <div className="messages-tabs">
              <button 
                className={`tab ${activeTab === 'inbox' ? 'active' : ''}`}
                onClick={() => setActiveTab('inbox')}
                data-tab="inbox"
              >
                Inbox ({messages.filter(m => !m.read).length})
              </button>
              <button 
                className={`tab ${activeTab === 'sent' ? 'active' : ''}`}
                onClick={() => setActiveTab('sent')}
                data-tab="sent"
              >
                Sent
              </button>
            </div>

            <div className="messages-list">
              {messages.length === 0 ? (
                <div className="empty-messages">
                  <p>No {activeTab} messages</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div 
                    key={message._id} 
                    className={`message-item ${!message.read && activeTab === 'inbox' ? 'unread' : ''}`}
                    onClick={() => !message.read && activeTab === 'inbox' && markAsRead(message._id)}
                  >
                    <div className="message-header">
                      <div className="message-info">
                        <span className="message-type">
                          {getMessageTypeIcon(message.messageType)}
                        </span>
                        <span className="message-sender">
                          {activeTab === 'inbox' 
                            ? `${message.senderId?.firstName} ${message.senderId?.lastName}`
                            : `To: ${message.receiverId?.firstName} ${message.receiverId?.lastName}`
                          }
                        </span>
                        <span className="message-subject">{message.subject}</span>
                      </div>
                      <div className="message-meta">
                        <span 
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(message.priority) }}
                        >
                          {message.priority}
                        </span>
                        <span className="message-time">{formatDate(message.createdAt)}</span>
                        {activeTab === 'sent' && (
                          <button 
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteMessage(message._id);
                            }}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="message-body">
                      <p>{message.message}</p>
                    </div>
                    {!message.read && activeTab === 'inbox' && (
                      <div className="unread-indicator">
                        <span className="unread-dot"></span>
                        <span>Click to mark as read</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="messages-main">
            <div className="messages-main-header">
              <h3>{activeTab === 'inbox' ? 'Inbox Messages' : 'Sent Messages'}</h3>
            </div>
            <div className="messages-main-content">
              <p>
                {messages.length === 0 
                  ? `No ${activeTab} messages found` 
                  : `Select a message from the ${activeTab} to view details`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Compose Message Modal */}
      {showCompose && (
        <div className="compose-modal">
          <div className="compose-content">
            <div className="compose-header">
              <h3>Compose Message</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowCompose(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSendMessage} className="compose-form">
              <div className="form-group">
                <label>To *</label>
                <select 
                  value={composeForm.receiverId}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, receiverId: e.target.value }))}
                  required
                >
                  <option value="">Select recipient</option>
                  {recipients.map(recipient => (
                    <option key={recipient.id} value={recipient.id}>
                      {recipient.name} - {recipient.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input 
                  type="text" 
                  value={composeForm.subject}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject..."
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Type</label>
                  <select 
                    value={composeForm.messageType}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, messageType: e.target.value }))}
                  >
                    <option value="general">General</option>
                    <option value="appointment">Appointment</option>
                    <option value="prescription">Prescription</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select 
                    value={composeForm.priority}
                    onChange={(e) => setComposeForm(prev => ({ ...prev, priority: e.target.value }))}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea 
                  value={composeForm.message}
                  onChange={(e) => setComposeForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your message here..."
                  rows="5"
                  required
                />
              </div>
              
              <div className="compose-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setShowCompose(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-btn">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;
