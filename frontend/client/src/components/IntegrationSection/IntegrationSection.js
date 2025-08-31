import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './IntegrationSection.css';

const AboutSection = () => {
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <section className="about-section-main" id="about-us">
      <div className="container">
        <motion.div 
          className="about-section-main__content"
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Header */}
          <motion.div 
            className="about-section-main__header"
            variants={itemVariants}
          >
            <h2 className="about-section-main__title">
              About ConnectCare
            </h2>
            <p className="about-section-main__description">
              Revolutionizing healthcare through innovative technology and seamless communication
            </p>
          </motion.div>

          {/* Mission Section */}
          <motion.div 
            className="about-section"
            variants={itemVariants}
          >
            <h3 className="about-section__title">Our Mission</h3>
            <p className="about-section__text">
              At ConnectCare, our mission is to revolutionize the healthcare experience by bridging the communication gap between patients and doctors. We believe in creating a seamless, secure, and efficient digital environment where managing healthcare is simpler and more intuitive for everyone involved. Our platform is designed to be a comprehensive solution for clinics, telemedicine providers, and modern healthcare startups.
            </p>
          </motion.div>

          {/* What is ConnectCare Section */}
          <motion.div 
            className="about-section"
            variants={itemVariants}
          >
            <h3 className="about-section__title">🏥 What is ConnectCare?</h3>
            <p className="about-section__text">
              ConnectCare is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application designed to streamline every aspect of outpatient care. We provide a secure, role-based portal that serves the unique needs of each user in the healthcare journey.
            </p>
            
            <div className="features-grid">
              <div className="feature-card">
                <h4 className="feature-card__title">For Patients</h4>
                <p className="feature-card__text">
                  Our platform empowers you to take control of your health. You can easily book, reschedule, or cancel appointments; securely submit your medical history and symptoms before a visit; and access your visit summaries, lab results, and prescriptions at any time.
                </p>
              </div>
              
              <div className="feature-card">
                <h4 className="feature-card__title">For Doctors</h4>
                <p className="feature-card__text">
                  We offer a powerful and comprehensive dashboard to manage your practice efficiently. You can access full patient medical histories, manage visit logs, create detailed treatment plans, and securely communicate with patients, all within one integrated platform.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Our Story Section */}
          <motion.div 
            className="about-section"
            variants={itemVariants}
          >
            <h3 className="about-section__title">💡 Our Story</h3>
            <p className="about-section__text">
              ConnectCare was born from a passion for technology and a desire to solve real-world problems. It began as an ambitious project for the CSE470: Software Engineering course during the Summer 2025 semester. This academic foundation instilled in us a commitment to quality, robust database design, and modern web development practices, which remain at the core of our platform today.
            </p>
          </motion.div>

          {/* Vision Section */}
          <motion.div 
            className="about-section"
            variants={itemVariants}
          >
            <h3 className="about-section__title">🚀 Our Vision for the Future</h3>
            <p className="about-section__text">
              Our vision is to continuously evolve ConnectCare into an all-encompassing digital health ecosystem. We are actively planning future enhancements to make quality healthcare even more accessible, including:
            </p>
            
            <div className="vision-features">
              <div className="vision-feature">
                <span className="vision-feature__icon">🎥</span>
                <span className="vision-feature__text">Real-time Video Consultations</span>
              </div>
              <div className="vision-feature">
                <span className="vision-feature__icon">💳</span>
                <span className="vision-feature__text">Secure Online Payment Processing</span>
              </div>
              <div className="vision-feature">
                <span className="vision-feature__icon">📱</span>
                <span className="vision-feature__text">Dedicated Mobile Applications for iOS and Android</span>
              </div>
              <div className="vision-feature">
                <span className="vision-feature__icon">📊</span>
                <span className="vision-feature__text">Advanced Analytics Dashboards for deeper insights</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection; 