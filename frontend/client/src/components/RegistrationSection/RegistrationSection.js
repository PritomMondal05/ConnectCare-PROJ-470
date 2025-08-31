import React, { useState } from 'react';
import axios from 'axios';

// --- CSS Styles are now included directly in the component ---
const Styles = () => (
  <style>{`
    /* General Body Styles */
    .registration-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 1rem;
    }

    .registration-modal {
        background: #fff;
        padding: 2.5rem 2rem 2rem 2rem;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
        width: 100%;
        max-width: 500px;
        position: relative;
        animation: fadeIn 0.3s ease-out;
    }

    @keyframes fadeIn {
        from {
            opacity: 0;
            transform: translateY(-30px) scale(0.98);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .close-btn {
        position: absolute;
        top: 14px;
        right: 18px;
        background: none;
        border: none;
        font-size: 1.6rem;
        color: #888;
        cursor: pointer;
        transition: color 0.2s;
    }

    .close-btn:hover {
        color: #e74c3c;
    }

    .registration-modal h2 {
        margin-top: 0;
        margin-bottom: 1.2rem;
        font-size: 1.7rem;
        font-weight: 700;
        text-align: center;
        color: #2d3a4b;
    }

    /* --- Form Styles --- */
    .registration-modal form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
    }

    .form-row {
        display: flex;
        flex-direction: row;
        gap: 1rem;
    }

    .form-group {
        display: flex;
        flex-direction: column;
        flex: 1;
        gap: 0.4rem;
    }

    .form-group label {
        font-size: 0.9rem;
        font-weight: 500;
        color: #334155;
    }

    .registration-modal input,
    .registration-modal select {
        padding: 0.7rem 0.9rem;
        border: 1px solid #d1d5db;
        border-radius: 6px;
        font-size: 1rem;
        font-family: 'Inter', sans-serif;
        outline: none;
        transition: border 0.2s, box-shadow 0.2s;
        background: #f8fafc;
    }

    .registration-modal input:focus,
    .registration-modal select:focus {
        border-color: #4f8cff;
        background: #fff;
        box-shadow: 0 0 0 3px rgba(79, 140, 255, 0.2);
    }

    .registration-modal button[type='submit'] {
        margin-top: 0.5rem;
        padding: 0.8rem 0;
        background: #4f8cff;
        color: #fff;
        border: none;
        border-radius: 6px;
        font-size: 1.08rem;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.2s, transform 0.1s;
    }

    .registration-modal button[type='submit']:hover:enabled {
        background: #2563eb;
        transform: translateY(-1px);
    }

    .registration-modal button[type='submit']:disabled {
        background: #b6c6e6;
        cursor: not-allowed;
    }

    /* --- Message Styles --- */
    .error-message, .success-message {
        border-radius: 5px;
        padding: 0.7rem 1rem;
        margin-bottom: 1rem;
        font-size: 0.98rem;
        text-align: center;
        animation: fadeIn 0.3s;
    }

    .error-message {
        background: #ffeaea;
        color: #d32f2f;
        border: 1px solid #f5c6cb;
    }

    .success-message {
        background: #eaffea;
        color: #2e7d32;
        border: 1px solid #b2dfdb;
    }

    /* --- Bottom Link --- */
    .registration-modal p {
        margin-top: 1.2rem;
        text-align: center;
        font-size: 1rem;
        color: #555;
    }

    .registration-modal p button {
        background: none;
        border: none;
        color: #4f8cff;
        font-weight: 600;
        cursor: pointer;
        padding: 0;
        font-size: 1rem;
        transition: color 0.2s;
    }

    .registration-modal p button:hover {
        color: #2563eb;
    }

    /* --- Responsive Design --- */
    @media (max-width: 480px) {
        .form-row {
            flex-direction: column;
            gap: 1rem;
        }
        .registration-modal {
            padding: 2rem 1.5rem 1.5rem 1.5rem;
        }
    }
  `}</style>
);


const RegistrationSection = ({ isOpen, onClose, onRegistrationSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    age: '',
    bloodGroup: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    role: 'patient'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const roles = ['patient', 'doctor', 'admin'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // --- Frontend Validation ---
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }
    if (formData.age < 1 || formData.age > 120) {
        setError('Please enter a valid age');
        setLoading(false);
        return;
    }

    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        age: formData.age,
        bloodGroup: formData.bloodGroup,
        phone: formData.phone,
        role: formData.role
      };

      const response = await axios.post('/api/auth/register', payload);
      setSuccess(response.data.message || 'Account created successfully! Please sign in.');

      setFormData({
        firstName: '', lastName: '', age: '', bloodGroup: '', email: '',
        password: '', confirmPassword: '', phone: '', role: 'patient'
      });

      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin();
        }
      }, 2000);

    } catch (err) {
      const message = err.response?.data?.message || 'An error occurred during registration. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <Styles />
      <div className="registration-overlay" onClick={handleOverlayClick}>
        <div className="registration-modal">
          <button className="close-btn" onClick={handleClose}>×</button>
          <h2>Register</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input id="firstName" name="firstName" value={formData.firstName} onChange={handleInputChange} placeholder="John" required />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input id="lastName" name="lastName" value={formData.lastName} onChange={handleInputChange} placeholder="Doe" required />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input id="email" type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="john.doe@example.com" required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input id="password" type="password" name="password" value={formData.password} onChange={handleInputChange} placeholder="••••••••" required />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} placeholder="••••••••" required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input id="age" type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="25" required />
              </div>
              <div className="form-group">
                <label htmlFor="bloodGroup">Blood Group</label>
                <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleInputChange} required>
                  <option value="">Select...</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input id="phone" type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="(123) 456-7890" required />
              </div>
              <div className="form-group">
                  <label htmlFor="role">Role</label>
                  <select id="role" name="role" value={formData.role} onChange={handleInputChange} required>
                      {roles.map(role => (
                      <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
                      ))}
                  </select>
              </div>
            </div>

            <button type="submit" disabled={loading}>{loading ? 'Registering...' : 'Register'}</button>
          </form>
          
          <p>
            Already have an account?{' '}
            <button type="button" onClick={onSwitchToLogin}>Log In</button>
          </p>
        </div>
      </div>
    </>
  );
};

export default RegistrationSection;
