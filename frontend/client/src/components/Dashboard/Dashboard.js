import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = () => {
  // Remove login check and user state
  const [loading, setLoading] = useState(false);

  // Remove useEffect and handleLogout

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1>ConnectCare Dashboard</h1>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="dashboard-welcome">
            <h2>Welcome to ConnectCare</h2>
            <p>Your healthcare management platform is ready to streamline your operations.</p>
          </div>

          <div className="dashboard-stats">
            <div className="stat-card">
              <h3>Patient Records</h3>
              <p className="stat-number">1,247</p>
              <p className="stat-label">Active patients</p>
            </div>
            <div className="stat-card">
              <h3>Appointments</h3>
              <p className="stat-number">89</p>
              <p className="stat-label">Today's schedule</p>
            </div>
            <div className="stat-card">
              <h3>Documents</h3>
              <p className="stat-number">2,156</p>
              <p className="stat-label">Processed today</p>
            </div>
            <div className="stat-card">
              <h3>Efficiency</h3>
              <p className="stat-number">94%</p>
              <p className="stat-label">System uptime</p>
            </div>
          </div>

          <div className="dashboard-actions">
            <h3>Quick Actions</h3>
            <div className="action-buttons">
              <button className="action-btn">
                <span className="action-icon">👥</span>
                Manage Patients
              </button>
              <button className="action-btn">
                <span className="action-icon">📅</span>
                Schedule Appointment
              </button>
              <button className="action-btn">
                <span className="action-icon">📋</span>
                View Reports
              </button>
              <button className="action-btn">
                <span className="action-icon">⚙️</span>
                Settings
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;