import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero" id="home">
      <div className="hero__video-background">
        <video 
          src="/heropagebg.mp4" 
          autoPlay 
          muted 
          loop 
          playsInline
          className="hero__background-video"
        />
      </div>
      <div className="container">
        <div className="hero__content">
          <div className="hero__text">
            <h1 className="hero__title">
            Streamline Patient Care with Smart Secure Health Management
            </h1>
            <p className="hero__subtitle">
              Streamline your healthcare workflow with intelligent clinical documentation 
              that saves time, reduces errors, and improves patient care.
            </p>
            
            <div className="hero__stats">
              <div className="hero__stat">
                <span className="hero__stat-number">85%</span>
                <span className="hero__stat-label">Time Saved</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-number">99%</span>
                <span className="hero__stat-label">Accuracy Rate</span>
              </div>
              <div className="hero__stat">
                <span className="hero__stat-number">500+</span>
                <span className="hero__stat-label">Healthcare Providers</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero; 