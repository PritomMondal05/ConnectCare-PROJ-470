import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import './TestimonialsSection.css';

const TestimonialsSection = () => {
  const [ref, inView] = useInView({
    threshold: 0.3,
    triggerOnce: true
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      organization: "Metro Health System",
      quote: "ConnectCare's AI Copilot has transformed patient interactions by allowing for deeper engagement and ensuring patients feel heard. It enhances care quality, improves clinic efficiency, and prioritizes patient-centered care.",
      avatar: "/avatars/doctor-1.jpg"
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      role: "Family Physician",
      organization: "Community Medical Group",
      quote: "The clinic dictation and documentation process has been revolutionized. ConnectCare's platform seamlessly integrates with our existing systems and significantly reduces administrative burden.",
      avatar: "/avatars/doctor-2.jpg"
    },
    {
      id: 3,
      name: "Dr. Emily Rodriguez",
      role: "Pediatrician",
      organization: "Children's Health Network",
      quote: "The accuracy and speed of ConnectCare's AI documentation has dramatically improved our workflow. We can now focus more on patient care and less on paperwork.",
      avatar: "/avatars/doctor-3.jpg"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

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

  const slideVariants = {
    enter: {
      opacity: 0,
      x: 100
    },
    center: {
      opacity: 1,
      x: 0
    },
    exit: {
      opacity: 0,
      x: -100
    }
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="testimonials-section" id="testimonials">
      <div className="container">
        <motion.div 
          className="testimonials-section__content"
          ref={ref}
          variants={containerVariants}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
        >
          {/* Header */}
          <motion.div 
            className="testimonials-section__header"
            variants={itemVariants}
          >
            <h2 className="testimonials__title">
              Healthcare leaders on ConnectCare impact
            </h2>
          </motion.div>

          {/* Testimonials Carousel */}
          <motion.div 
            className="testimonials-section__carousel"
            variants={itemVariants}
          >
            <div className="testimonials-carousel">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  className="testimonial-card"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: 0.5,
                    ease: "easeInOut"
                  }}
                >
                  <div className="testimonial-card__avatar">
                    <div className="testimonial-card__avatar-placeholder">
                      {testimonials[currentIndex].name.charAt(0)}
                    </div>
                  </div>
                  <blockquote className="testimonial-card__quote">
                    "{testimonials[currentIndex].quote}"
                  </blockquote>
                  <div className="testimonial-card__author">
                    <div className="testimonial-card__name">{testimonials[currentIndex].name}</div>
                    <div className="testimonial-card__role">{testimonials[currentIndex].role}</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Navigation */}
            <div className="testimonials-navigation">
              <button 
                className="testimonials-nav-btn testimonials-nav-btn--prev"
                onClick={prevTestimonial}
                aria-label="Previous testimonial"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="testimonials-dots">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    className={`testimonials-dot ${index === currentIndex ? 'testimonials-dot--active' : ''}`}
                    onClick={() => setCurrentIndex(index)}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <button 
                className="testimonials-nav-btn testimonials-nav-btn--next"
                onClick={nextTestimonial}
                aria-label="Next testimonial"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection; 