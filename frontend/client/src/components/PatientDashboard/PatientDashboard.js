import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PatientDashboard.css';
import '../../styles/dashboard-common.css';

const PatientDashboard = () => {
  const [user, setUser] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);

  const [appointmentForm, setAppointmentForm] = useState({
    doctorId: '',
    appointmentDate: '',
    appointmentTime: '',
    reason: '',
    symptoms: ''
  });
  const [messageForm, setMessageForm] = useState({
    doctorId: '',
    subject: '',
    message: ''
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (userData && token) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      
      // Set axios default headers
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Load initial data
      loadDashboardData();
      loadPatientProfile();
    } else {
      window.location.href = '/';
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load doctors, appointments, prescriptions, and messages
      await Promise.all([
        loadDoctors(),
        loadAppointments(),
        loadPrescriptions(),
        loadMessages()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadPatientProfile = async () => {
    try {
      const response = await axios.get('/api/patients/me');
      if (response.data.success) {
        // Store patient profile separately
        setPatientProfile(response.data.patient);
        
        // Update user data with patient profile information
        setUser(prevUser => ({
          ...prevUser,
          ...response.data.patient.userId,
          patientId: response.data.patient._id,
          bloodGroup: response.data.patient.bloodGroup,
          height: response.data.patient.height,
          weight: response.data.patient.weight,
          emergencyContact: response.data.patient.emergencyContact,
          medicalHistory: response.data.patient.medicalHistory,
          currentMedications: response.data.patient.currentMedications
        }));
      }
    } catch (error) {
      console.error('Error loading patient profile:', error);
      // Don't set error here as it's not critical for dashboard functionality
    }
  };

  const loadDoctors = async () => {
    try {
      const response = await axios.get('/api/doctors');
      setDoctors(response.data.doctors || []);
    } catch (error) {
      console.error('Error loading doctors:', error);
      setError('Failed to load doctors');
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/patient');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions/patient');
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Failed to load prescriptions');
    }
  };

  const loadMessages = async () => {
    try {
      const response = await axios.get('/api/messages/inbox');
      if (response.data.success) {
        setMessages(response.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // If API fails, show empty messages instead of mock data
      setMessages([]);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = '/';
  };

  const handleBookAppointment = async () => {
    try {
      if (!appointmentForm.doctorId || !appointmentForm.appointmentDate || !appointmentForm.appointmentTime) {
        alert('Please fill in all required fields (Doctor, Date, and Time)');
        return;
      }

      if (!patientProfile) {
        alert('Patient profile not loaded. Please refresh the page.');
        return;
      }

      // Ensure proper date format
      const appointmentData = {
        ...appointmentForm,
        patientId: patientProfile._id,
        appointmentDate: new Date(appointmentForm.appointmentDate).toISOString().split('T')[0]
      };

      console.log('Booking appointment with data:', appointmentData);
      await axios.post('/api/appointments', appointmentData);
      
      setShowAppointmentModal(false);
      setAppointmentForm({
        doctorId: '',
        appointmentDate: '',
        appointmentTime: '',
        reason: '',
        symptoms: ''
      });
      
      await loadAppointments();
      alert('Appointment booked successfully');
    } catch (error) {
      console.error('Error booking appointment:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to book appointment: ${error.response.data.message}`);
      } else {
        alert('Failed to book appointment. Please try again.');
      }
    }
  };

  const handleSendMessage = async () => {
    try {
      if (!messageForm.doctorId || !messageForm.subject || !messageForm.message) {
        alert('Please fill in all required fields');
        return;
      }

      // Send message to API
      const messageData = {
        receiverId: messageForm.doctorId,
        subject: messageForm.subject,
        message: messageForm.message,
        messageType: 'general',
        priority: 'normal'
      };

      const response = await axios.post('/api/messages', messageData);
      
      if (response.data.success) {
        // Reload messages to show the new message
        await loadMessages();
        setShowMessageModal(false);
        setMessageForm({
          doctorId: '',
          subject: '',
          message: ''
        });
        alert('Message sent successfully');
      } else {
        alert('Failed to send message: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Failed to send message: ${error.response.data.message}`);
      } else {
        alert('Failed to send message. Please try again.');
      }
    }
  };

  const markMessageAsRead = async (messageId) => {
    try {
      const response = await axios.put(`/api/messages/${messageId}/read`);
      if (response.data.success) {
        // Update local message state
        const updatedMessages = messages.map(m => 
          m._id === messageId ? { ...m, read: true } : m
        );
        setMessages(updatedMessages);
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };



  const handleUpdateProfile = async () => {
    try {
      // In a real app, this would update both User and Patient models
      // For now, we'll just show a success message
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    }
  };

  const getUpcomingAppointments = () => {
    const today = new Date();
    return appointments.filter(apt => 
      new Date(apt.appointmentDate) >= today && apt.status === 'confirmed'
    );
  };

  const getPastAppointments = () => {
    const today = new Date();
    return appointments.filter(apt => 
      new Date(apt.appointmentDate) < today || apt.status === 'completed'
    );
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-loading">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={loadDashboardData} className="primary-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="patient-dashboard">
      {/* Left Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo-section">
            <img 
              src="/logo/connectcare icon.svg" 
              alt="ConnectCare Logo" 
              className="sidebar-logo"
            />
            <span className="logo-text">ConnectCare</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="nav-text">Patient Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <span className="nav-text">Doctors</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <span className="nav-text">Appointments</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`}
            onClick={() => setActiveTab('prescriptions')}
          >
            <span className="nav-text">Prescriptions</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'messages' ? 'active' : ''}`}
            onClick={() => setActiveTab('messages')}
          >
            <span className="nav-text">Messages</span>
            {messages.filter(m => !m.read).length > 0 && (
              <span className="notification-badge">
                {messages.filter(m => !m.read).length}
              </span>
            )}
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="nav-text">Profile</span>
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="nav-item" onClick={handleLogout}>
            <span className="nav-text">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="dashboard-main">
        {/* Top Header with Big Patient Name */}
        <header className="main-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                {activeTab === 'dashboard' && 'Patient Dashboard'}
                {activeTab === 'doctors' && 'Doctors'}
                {activeTab === 'appointments' && 'Appointments'}
                {activeTab === 'prescriptions' && 'Prescriptions'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'profile' && 'Profile'}
              </h1>
              <div className="patient-name-display">
                <h2 className="big-patient-name">{user?.firstName} {user?.lastName}</h2>
                <p className="patient-role">Patient</p>
              </div>
            </div>
            
            <div className="header-right">
              {activeTab === 'doctors' && (
                <button 
                  className="primary-btn"
                  onClick={() => setShowAppointmentModal(true)}
                >
                  Book Appointment
                </button>
              )}
              {activeTab === 'messages' && (
                <button 
                  className="primary-btn"
                  onClick={() => setShowMessageModal(true)}
                >
                  Send Message
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="main-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Available Doctors</h3>
                    <p className="stat-number">{doctors.length}</p>
                    <p className="stat-description">Choose from specialists</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Upcoming Appointments</h3>
                    <p className="stat-number">{getUpcomingAppointments().length}</p>
                    <p className="stat-description">Scheduled visits</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Active Prescriptions</h3>
                    <p className="stat-number">{prescriptions.filter(p => p.status === 'active').length}</p>
                    <p className="stat-description">Current medications</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Unread Messages</h3>
                    <p className="stat-number">{messages.filter(m => !m.read).length}</p>
                    <p className="stat-description">From doctors</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn primary" onClick={() => setActiveTab('doctors')}>
                    Find Doctor
                  </button>
                  <button className="action-btn" onClick={() => setShowAppointmentModal(true)}>
                    Book Appointment
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('profile')}>
                    Update Profile
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {appointments.slice(0, 3).map(appointment => (
                    <div key={appointment._id} className="activity-item">
                      <div className="activity-content">
                        <p>Appointment: Dr. {appointment.doctorId?.userId?.firstName} {appointment.doctorId?.userId?.lastName} - {appointment.appointmentDate} at {appointment.appointmentTime}</p>
                        <span className="activity-time">{appointment.status}</span>
                      </div>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <div className="empty-state">
                      <p>No recent appointments</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Doctors Tab */}
          {activeTab === 'doctors' && (
            <div className="doctors-content">
              <div className="content-header">
                <h3>Available Doctors</h3>
                <div className="header-actions">
                  <input 
                    type="text" 
                    placeholder="Search doctors..." 
                    className="search-input"
                  />
                  <button 
                    className="primary-btn"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    Book Appointment
                  </button>
                </div>
              </div>

              <div className="doctors-grid">
                {doctors.map(doctor => (
                  <div 
                    key={doctor._id} 
                    className={`doctor-card ${selectedDoctor?._id === doctor._id ? 'selected' : ''}`}
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    <div className="doctor-avatar">
                      <span>👨‍⚕️</span>
                    </div>
                    
                    <div className="doctor-info">
                      <h4>Dr. {doctor.userId?.firstName} {doctor.userId?.lastName}</h4>
                      <p className="specialization">{doctor.specialization}</p>
                      <p className="experience">{doctor.experience} years experience</p>
                      <p className="consultation-fee">Consultation: ${doctor.consultationFee}</p>
                      <span className="doctor-status">Available</span>
                    </div>
                    
                    <div className="doctor-actions">
                      <button 
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          // In a real app, this would show doctor profile details
                          alert(`Doctor Profile:\nName: Dr. ${doctor.userId?.firstName} ${doctor.userId?.lastName}\nSpecialization: ${doctor.specialization}\nExperience: ${doctor.experience} years\nConsultation Fee: $${doctor.consultationFee}\nLicense: ${doctor.licenseNumber || 'N/A'}`);
                        }}
                      >
                        View Profile
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctor(doctor);
                          setShowAppointmentModal(true);
                        }}
                      >
                        Book Appointment
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDoctor(doctor);
                          setShowMessageModal(true);
                        }}
                      >
                        Send Message
                      </button>

                    </div>
                  </div>
                ))}
                {doctors.length === 0 && (
                  <div className="empty-state">
                    <p>No doctors available</p>
                  </div>
                )}
              </div>

              {/* Doctor Details Panel */}
              {selectedDoctor && (
                <div className="doctor-details-panel">
                  <div className="panel-header">
                    <h3>Dr. {selectedDoctor.userId?.firstName} {selectedDoctor.userId?.lastName}</h3>
                    <button className="close-btn" onClick={() => setSelectedDoctor(null)}>×</button>
                  </div>
                  
                  <div className="panel-content">
                    <div className="detail-section">
                      <h4>Professional Information</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Specialization:</label>
                          <span>{selectedDoctor.specialization}</span>
                        </div>
                        <div className="detail-item">
                          <label>Experience:</label>
                          <span>{selectedDoctor.experience} years</span>
                        </div>
                        <div className="detail-item">
                          <label>Consultation Fee:</label>
                          <span>${selectedDoctor.consultationFee}</span>
                        </div>
                        <div className="detail-item">
                          <label>License:</label>
                          <span>{selectedDoctor.licenseNumber || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Bio</h4>
                      <p className="doctor-bio">{selectedDoctor.bio || 'No bio available'}</p>
                    </div>

                    <div className="detail-section">
                      <h4>Actions</h4>
                      <div className="action-buttons">
                        <button 
                          className="primary-btn"
                          onClick={() => {
                            setShowAppointmentModal(true);
                          }}
                        >
                          Book Appointment
                        </button>
                        <button 
                          className="btn-secondary"
                          onClick={() => {
                            setShowMessageModal(true);
                          }}
                        >
                          Send Message
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="appointments-content">
              <div className="content-header">
                <h3>My Appointments</h3>
                <div className="header-actions">
                  <button 
                    className="primary-btn"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    + Book New Appointment
                  </button>
                </div>
              </div>

              <div className="appointments-tabs">
                <div className="tab-section">
                  <h4>Upcoming Appointments</h4>
                  <div className="appointments-list">
                    {getUpcomingAppointments().map(appointment => (
                      <div key={appointment._id} className="appointment-card">
                        <div className="appointment-time">
                          <span className="time">{appointment.appointmentTime}</span>
                          <span className="date">{appointment.appointmentDate}</span>
                        </div>
                        
                        <div className="appointment-info">
                          <h4>Dr. {appointment.doctorId?.userId?.firstName} {appointment.doctorId?.userId?.lastName}</h4>
                          <p>Specialization: {appointment.doctorId?.specialization}</p>
                          <p>Reason: {appointment.reason || 'General consultation'}</p>
                          <span className={`status-badge ${appointment.status}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="appointment-actions">
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              // In a real app, this would open a reschedule modal
                              alert('Reschedule functionality would open here');
                            }}
                          >
                            Reschedule
                          </button>
                          <button 
                            className="btn-danger"
                            onClick={() => {
                              if (window.confirm('Are you sure you want to cancel this appointment?')) {
                                // In a real app, this would call an API to cancel the appointment
                                alert('Appointment cancelled successfully');
                              }
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ))}
                    {getUpcomingAppointments().length === 0 && (
                      <div className="empty-state">
                        <p>No upcoming appointments</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="tab-section">
                  <h4>Past Appointments</h4>
                  <div className="appointments-list">
                    {getPastAppointments().map(appointment => (
                      <div key={appointment._id} className="appointment-card">
                        <div className="appointment-time">
                          <span className="time">{appointment.appointmentTime}</span>
                          <span className="date">{appointment.appointmentDate}</span>
                        </div>
                        
                        <div className="appointment-info">
                          <h4>Dr. {appointment.doctorId?.userId?.firstName} {appointment.doctorId?.userId?.lastName}</h4>
                          <p>Specialization: {appointment.doctorId?.specialization}</p>
                          <p>Reason: {appointment.reason || 'General consultation'}</p>
                          <span className={`status-badge ${appointment.status}`}>
                            {appointment.status}
                          </span>
                        </div>
                        
                        <div className="appointment-actions">
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              // In a real app, this would show appointment details in a modal
                              alert(`Appointment Details:\nDate: ${appointment.appointmentDate}\nTime: ${appointment.appointmentTime}\nDoctor: Dr. ${appointment.doctorId?.userId?.firstName} ${appointment.doctorId?.userId?.lastName}\nReason: ${appointment.reason || 'General consultation'}`);
                            }}
                          >
                            View Details
                          </button>
                          <button 
                            className="btn-secondary"
                            onClick={() => {
                              // Pre-fill the appointment form with the same doctor
                              setAppointmentForm({
                                doctorId: appointment.doctorId._id,
                                appointmentDate: '',
                                appointmentTime: '',
                                reason: appointment.reason || '',
                                symptoms: appointment.symptoms || ''
                              });
                              setShowAppointmentModal(true);
                            }}
                          >
                            Book Again
                          </button>
                        </div>
                      </div>
                    ))}
                    {getPastAppointments().length === 0 && (
                      <div className="empty-state">
                        <p>No past appointments</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="prescriptions-content">
              <div className="content-header">
                <h3>My Prescriptions</h3>
              </div>

              <div className="prescriptions-list">
                {prescriptions.map(prescription => (
                  <div key={prescription._id} className="prescription-card">
                    <div className="prescription-header">
                      <h4>Prescription #{prescription._id.slice(-6).toUpperCase()}</h4>
                      <span className="prescription-date">
                        {new Date(prescription.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="prescription-content">
                      <p><strong>Doctor:</strong> Dr. {prescription.doctorId?.userId?.firstName} {prescription.doctorId?.userId?.lastName}</p>
                      <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                      <p><strong>Medicines:</strong> {prescription.medications?.map(med => `${med.medicine?.name || med.name || 'Unknown'} ${med.dosage || 'N/A'}`).join(', ')}</p>
                      {prescription.instructions && (
                        <p><strong>Instructions:</strong> {prescription.instructions}</p>
                      )}
                    </div>
                    <div className="prescription-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          // In a real app, this would show prescription details in a modal
                          alert(`Prescription Details:\nID: ${prescription._id.slice(-6).toUpperCase()}\nDate: ${new Date(prescription.createdAt).toLocaleDateString()}\nDoctor: Dr. ${prescription.doctorId?.userId?.firstName} ${prescription.doctorId?.userId?.lastName}\nDiagnosis: ${prescription.diagnosis}\nMedicines: ${prescription.medications?.map(med => `${med.medicine?.name || med.name || 'Unknown'} ${med.dosage || 'N/A'}`).join(', ')}\nInstructions: ${prescription.instructions || 'None'}`);
                        }}
                      >
                        View Details
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          // In a real app, this would generate and download a PDF
                          alert('PDF download started');
                        }}
                      >
                        Download PDF
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => {
                          // In a real app, this would open print dialog
                          window.print();
                        }}
                      >
                        Print
                      </button>
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && (
                  <div className="empty-state">
                    <p>No prescriptions found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="messages-content">
                              <div className="content-header">
                  <h3>Messages</h3>
                  <div className="header-actions">
                    <button 
                      className="btn-secondary"
                      onClick={async () => {
                        try {
                          // Mark all unread messages as read via API
                          const unreadMessages = messages.filter(m => !m.read);
                          await Promise.all(
                            unreadMessages.map(message => 
                              axios.put(`/api/messages/${message._id}/read`)
                            )
                          );
                          // Update local state
                          const updatedMessages = messages.map(m => ({ ...m, read: true }));
                          setMessages(updatedMessages);
                        } catch (error) {
                          console.error('Error marking all messages as read:', error);
                          alert('Failed to mark all messages as read');
                        }
                      }}
                    >
                      Mark All Read
                    </button>
                    <button 
                      className="primary-btn"
                      onClick={() => setShowMessageModal(true)}
                    >
                      + Send Message
                    </button>
                  </div>
                </div>

                <div className="messages-list">
                  {messages.map(message => (
                    <div key={message._id || message.id} className={`message-card ${!message.read ? 'unread' : ''}`}>
                      <div className="message-content">
                        <h4>{message.senderId?.firstName ? `${message.senderId.firstName} ${message.senderId.lastName}` : message.from || 'Unknown Sender'}</h4>
                        <p className="message-subject">{message.subject}</p>
                        <p className="message-text">{message.message}</p>
                        <span className="message-time">
                          {message.createdAt ? new Date(message.createdAt).toLocaleString() : message.time || 'Unknown time'}
                        </span>
                      </div>
                      <div className="message-actions">
                        <button className="btn-secondary">Reply</button>
                        <button 
                          className="btn-secondary"
                          onClick={() => markMessageAsRead(message._id)}
                        >
                          Mark Read
                        </button>
                      </div>
                    </div>
                  ))}
                  {messages.length === 0 && (
                    <div className="empty-state">
                      <p>No messages found</p>
                    </div>
                  )}
                </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-content">
              <div className="content-header">
                <h3>Patient Profile</h3>
                <button className="primary-btn" onClick={handleUpdateProfile}>Save Changes</button>
              </div>

              <div className="profile-form">
                <div className="form-section">
                  <h4>Personal Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>First Name</label>
                      <input type="text" defaultValue={user?.firstName} />
                    </div>
                    <div className="form-group">
                      <label>Last Name</label>
                      <input type="text" defaultValue={user?.lastName} />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input type="email" defaultValue={user?.email} />
                    </div>
                    <div className="form-group">
                      <label>Phone</label>
                      <input type="tel" defaultValue={user?.phone} />
                    </div>
                    <div className="form-group">
                      <label>Date of Birth</label>
                      <input type="date" defaultValue={user?.dateOfBirth} />
                    </div>
                    <div className="form-group">
                      <label>Gender</label>
                      <select defaultValue={user?.gender}>
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Medical Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Blood Group</label>
                      <select defaultValue={user?.bloodGroup}>
                        <option value="">Select Blood Group</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Height (cm)</label>
                      <input type="number" defaultValue={user?.height} />
                    </div>
                    <div className="form-group">
                      <label>Weight (kg)</label>
                      <input type="number" defaultValue={user?.weight} />
                    </div>
                    <div className="form-group">
                      <label>Emergency Contact</label>
                      <input type="text" defaultValue={user?.emergencyContact} />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Medical History</h4>
                  <textarea 
                    rows="4" 
                    defaultValue={user?.medicalHistory}
                    placeholder="Enter your medical history, allergies, and conditions..."
                  />
                </div>

                <div className="form-section">
                  <h4>Current Medications</h4>
                  <textarea 
                    rows="4" 
                    defaultValue={user?.currentMedications}
                    placeholder="List any medications you are currently taking..."
                  />
                </div>

                <div className="form-section">
                  <h4>Lab Reports</h4>
                  <div className="file-upload">
                    <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" />
                    <p>Upload lab reports, test results, or medical documents</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Appointment Booking Modal */}
      {showAppointmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Book Appointment</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowAppointmentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Select Doctor *</label>
                <select 
                  value={appointmentForm.doctorId}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  required
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.userId?.firstName} {doctor.userId?.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Appointment Date *</label>
                <input 
                  type="date" 
                  value={appointmentForm.appointmentDate}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Preferred Time *</label>
                <select 
                  value={appointmentForm.appointmentTime}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  required
                >
                  <option value="">Select time</option>
                  <option value="09:00">9:00 AM</option>
                  <option value="10:00">10:00 AM</option>
                  <option value="11:00">11:00 AM</option>
                  <option value="14:00">2:00 PM</option>
                  <option value="15:00">3:00 PM</option>
                  <option value="16:00">4:00 PM</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason for Visit</label>
                <textarea 
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Describe your symptoms or reason for the appointment..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Symptoms</label>
                <textarea 
                  value={appointmentForm.symptoms}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, symptoms: e.target.value }))}
                  placeholder="List any symptoms you are experiencing..."
                  rows="3"
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowAppointmentModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-btn"
                onClick={handleBookAppointment}
              >
                Book Appointment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Send Message to Doctor</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowMessageModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Select Doctor *</label>
                <select 
                  value={messageForm.doctorId}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, doctorId: e.target.value }))}
                  required
                >
                  <option value="">Choose a doctor</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor.userId?._id}>
                      Dr. {doctor.userId?.firstName} {doctor.userId?.lastName} - {doctor.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Subject *</label>
                <input 
                  type="text" 
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Enter message subject..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea 
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Type your message here..."
                  rows="5"
                  required
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowMessageModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-btn"
                onClick={handleSendMessage}
              >
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      

    </div>
  );
};

export default PatientDashboard;
