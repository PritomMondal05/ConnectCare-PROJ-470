import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './EfficiencySection.css';

const EfficiencySection = () => {
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
        staggerChildren: 0.2
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

  const stats = [
    { id: 1, percentage: '91%', label: 'Excellent patient compliance', bgColor: 'var(--white)' },
    { id: 2, percentage: '87%', label: 'Higher patient satisfaction', bgColor: 'var(--secondary-blue)' },
    { id: 3, percentage: '59%', label: 'Improved clinical documentations', bgColor: 'var(--white)' },
    { id: 4, percentage: '88%', label: 'Higher provider satisfaction', bgColor: 'var(--accent-blue)' }
  ];

  return (
    <section className="efficiency-section" id="efficiency">
      <div className="container">
        <motion.div 
          className="efficiency-section__content"
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Text Content */}
          <motion.div 
            className="efficiency-section__text"
            variants={itemVariants}
          >
            <h2 className="efficiency-section__title">
              Drive efficiency and profitability for your practice
            </h2>
            <p className="efficiency__description">
              ConnectCare empowers patients, providers, and health systems to achieve better outcomes through intelligent automation. Our platform reduces administrative burden, improves accuracy, and enhances the overall healthcare experience.
            </p>
            
          </motion.div>

          {/* Statistics Grid */}
          <motion.div 
            className="efficiency-section__stats"
            variants={itemVariants}
          >
            <div className="stats-grid">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.id}
                  className="stat-card"
                  style={{ backgroundColor: stat.bgColor }}
                  variants={itemVariants}
                  initial="hidden"
                  animate={inView ? "visible" : "hidden"}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="stat-card__percentage">{stat.percentage}</div>
                  <div className="stat-card__label">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default EfficiencySection; 