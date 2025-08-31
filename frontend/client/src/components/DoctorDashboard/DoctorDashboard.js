import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DoctorDashboard.css';
import '../../styles/dashboard-common.css';

const DoctorDashboard = () => {
  const [user, setUser] = useState(null);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [messages, setMessages] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const [prescriptionForm, setPrescriptionForm] = useState({
    patientId: '',
    medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
    instructions: '',
    diagnosis: ''
  });
  const [messageForm, setMessageForm] = useState({
    receiverId: '',
    subject: '',
    message: '',
    messageType: 'general',
    priority: 'normal'
  });
  const [messageFilter, setMessageFilter] = useState('all'); // all, unread, read
  const [messageSearch, setMessageSearch] = useState('');
  const [appointmentForm, setAppointmentForm] = useState({
    patientId: '',
    appointmentDate: '',
    appointmentTime: '',
    duration: '30',
    type: 'in-person',
    reason: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [messagePollingInterval, setMessagePollingInterval] = useState(null);

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

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
      
      // Start real-time message polling
      startMessagePolling();
    } else {
      window.location.href = '/';
    }
    
    // Cleanup function
    return () => {
      if (messagePollingInterval) {
        clearInterval(messagePollingInterval);
      }
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      // Load appointments, patients, messages, and prescriptions
      await Promise.all([
        loadDoctorProfile(),
        loadAppointments(),
        loadPatients(),
        loadMessages(),
        loadPrescriptions()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError('Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const loadDoctorProfile = async () => {
    try {
      const response = await axios.get('/api/doctors/me');
      if (response.data.success) {
        setDoctorProfile(response.data.doctor);
        // Update user data with doctor profile information
        setUser(prevUser => ({
          ...prevUser,
          ...response.data.doctor.userId,
          doctorId: response.data.doctor._id,
          specialization: response.data.doctor.specialization,
          licenseNumber: response.data.doctor.licenseNumber,
          experience: response.data.doctor.experience,
          consultationFee: response.data.doctor.consultationFee
        }));
      }
    } catch (error) {
      console.error('Error loading doctor profile:', error);
    }
  };

  const loadAppointments = async () => {
    try {
      const response = await axios.get('/api/appointments/doctor');
      setAppointments(response.data.appointments || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      setError('Failed to load appointments');
    }
  };

  const loadPatients = async () => {
    try {
      const response = await axios.get('/api/patients');
      setPatients(response.data.patients || []);
    } catch (error) {
      console.error('Error loading patients:', error);
      setError('Failed to load patients');
    }
  };

  const loadMessages = async () => {
    try {
      const response = await axios.get('/api/messages/inbox');
      if (response.data.success) {
        setMessages(response.data.messages || []);
        // Update unread count in the UI if needed
        const unreadCount = response.data.unreadCount || 0;
        // You can add a state for unread count if needed
      }
    } catch (error) {
      console.error('Error loading messages:', error);
      // Don't set error for polling failures, only for initial load failures
      if (!messagePollingInterval) {
        setError('Failed to load messages');
      }
    }
  };

  const loadPrescriptions = async () => {
    try {
      const response = await axios.get('/api/prescriptions/doctor');
      setPrescriptions(response.data.prescriptions || []);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Failed to load prescriptions');
    }
  };

  // Real-time message polling
  const startMessagePolling = () => {
    // Poll for new messages every 10 seconds
    const interval = setInterval(async () => {
      try {
        await loadMessages();
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    }, 10000); // 10 seconds
    
    setMessagePollingInterval(interval);
  };

  const stopMessagePolling = () => {
    if (messagePollingInterval) {
      clearInterval(messagePollingInterval);
      setMessagePollingInterval(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    window.location.href = '/';
  };

  const updateAppointmentStatus = async (appointmentId, status) => {
    try {
      await axios.put(`/api/appointments/${appointmentId}`, { status });
      await loadAppointments();
      alert(`Appointment marked as ${status}`);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      alert('Failed to update appointment status');
    }
  };

  const deleteAppointment = async (appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await axios.delete(`/api/appointments/${appointmentId}`);
        await loadAppointments();
        alert('Appointment deleted successfully');
      } catch (error) {
        console.error('Error deleting appointment:', error);
        alert('Failed to delete appointment');
      }
    }
  };

  const createNewAppointment = async (appointmentData) => {
    try {
      await axios.post('/api/appointments', appointmentData);
      await loadAppointments();
      alert('Appointment created successfully');
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment');
    }
  };

  const generatePrescriptionPDF = async (prescriptionId) => {
    try {
      const response = await axios.get(`/api/prescriptions/${prescriptionId}/pdf`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `prescription-${prescriptionId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF');
    }
  };

  const sendPrescriptionToPatient = async (prescriptionId) => {
    try {
      await axios.post(`/api/prescriptions/${prescriptionId}/send`);
      alert('Prescription sent to patient successfully');
    } catch (error) {
      console.error('Error sending prescription:', error);
      alert('Failed to send prescription to patient');
    }
  };

  const handleCreatePrescription = async () => {
    try {
      if (!prescriptionForm.patientId || !prescriptionForm.diagnosis) {
        alert('Please fill in all required fields');
        return;
      }

      await axios.post('/api/prescriptions', prescriptionForm);
      setShowPrescriptionModal(false);
      setPrescriptionForm({
        patientId: '',
        medicines: [{ name: '', dosage: '', frequency: '', duration: '' }],
        instructions: '',
        diagnosis: ''
      });
      await loadPrescriptions();
      alert('Prescription created successfully');
    } catch (error) {
      console.error('Error creating prescription:', error);
      alert('Failed to create prescription');
    }
  };

  const addMedicineToPrescription = () => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: [...prev.medicines, { name: '', dosage: '', frequency: '', duration: '' }]
    }));
  };

  const updateMedicineInPrescription = (index, field, value) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.map((med, i) => 
        i === index ? { ...med, [field]: value } : med
      )
    }));
  };

  const removeMedicineFromPrescription = (index) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medicines: prev.medicines.filter((_, i) => i !== index)
    }));
  };

  const handleSendMessage = async () => {
    try {
      if (!messageForm.receiverId || !messageForm.subject || !messageForm.message) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await axios.post('/api/messages', messageForm);
      if (response.data.success) {
        setShowMessageModal(false);
        setMessageForm({
          receiverId: '',
          subject: '',
          message: '',
          messageType: 'general',
          priority: 'normal'
        });
        
        // Immediately refresh messages to show the new message
        await loadMessages();
        alert('Message sent successfully');
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
      await axios.patch(`/api/messages/${messageId}/read`);
      await loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const markAllMessagesAsRead = async () => {
    try {
      await axios.patch('/api/messages/read-all');
      await loadMessages();
      alert('All messages marked as read');
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      alert('Failed to mark all messages as read');
    }
  };

  const deleteMessage = async (messageId) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      try {
        await axios.delete(`/api/messages/${messageId}`);
        await loadMessages();
        alert('Message deleted successfully');
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Failed to delete message');
      }
    }
  };

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(apt => apt.appointmentDate === today);
  };

  const getRemainingAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    return appointments.filter(apt => 
      apt.appointmentDate === today && apt.appointmentTime > now && apt.status === 'confirmed'
    );
  };

  // Filter and search messages
  const getFilteredMessages = () => {
    let filtered = messages;
    
    // Apply filter
    if (messageFilter === 'unread') {
      filtered = filtered.filter(msg => !msg.read);
    } else if (messageFilter === 'read') {
      filtered = filtered.filter(msg => msg.read);
    }
    
    // Apply search
    if (messageSearch) {
      const searchTerm = messageSearch.toLowerCase();
      filtered = filtered.filter(msg => 
        msg.subject.toLowerCase().includes(searchTerm) ||
        msg.message.toLowerCase().includes(searchTerm) ||
        `${msg.senderId?.firstName || ''} ${msg.senderId?.lastName || ''}`.toLowerCase().includes(searchTerm)
      );
    }
    
    return filtered;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        
        <p>Loading dashboard...</p>
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
    <div className="doctor-dashboard">
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
            <span className="nav-text">Dashboard</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            <span className="nav-text">Appointments</span>
          </button>
          
          <button 
            className={`nav-item ${activeTab === 'patients' ? 'active' : ''}`}
            onClick={() => setActiveTab('patients')}
          >
            <span className="nav-text">Patients</span>
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
            className={`nav-item ${activeTab === 'medicine-store' ? 'active' : ''}`}
            onClick={() => setActiveTab('medicine-store')}
          >
            <span className="nav-text">Medicine Store</span>
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
        {/* Top Header */}
        <header className="main-header">
          <div className="header-content">
            <div className="header-left">
              <h1 className="page-title">
                {activeTab === 'dashboard' && 'Dashboard'}
                {activeTab === 'appointments' && 'Appointments'}
                {activeTab === 'patients' && 'Patients'}
                {activeTab === 'prescriptions' && 'Prescriptions'}
                {activeTab === 'messages' && 'Messages'}
                {activeTab === 'medicine-store' && 'Medicine Store'}
                {activeTab === 'profile' && 'Profile'}
              </h1>
              {activeTab === 'patients' && selectedPatient && (
                <div className="patient-context">
                  <p className="patient-name">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                  <p className="patient-details">
                    Previous appointment: {selectedPatient.lastAppointment || 'No previous appointments'}
                  </p>
                  <button className="view-btn">View</button>
                </div>
              )}
            </div>
            
            <div className="header-right">
              {activeTab === 'patients' && selectedPatient && (
                <button className="primary-btn">Submit to EHR</button>
              )}
            </div>
          </div>

          {/* Sub-navigation for patients */}
          {activeTab === 'patients' && selectedPatient && (
            <nav className="sub-nav">
              <button className="sub-nav-item active">Intake</button>
              <button className="sub-nav-item">Transcription</button>
              <button className="sub-nav-item">Visit summary</button>
              <button className="sub-nav-item">Patient summary</button>
            </nav>
          )}
        </header>

        {/* Main Content */}
        <div className="main-content">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="dashboard-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Total Patients</h3>
                    <p className="stat-number">{patients.length}</p>
                    <p className="stat-description">Assigned to you</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Today's Appointments</h3>
                    <p className="stat-number">{getTodayAppointments().length}</p>
                    <p className="stat-description">{getRemainingAppointments().length} remaining</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Pending Checkups</h3>
                    <p className="stat-number">{appointments.filter(apt => apt.status === 'confirmed').length}</p>
                    <p className="stat-description">Awaiting consultation</p>
                  </div>
                </div>
                
                <div className="stat-card">
                  <div className="stat-content">
                    <h3>Unread Messages</h3>
                    <p className="stat-number">{messages.filter(m => !m.read).length}</p>
                    <p className="stat-description">From patients</p>
                  </div>
                </div>
              </div>

              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button className="action-btn primary" onClick={() => setActiveTab('appointments')}>
                    Schedule Appointment
                  </button>
                  <button className="action-btn" onClick={() => setShowPrescriptionModal(true)}>
                    Create Prescription
                  </button>
                  <button className="action-btn" onClick={() => setActiveTab('patients')}>
                    View Patients
                  </button>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {appointments.slice(0, 5).map(appointment => (
                    <div key={appointment._id} className="activity-item">
                      <div className="activity-content">
                        <p>Appointment: {appointment.patientId?.userId?.firstName} {appointment.patientId?.userId?.lastName} - {appointment.appointmentDate} at {appointment.appointmentTime}</p>
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

          {/* Appointments Tab */}
          {activeTab === 'appointments' && (
            <div className="appointments-content">
              <div className="content-header">
                <h3>Appointment Management</h3>
                <div className="header-actions">
                  <input 
                    type="text" 
                    placeholder="Search patients..." 
                    className="search-input"
                  />
                  <button 
                    className="primary-btn"
                    onClick={() => setShowAppointmentModal(true)}
                  >
                    + New Appointment
                  </button>
                </div>
              </div>

              <div className="appointments-list">
                {appointments.map(appointment => (
                  <div key={appointment._id} className="appointment-card">
                    <div className="appointment-time">
                      <span className="time">{appointment.appointmentTime}</span>
                      <span className="date">{appointment.appointmentDate}</span>
                    </div>
                    
                    <div className="appointment-info">
                      <p>Name:{appointment.patientId?.userId?.firstName} {appointment.patientId?.userId?.lastName}</p>
                      <p>Age: {appointment.patientId?.userId?.dateOfBirth ? calculateAge(appointment.patientId.userId.dateOfBirth) : 'N/A'}</p>
                      <p>Blood Group: {appointment.patientId?.bloodGroup || 'N/A'}</p>
                      <p>Reason: {appointment.reason || 'General consultation'}</p>
                      <span className={`status-badge ${appointment.status}`}>
                        {appointment.status}
                      </span>
                    </div>
                    
                    <div className="appointment-actions">
                      {appointment.status === 'confirmed' && (
                        <>
                          <button 
                            className="btn-success"
                            onClick={() => updateAppointmentStatus(appointment._id, 'visited')}
                          >
                            Mark Visited
                          </button>
                          <button 
                            className="btn-warning"
                            onClick={() => updateAppointmentStatus(appointment._id, 'missed')}
                          >
                            Mark Missed
                          </button>
                        </>
                      )}
                      <button className="btn-secondary">Edit</button>
                      <button 
                        className="btn-danger"
                        onClick={() => deleteAppointment(appointment._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {appointments.length === 0 && (
                  <div className="empty-state">
                    <p>No appointments found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Patients Tab */}
          {activeTab === 'patients' && (
            <div className="patients-content">
              <div className="content-header">
                <h3>Patient Management</h3>
                <div className="header-actions">
                  <input 
                    type="text" 
                    placeholder="Search patients..." 
                    className="search-input"
                  />
                  <button className="primary-btn">+ Add Patient</button>
                </div>
              </div>

              <div className="patients-grid">
                {patients.map(patient => (
                  <div 
                    key={patient._id} 
                    className={`patient-card ${selectedPatient?._id === patient._id ? 'selected' : ''}`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="patient-avatar">
                      {patient.profileImage ? (
                        <img src={patient.profileImage} alt={patient.firstName} />
                      ) : (
                        <span className="avatar-placeholder"></span>
                      )}
                    </div>
                    
                    <div className="patient-info">
                      <h4>{patient.userId?.firstName || 'Unknown'} {patient.userId?.lastName || 'Patient'}</h4>
                      <p>Age: {patient.userId?.dateOfBirth ? calculateAge(patient.userId.dateOfBirth) : 'N/A'}</p>
                      <p>Last Visit: {patient.lastVisit || 'No visits'}</p>
                      <span className="patient-status">Active</span>
                    </div>
                    
                    <div className="patient-actions">
                                              <button className="btn-secondary">View Profile</button>

                    </div>
                  </div>
                ))}
                {patients.length === 0 && (
                  <div className="empty-state">
                    <p>No patients found</p>
                  </div>
                )}
              </div>

              {/* Patient Details Panel */}
              {selectedPatient && (
                <div className="patient-details-panel">
                  <div className="panel-header">
                    <h3>{selectedPatient.firstName} {selectedPatient.lastName}</h3>
                    <button className="close-btn" onClick={() => setSelectedPatient(null)}>×</button>
                  </div>
                  
                  <div className="panel-content">
                    <div className="detail-section">
                      <h4>Personal Information</h4>
                      <div className="detail-grid">
                        <div className="detail-item">
                          <label>Age:</label>
                          <span>{selectedPatient.userId?.dateOfBirth ? calculateAge(selectedPatient.userId.dateOfBirth) : 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Blood Group:</label>
                          <span>{selectedPatient.bloodGroup || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Phone:</label>
                          <span>{selectedPatient.userId?.phone || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                          <label>Email:</label>
                          <span>{selectedPatient.userId?.email || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Medical History</h4>
                      <div className="medical-records">
                        <div className="record-item">
                          <h5>PSA values</h5>
                          <div className="record-content">Chart</div>
                        </div>
                        <div className="record-item">
                          <h5>MRI prostate conclusion (Sep 23, 2021)</h5>
                          <div className="record-content">
                            Prostate size 3.8 x 2.4 x 3.4 cm; Volume 16 cc; PSAD 0.16. 
                            1.2 x 0.9 x 0.9 cm highly suspicious lesion (PI-RADS 4) of the left anterior transition zone at the apical level.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="detail-section">
                      <h4>Actions</h4>
                      <div className="action-buttons">
                        <button 
                          className="primary-btn"
                          onClick={() => {
                            setPrescriptionForm(prev => ({ ...prev, patientId: selectedPatient._id }));
                            setShowPrescriptionModal(true);
                          }}
                        >
                          Create Prescription
                        </button>
                        <button className="btn-secondary">View History</button>
                        <button className="btn-secondary">Send Message</button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Prescriptions Tab */}
          {activeTab === 'prescriptions' && (
            <div className="prescriptions-content">
              <div className="content-header">
                <h3>Digital Prescriptions</h3>
                <button 
                  className="primary-btn"
                  onClick={() => setShowPrescriptionModal(true)}
                >
                  + Create Prescription
                </button>
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
                      <p><strong>Patient:</strong> {prescription.patientId?.userId?.firstName} {prescription.patientId?.userId?.lastName}</p>
                      <p><strong>Diagnosis:</strong> {prescription.diagnosis}</p>
                      <p><strong>Medicines:</strong> {prescription.medications?.map(med => `${med.medicine?.name || med.name || 'Unknown'} ${med.dosage || 'N/A'}`).join(', ')}</p>
                    </div>
                    <div className="prescription-actions">
                      <button 
                        className="btn-secondary"
                        onClick={() => generatePrescriptionPDF(prescription._id)}
                      >
                        View PDF
                      </button>
                      <button className="btn-secondary">Edit</button>
                      <button 
                        className="btn-secondary"
                        onClick={() => sendPrescriptionToPatient(prescription._id)}
                      >
                        Send to Patient
                      </button>
                    </div>
                  </div>
                ))}
                {prescriptions.length === 0 && (
                  <div className="empty-state">
                    <p>No prescriptions found. Create your first prescription!</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div className="messages-content">
              <div className="content-header">
                <h3>Messages {messagePollingInterval && <span className="realtime-indicator">●</span>}</h3>
                <div className="header-actions">
                  <button className="btn-secondary" onClick={() => loadMessages()}>Refresh</button>
                  <button className="btn-secondary" onClick={markAllMessagesAsRead}>Mark All Read</button>
                  <button className="primary-btn" onClick={() => setShowMessageModal(true)}>Send Message</button>
                </div>
              </div>
              
              <div className="message-stats">
                <span className="stat-item">
                  Total: <strong>{messages.length}</strong>
                </span>
                <span className="stat-item">
                  Unread: <strong>{messages.filter(m => !m.read).length}</strong>
                </span>
                <span className="stat-item">
                  Showing: <strong>{getFilteredMessages().length}</strong>
                </span>
              </div>

              <div className="message-controls">
                <div className="message-filters">
                  <select 
                    value={messageFilter} 
                    onChange={(e) => setMessageFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Messages</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                  </select>
                </div>
                <div className="message-search">
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={messageSearch}
                    onChange={(e) => setMessageSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>

              <div className="messages-list">
                {getFilteredMessages().map(message => (
                  <div key={message._id} className={`message-card ${!message.read ? 'unread' : ''} priority-${message.priority || 'normal'}`}>
                    <div className="message-content">
                      <div className="message-header">
                        <h4>{message.senderId?.firstName || 'Unknown'} {message.senderId?.lastName || 'User'}</h4>
                        {message.priority && message.priority !== 'normal' && (
                          <span className={`priority-badge priority-${message.priority}`}>
                            {message.priority.toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="message-subject">{message.subject}</p>
                      <p className="message-text">{message.message}</p>
                      <span className="message-time">
                        {new Date(message.createdAt).toLocaleDateString()} at {new Date(message.createdAt).toLocaleTimeString()}
                        {message.read && <span className="read-indicator"> ✓</span>}
                      </span>
                    </div>
                    <div className="message-actions">
                      <button 
                        className="btn-secondary" 
                        onClick={() => markMessageAsRead(message._id)}
                        disabled={message.read}
                      >
                        {message.read ? 'Read' : 'Mark Read'}
                      </button>
                      <button className="btn-secondary">Reply</button>
                      <button 
                        className="btn-secondary delete-btn" 
                        onClick={() => deleteMessage(message._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                {getFilteredMessages().length === 0 && (
                  <div className="empty-state">
                    <p>
                      {messages.length === 0 
                        ? 'No messages found' 
                        : `No messages match your current filter (${messageFilter}) and search criteria`
                      }
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Medicine Store Tab */}
          {activeTab === 'medicine-store' && (
            <div className="medicine-store-content">
              <div className="content-header">
                <h3>Medicine Store</h3>
                <p>Access to available medicines (synced with admin's medicine store)</p>
              </div>
              
              <div className="medicine-store-iframe">
                <iframe 
                  src="/medicine-store" 
                  title="Medicine Store"
                  className="store-frame"
                />
              </div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="profile-content">
              <div className="content-header">
                <h3>Doctor Profile</h3>
                <button className="primary-btn">Save Changes</button>
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
                  </div>
                </div>

                <div className="form-section">
                  <h4>Professional Information</h4>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Specialization</label>
                      <input type="text" defaultValue={user?.specialization} />
                    </div>
                    <div className="form-group">
                      <label>License Number</label>
                      <input type="text" defaultValue={user?.licenseNumber} />
                    </div>
                    <div className="form-group">
                      <label>Experience (Years)</label>
                      <input type="number" defaultValue={user?.experience} />
                    </div>
                    <div className="form-group">
                      <label>Consultation Fee</label>
                      <input type="number" defaultValue={user?.consultationFee} />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h4>Bio</h4>
                  <textarea 
                    rows="4" 
                    defaultValue={user?.bio}
                    placeholder="Tell patients about your expertise and experience..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Prescription Modal */}
      {showPrescriptionModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create Digital Prescription</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowPrescriptionModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Patient *</label>
                <select 
                  value={prescriptionForm.patientId}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, patientId: e.target.value }))}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.userId?.firstName || 'Unknown'} {patient.userId?.lastName || 'Patient'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Diagnosis *</label>
                <textarea 
                  value={prescriptionForm.diagnosis}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                  required
                />
              </div>

              <div className="form-group">
                <label>Medicines</label>
                {prescriptionForm.medicines.map((medicine, index) => (
                  <div key={index} className="medicine-input-group">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={medicine.name}
                      onChange={(e) => updateMedicineInPrescription(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Dosage"
                      value={medicine.dosage}
                      onChange={(e) => updateMedicineInPrescription(index, 'dosage', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Frequency"
                      value={medicine.frequency}
                      onChange={(e) => updateMedicineInPrescription(index, 'frequency', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={medicine.duration}
                      onChange={(e) => updateMedicineInPrescription(index, 'duration', e.target.value)}
                    />
                    <button 
                      type="button"
                      className="btn-danger"
                      onClick={() => removeMedicineFromPrescription(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button 
                  type="button"
                  className="btn-secondary"
                  onClick={addMedicineToPrescription}
                >
                  + Add Medicine
                </button>
              </div>

              <div className="form-group">
                <label>Instructions</label>
                <textarea 
                  value={prescriptionForm.instructions}
                  onChange={(e) => setPrescriptionForm(prev => ({ ...prev, instructions: e.target.value }))}
                  placeholder="Enter instructions for the patient..."
                />
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-secondary"
                onClick={() => setShowPrescriptionModal(false)}
              >
                Cancel
              </button>
              <button 
                className="primary-btn"
                onClick={handleCreatePrescription}
              >
                Create Prescription
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Send Message</h3>
              <button 
                className="modal-close"
                onClick={() => setShowMessageModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>To (Patient) *</label>
                <select 
                  value={messageForm.receiverId}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, receiverId: e.target.value }))}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient.userId?._id || patient._id} value={patient.userId?._id || patient._id}>
                      {patient.userId?.firstName || 'Unknown'} {patient.userId?.lastName || 'Patient'}
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
                <label>Message Type</label>
                <select 
                  value={messageForm.messageType}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, messageType: e.target.value }))}
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
                  value={messageForm.priority}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="form-group">
                <label>Message *</label>
                <textarea 
                  value={messageForm.message}
                  onChange={(e) => setMessageForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Enter your message..."
                  rows="4"
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

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Create New Appointment</h3>
              <button 
                className="close-btn" 
                onClick={() => setShowAppointmentModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Patient *</label>
                <select 
                  value={appointmentForm.patientId}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, patientId: e.target.value }))}
                  required
                >
                  <option value="">Select Patient</option>
                  {patients.map(patient => (
                    <option key={patient._id} value={patient._id}>
                      {patient.userId?.firstName || 'Unknown'} {patient.userId?.lastName || 'Patient'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Date *</label>
                <input 
                  type="date"
                  value={appointmentForm.appointmentDate}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentDate: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="form-group">
                <label>Time *</label>
                <input 
                  type="time"
                  value={appointmentForm.appointmentTime}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, appointmentTime: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes)</label>
                <select 
                  value={appointmentForm.duration}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, duration: e.target.value }))}
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">1 hour</option>
                </select>
              </div>

              <div className="form-group">
                <label>Type</label>
                <select 
                  value={appointmentForm.type}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="in-person">In-person</option>
                  <option value="virtual">Virtual</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reason</label>
                <textarea 
                  value={appointmentForm.reason}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Enter appointment reason..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea 
                  value={appointmentForm.notes}
                  onChange={(e) => setAppointmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                  rows="2"
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
                onClick={() => {
                  if (appointmentForm.patientId && appointmentForm.appointmentDate && appointmentForm.appointmentTime) {
                    createNewAppointment({
                      ...appointmentForm,
                      doctorId: doctorProfile?._id
                    });
                    setShowAppointmentModal(false);
                    setAppointmentForm({
                      patientId: '',
                      appointmentDate: '',
                      appointmentTime: '',
                      duration: '30',
                      type: 'in-person',
                      reason: '',
                      notes: ''
                    });
                  } else {
                    alert('Please fill in all required fields');
                  }
                }}
              >
                Create Appointment
              </button>
            </div>
          </div>
        </div>
      )}



    </div>
  );
};

export default DoctorDashboard;
