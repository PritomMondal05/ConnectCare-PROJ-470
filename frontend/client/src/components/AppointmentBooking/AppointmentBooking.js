import React, { useState, useEffect } from 'react';
import './AppointmentBooking.css';

const AppointmentBooking = ({ doctor, onClose, onBook }) => {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate available dates (next 30 days)
  const generateAvailableDates = () => {
    const dates = [];
    const today = new Date();
    
    for (let i = 1; i <= 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      // Skip weekends (Saturday = 6, Sunday = 0)
      if (date.getDay() !== 0 && date.getDay() !== 6) {
        dates.push({
          date: date.toISOString().split('T')[0],
          display: date.toLocaleDateString('en-US', { 
            weekday: 'short', 
            month: 'short', 
            day: 'numeric' 
          })
        });
      }
    }
    return dates;
  };

  // Generate time slots (9 AM to 5 PM, 30-minute intervals)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Mock available slots (in real app, this would come from doctor's calendar)
  const getAvailableSlotsForDate = (date) => {
    const allSlots = generateTimeSlots();
    const randomUnavailable = Math.floor(Math.random() * 3); // Random unavailable slots
    
    return allSlots.filter((_, index) => {
      // Simulate some slots being unavailable
      return !(index % 4 === randomUnavailable || index % 7 === randomUnavailable);
    });
  };

  useEffect(() => {
    if (selectedDate) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const slots = getAvailableSlotsForDate(selectedDate);
        setAvailableSlots(slots);
        setLoading(false);
      }, 500);
    }
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime('');
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleBooking = () => {
    if (!selectedDate || !selectedTime) return;

    const appointment = {
      doctorId: doctor.id,
      doctorName: `${doctor.firstName} ${doctor.lastName}`,
      date: selectedDate,
      time: selectedTime,
      status: 'pending'
    };

    onBook(appointment);
    onClose();
  };

  const availableDates = generateAvailableDates();

  return (
    <div className="appointment-booking-overlay">
      <div className="appointment-booking-modal">
        <div className="modal-header">
          <h3>Book Appointment with {doctor.firstName} {doctor.lastName}</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="doctor-info">
            <div className="doctor-avatar">👨‍⚕️</div>
            <div>
              <h4>Dr. {doctor.firstName} {doctor.lastName}</h4>
              <p>{doctor.specialization}</p>
            </div>
          </div>

          <div className="booking-section">
            <h4>Select Date</h4>
            <div className="date-selector">
              {availableDates.map((dateObj) => (
                <button
                  key={dateObj.date}
                  className={`date-btn ${selectedDate === dateObj.date ? 'selected' : ''}`}
                  onClick={() => handleDateSelect(dateObj.date)}
                >
                  {dateObj.display}
                </button>
              ))}
            </div>
          </div>

          {selectedDate && (
            <div className="booking-section">
              <h4>Select Time</h4>
              {loading ? (
                <div className="loading-slots">
                  <div className="spinner"></div>
                  <p>Loading available slots...</p>
                </div>
              ) : (
                <div className="time-selector">
                  {availableSlots.length > 0 ? (
                    availableSlots.map((time) => (
                      <button
                        key={time}
                        className={`time-btn ${selectedTime === time ? 'selected' : ''}`}
                        onClick={() => handleTimeSelect(time)}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <p className="no-slots">No available slots for this date</p>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="appointment-summary">
              <h4>Appointment Summary</h4>
              <div className="summary-details">
                <p><strong>Doctor:</strong> Dr. {doctor.firstName} {doctor.lastName}</p>
                <p><strong>Date:</strong> {new Date(selectedDate).toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Duration:</strong> 30 minutes</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button 
            className="book-btn" 
            disabled={!selectedDate || !selectedTime}
            onClick={handleBooking}
          >
            Book Appointment
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentBooking;

