import React, { useState } from 'react';
import axios from 'axios';
import './LoginSection.css';

const LoginSection = ({ isOpen, onClose, onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    specialization: '',
    licenseNumber: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    if (isLogin) {
      try {
        const payload = {
          email: formData.email,
          password: formData.password
        };
        const response = await axios.post('/api/auth/login', payload);

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));

        setSuccess(`Welcome back, ${user.firstName}!`);

        setTimeout(() => {
          onClose && onClose();
          onLoginSuccess && onLoginSuccess(user);
          // Role-based redirect
          if (user.role === 'admin') {
            window.location.href = '/admin-dashboard';
          } else if (user.role === 'doctor') {
            window.location.href = '/doctor-dashboard';
          } else {
            window.location.href = '/patient-dashboard';
          }
        }, 1500);

      } catch (err) {
        const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
        setError(message);
      } finally {
        setLoading(false);
      }
    } else {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        setLoading(false);
        return;
      }
      try {
        const payload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        };

        const response = await axios.post('/api/auth/register', payload);

        setSuccess(response.data.message || 'Account created! Please sign in.');
        setIsLogin(true);

      } catch (err) {
        const message = err.response?.data?.message || 'Registration failed. Please try again.';
        setError(message);
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      email: '', password: '', confirmPassword: '', firstName: '',
      lastName: '', specialization: '', licenseNumber: ''
    });
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    onClose && onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="login-overlay" onClick={handleOverlayClick}>
      <div className="login-modal">
        <button className="login-close-btn" onClick={handleClose} aria-label="Close">&times;</button>
        <div className="login-container">
          <h2>{isLogin ? "Sign In" : "Register"}</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <form onSubmit={handleSubmit} autoComplete="off">
            <div>
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                autoFocus
              />
            </div>
            <div>
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="login-confirm-password">Confirm Password</label>
                  <input
                    id="login-confirm-password"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-first-name">First Name</label>
                  <input
                    id="login-first-name"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <label htmlFor="login-last-name">Last Name</label>
                  <input
                    id="login-last-name"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </>
            )}
            <button type="submit" disabled={loading}>
              {loading ? (isLogin ? "Signing In..." : "Registering...") : (isLogin ? "Sign In" : "Register")}
            </button>
          </form>
          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button type="button" onClick={toggleMode}>
              {isLogin ? "Register" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSection;