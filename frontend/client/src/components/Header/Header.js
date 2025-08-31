import React, { useState, useEffect } from 'react';
import './Header.css';

const Header = ({ onLoginClick, onRegisterClick, onNavigate }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLoginClick = () => {
    closeMobileMenu();
    if (onLoginClick) {
      onLoginClick();
    }
  };

  const handleRegisterClick = () => {
    closeMobileMenu();
    if (onRegisterClick) {
      onRegisterClick();
    }
  };

  return (
    <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
      <div className="container">
        <div className="header__content">
          {/* Logo */}
          <div className="header__logo">
            <a href="/" onClick={e => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); closeMobileMenu(); }}>
              <img 
                src="/logo/conncetcare logo.svg" 
                alt="ConnectCare" 
                className="header__logo-img"
              />
            </a>
          </div>

          {/* Desktop Navigation */}
          <nav className="header__nav">
            <ul className="header__nav-list">
              <li><a href="#solutions" className="header__nav-link">Solutions</a></li>
              <li><a href="#" className="header__nav-link" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('find-doctor'); }}>Find Doctor</a></li>
              <li><a href="#" className="header__nav-link" onClick={(e) => { e.preventDefault(); if (onNavigate) onNavigate('medicine-store'); }}>Medicine Store</a></li>
              <li><a href="#about-us" className="header__nav-link" onClick={(e) => { e.preventDefault(); document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' }); }}>About Us</a></li>
              <li><a href="#contact" className="header__nav-link">Contact Us</a></li>
            </ul>
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="header__cta">
            <button className="btn btn-secondary header__btn" onClick={handleLoginClick}>Log In</button>
            <button className="btn btn-primary header__btn" onClick={handleRegisterClick}>Register</button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className={`header__mobile-toggle ${isMobileMenuOpen ? 'header__mobile-toggle--active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>

        {/* Mobile Navigation */}
        <div className={`header__mobile-nav ${isMobileMenuOpen ? 'header__mobile-nav--open' : ''}`}>
          <nav className="header__mobile-menu">
            <ul className="header__mobile-list">
              <li><a href="#solutions" className="header__mobile-link" onClick={closeMobileMenu}>Solutions</a></li>
              <li><a href="#" className="header__mobile-link" onClick={(e) => { e.preventDefault(); closeMobileMenu(); if (onNavigate) onNavigate('find-doctor'); }}>Find Doctor</a></li>
              <li><a href="#" className="header__mobile-link" onClick={(e) => { e.preventDefault(); closeMobileMenu(); if (onNavigate) onNavigate('medicine-store'); }}>Medicine Store</a></li>
              <li><a href="#about-us" className="header__mobile-link" onClick={(e) => { e.preventDefault(); closeMobileMenu(); document.getElementById('about-us')?.scrollIntoView({ behavior: 'smooth' }); }}>About Us</a></li>
              <li><a href="#contact" className="header__mobile-link" onClick={closeMobileMenu}>Contact Us</a></li>
            </ul>
            <div className="header__mobile-cta">
              <button className="btn btn-secondary header__mobile-btn" onClick={handleLoginClick}>Log In</button>
              <button className="btn btn-primary header__mobile-btn" onClick={handleRegisterClick}>Register</button>
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header; 