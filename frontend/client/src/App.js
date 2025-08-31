import React, { useState, useEffect } from 'react';
import Header from './components/Header/Header';
import Hero from './components/Hero/Hero';
import LoginSection from './components/LoginSection/LoginSection';
import RegistrationSection from './components/RegistrationSection/RegistrationSection';
import FocusSection from './components/FocusSection/FocusSection';
import EfficiencySection from './components/EfficiencySection/EfficiencySection';
import AboutSection from './components/IntegrationSection/IntegrationSection';
import TestimonialsSection from './components/TestimonialsSection/TestimonialsSection';
import Footer from './components/Footer/Footer';
import Dashboard from './components/Dashboard/Dashboard';
import DoctorDashboard from './components/DoctorDashboard/DoctorDashboard';
import PatientDashboard from './components/PatientDashboard/PatientDashboard';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import MedicinePage from './components/MedicinePage/MedicinePage';
import DoctorListPage from './components/DoctorListPage';
import './App.css';

function App() {
  const [currentRoute, setCurrentRoute] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    const userType = localStorage.getItem('userType');
    
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }

    // Handle route changes
    const handleRouteChange = () => {
      const path = window.location.pathname;
      if (path === '/dashboard') {
        setCurrentRoute('dashboard');
      } else if (path === '/doctor-dashboard') {
        setCurrentRoute('doctor-dashboard');
      } else if (path === '/patient-dashboard') {
        setCurrentRoute('patient-dashboard');
      } else if (path === '/admin-dashboard') {
        setCurrentRoute('admin-dashboard');
      } else if (path === '/find-doctor') {
        setCurrentRoute('find-doctor');
      } else if (path === '/medicine-store') {
        setCurrentRoute('medicine-store');
      } else if (path === '/') {
        setCurrentRoute('home');
      }
    };

    // Listen for popstate events (browser back/forward)
    window.addEventListener('popstate', handleRouteChange);
    
    // Initial route check
    handleRouteChange();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const navigateTo = (route) => {
    setCurrentRoute(route);
    if (route === 'dashboard') {
      window.history.pushState({}, '', '/dashboard');
    } else if (route === 'doctor-dashboard') {
      window.history.pushState({}, '', '/doctor-dashboard');
    } else if (route === 'patient-dashboard') {
      window.history.pushState({}, '', '/patient-dashboard');
    } else if (route === 'admin-dashboard') {
      window.history.pushState({}, '', '/admin-dashboard');
    } else if (route === 'find-doctor') {
      window.history.pushState({}, '', '/find-doctor');
    } else if (route === 'medicine-store') {
      window.history.pushState({}, '', '/medicine-store');
    } else {
      window.history.pushState({}, '', '/');
    }
  };

  const handleLoginClick = () => {
    setIsLoginModalOpen(true);
  };

  const handleLoginClose = () => {
    setIsLoginModalOpen(false);
  };

  const handleRegisterClick = () => {
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationClose = () => {
    setIsRegistrationModalOpen(false);
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    setIsLoginModalOpen(false);
  };

  // Route handling for different dashboards
  if (currentRoute === 'doctor-dashboard') {
    return <DoctorDashboard />;
  }

  if (currentRoute === 'patient-dashboard') {
    return <PatientDashboard />;
  }

  if (currentRoute === 'admin-dashboard') {
    return <AdminDashboard />;
  }

  // If on dashboard route, show dashboard (with or without authentication)
  if (currentRoute === 'dashboard') {
    return <Dashboard />;
  }

  // If on find-doctor route, show doctor list page
  if (currentRoute === 'find-doctor') {
    return <DoctorListPage />;
  }

  // If on medicine-store route, show medicine page
  if (currentRoute === 'medicine-store') {
    return <MedicinePage />;
  }

  // Otherwise show the main landing page
  return (
    <div className="App">
      <Header onLoginClick={handleLoginClick} onRegisterClick={handleRegisterClick} onNavigate={navigateTo} />
      <main>
        <Hero />
        <FocusSection />
        <EfficiencySection />
        <AboutSection />
        <TestimonialsSection />
      </main>
      <Footer />
      <LoginSection 
        isOpen={isLoginModalOpen} 
        onClose={handleLoginClose}
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegistration={() => {
          setIsLoginModalOpen(false);
          setIsRegistrationModalOpen(true);
        }}
      />
      <RegistrationSection 
        isOpen={isRegistrationModalOpen} 
        onClose={handleRegistrationClose}
        onRegistrationSuccess={handleLoginSuccess}
        onSwitchToLogin={() => {
          setIsRegistrationModalOpen(false);
          setIsLoginModalOpen(true);
        }}
      />
    </div>
  );
}

export default App; 