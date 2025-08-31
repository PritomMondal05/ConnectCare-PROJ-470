import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import './Footer.css';

const Footer = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);

  const schema = yup.object().shape({
    email: yup.string().email('Please enter a valid email').required('Email is required'),
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  const onSubmit = (data) => {
    console.log('Newsletter subscription:', data);
    setIsSubscribed(true);
    reset();
    setTimeout(() => setIsSubscribed(false), 3000);
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__content">
          {/* Left Side */}
          <div className="footer__left">
            <div className="footer__logo">
              <img 
                src="/logo/conncetcare logo.svg" 
                alt="ConnectCare"
                className="footer__logo-img"
              />
              <span className="footer__logo-text">ConnectCare</span>
            </div>
            <p className="footer__tagline">
              End-to-end automation for clinical documentation
            </p>
            <button className="btn btn-primary footer__cta">
              Book Your Demo Today
            </button>
          </div>

          {/* Right Side */}
          <div className="footer__right">
            <div className="footer__nav">
              <div className="footer__nav-column">
                <h4 className="footer__nav-title">Company</h4>
                <ul className="footer__nav-list">
                  <li><a href="#solutions" className="footer__nav-link">Solutions</a></li>
                  <li><a href="/find-doctor" className="footer__nav-link">Find Doctor</a></li>
                  <li><a href="#about" className="footer__nav-link">About Us</a></li>
                  <li><a href="#contact" className="footer__nav-link">Contact Us</a></li>
                </ul>
              </div>
              <div className="footer__nav-column">
                <h4 className="footer__nav-title">Legal</h4>
                <ul className="footer__nav-list">
                  <li><a href="#compliance" className="footer__nav-link">Compliance</a></li>
                  <li><a href="#terms" className="footer__nav-link">Terms of Service</a></li>
                  <li><a href="#privacy" className="footer__nav-link">Privacy Policy</a></li>
                </ul>
              </div>
            </div>

            <div className="footer__newsletter">
              <h4 className="footer__newsletter-title">Send Your Feedback</h4>
              <form onSubmit={handleSubmit(onSubmit)} className="footer__newsletter-form">
                <div className="footer__newsletter-input-group">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`footer__newsletter-input ${errors.email ? 'footer__newsletter-input--error' : ''}`}
                    {...register('email')}
                  />
                  <button type="submit" className="btn btn-primary footer__newsletter-btn">
                    Subscribe
                  </button>
                </div>
                {errors.email && (
                  <p className="footer__newsletter-error">{errors.email.message}</p>
                )}
                {isSubscribed && (
                  <p className="footer__newsletter-success">Thank you for Feedback!</p>
                )}
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            Copyright 2025. ConnectCare, Inc. All rights reserved.
          </p>
          <div className="footer__attribution">
            Created by Pritom Mondal CSE 470
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 