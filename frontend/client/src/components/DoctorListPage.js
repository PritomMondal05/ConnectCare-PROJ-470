import React, { useState, useEffect } from 'react';
import Header from './Header/Header';
import Footer from './Footer/Footer';
import './DoctorList.css';

const DoctorListPage = () => {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch doctors from backend API
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch('/api/doctors');
        if (!response.ok) throw new Error('Failed to fetch doctors');
        const data = await response.json();
        
        // Ensure doctors is always an array and validate the data
        let doctorsArray = [];
        if (Array.isArray(data)) {
          doctorsArray = data;
        } else if (data && Array.isArray(data.doctors)) {
          doctorsArray = data.doctors;
        } else if (data && Array.isArray(data.data)) {
          doctorsArray = data.data;
        }
        
        // Filter out any invalid doctor objects
        const validDoctors = doctorsArray.filter(doctor => 
          doctor && typeof doctor === 'object' && doctor.userId && doctor.userId.firstName
        );
        
        setDoctors(validDoctors);
      } catch (err) {
        console.error('Error fetching doctors:', err);
        setError(err.message);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  // Filter doctors based on search term
  const filteredDoctors = (doctors || []).filter(doctor => {
    // Ensure doctor object exists and has required properties
    if (!doctor || typeof doctor !== 'object') return false;
    
    // Get name from populated userId or fallback
    const firstName = doctor.userId?.firstName || '';
    const lastName = doctor.userId?.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    // Get specialization (backend field) instead of specialty
    const specialization = doctor.specialization || '';
    
    // Get bio for additional search
    const bio = doctor.bio || '';
    
    // Ensure searchTerm is a string
    const search = (searchTerm || '').toLowerCase();
    
    return fullName.toLowerCase().includes(search) ||
           specialization.toLowerCase().includes(search) ||
           bio.toLowerCase().includes(search);
  });

  return (
    <div className="doctor-page">
      <Header onLoginClick={() => {}} />
      <main className="doctor-page-main">
        <section className="doctor-list-section">
          <h2 className="doctor-list-title">List of Doctors</h2>
          <p className="doctor-list-subtitle">We can help you choose top specialists from our pool of expert doctors, physicians and surgeons.</p>
          
          {/* Search Bar */}
          <div className="search-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search doctors by name, specialization, or bio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <div className="search-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            {searchTerm && doctors.length > 0 && (
              <div className="search-results-info">
                Showing {filteredDoctors.length} of {doctors.length} doctors
              </div>
            )}
          </div>

          {loading ? (
            <div className="loading">
              <div className="loading-spinner"></div>
              <p>Loading doctors...</p>
            </div>
          ) : error ? (
            <div className="error">
              <p>Error: {error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">Retry</button>
            </div>
          ) : (
            <>
              <div className="doctor-list-grid">
                {filteredDoctors.map((doctor) => (
                  <div key={doctor._id || Math.random()} className="doctor-card">
                    <img 
                      src={doctor.userId?.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAyNUMyNy4wOSAyNSA5IDQzLjA5IDkgNjVDOSA4Ni45MSAyNy4wOSAxMDUgNTAgMTA1QzcyLjkxIDEwNSA5MSA4Ni45MSA5MSA2NUM5MSA0My4wOSA3Mi45MSAyNSA1MCAyNVpNNTAgMzVDNTUuNTIzIDM1IDYwIDM5LjQ3NyA2MCA0NUM2MCA1MC41MjMgNTUuNTIzIDU1IDUwIDU1QzQ0LjQ3NyA1NSA0MCA1MC41MjMgNDAgNDVDNDAgMzkuNDc3IDQ0LjQ3NyAzNSA1MCAzNVpNNTAgOTVDNDAuMDU5IDk1IDMxLjUgODguOTU5IDI5LjUgNzkuNUwzMC41IDc5LjVDMzIuNDQxIDg4LjA1OSA0MC43OTkgOTUgNTAgOTVaIiBmaWxsPSIjOENBNjYxIi8+Cjwvc3ZnPgo='} 
                      alt={doctor.userId?.firstName || 'Doctor'} 
                      className="doctor-photo" 
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAyNUMyNy4wOSAyNSA5IDQzLjA5IDkgNjVDOSA4Ni45MSAyNy4wOSAxMDUgNTAgMTA1QzcyLjkxIDEwNSA5MSA4Ni45MSA5MSA2NUM5MSA0My4wOSA3Mi45MSAyNSA1MCAyNVpNNTAgMzVDNTUuNTIzIDM1IDYwIDM5LjQ3NyA2MCA0NUM2MCA1MC41MjMgNTUuNTIzIDU1IDUwIDU1QzQ0LjQ3NyA1NSA0MCA1MC41MjMgNDAgNDVDNDAgMzkuNDc3IDQ0LjQ3NyAzNSA1MCAzNVpNNTAgOTVDNDAuMDU5IDk1IDMxLjUgODguOTU5IDI5LjUgNzkuNUwzMC41IDc5LjVDMzIuNDQxIDg4LjA1OSA0MC43OTkgOTUgNTAgOTVaIiBmaWxsPSIjOENBNjYxIi8+Cjwvc3ZnPgo=';
                      }}
                    />
                    <h3 className="doctor-name">
                      {doctor.userId?.firstName && doctor.userId?.lastName 
                        ? `${doctor.userId.firstName} ${doctor.userId.lastName}` 
                        : 'Unknown Doctor'}
                    </h3>
                    <p className="doctor-title">{doctor.education?.[0]?.degree || 'No degree specified'}</p>
                    <p className="doctor-specialty">{doctor.specialization || 'No specialization specified'}</p>
                    {doctor.experience && (
                      <p className="doctor-experience">{doctor.experience} years experience</p>
                    )}
                    {doctor.consultationFee && (
                      <p className="doctor-fee">${doctor.consultationFee} consultation</p>
                    )}
                    <button className="doctor-profile-btn" onClick={() => setSelectedDoctor(doctor)}>
                      View Profile
                    </button>
                  </div>
                ))}
              </div>
              
              {filteredDoctors.length === 0 && searchTerm && (
                <div className="no-results">
                  <p>No doctors found matching "{searchTerm}"</p>
                  <button 
                    className="clear-search-btn"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                </div>
              )}

              {filteredDoctors.length === 0 && !searchTerm && doctors.length === 0 && (
                <div className="no-doctors">
                  <p>No doctors found in the system.</p>
                  <p>Please check back later or contact support.</p>
                </div>
              )}

              {selectedDoctor && (
                <div className="doctor-modal" onClick={() => setSelectedDoctor(null)}>
                  <div className="doctor-modal-content" onClick={e => e.stopPropagation()}>
                    <button className="doctor-modal-close" onClick={() => setSelectedDoctor(null)}>&times;</button>
                    <img 
                      src={selectedDoctor.userId?.profileImage || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik01MCAyNUMyNy4wOSAyNSA5IDQzLjA5IDkgNjVDOSA4Ni45MSAyNy4wOSAxMDUgNTAgMTA1QzcyLjkxIDEwNSA5MSA4Ni45MSA5MSA2NUM5MSA0My4wOSA3Mi45MSAyNSA1MCAyNVpNNTAgMzVDNTUuNTIzIDM1IDYwIDM5LjQ3NyA2MCA0NUM2MCA1MC41MjMgNTUuNTIzIDU1IDUwIDU1QzQ0LjQ3NyA1NSA0MCA1MC41MjMgNDAgNDVDNDAgMzkuNDc3IDQ0LjQ3NyAzNSA1MCAzNVpNNTAgOTVDNDAuMDU5IDk1IDMxLjUgODguOTU5IDI5LjUgNzkuNUwzMC41IDc5LjVDMzIuNDQxIDg4LjA1OSA0MC43OTkgOTUgNTAgOTVaIiBmaWxsPSIjOENBNjYxIi8+Cjwvc3ZnPgo='} 
                      alt={selectedDoctor.userId?.firstName || 'Doctor'} 
                      className="doctor-modal-photo" 
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJd';
                      }}
                    />
                    <h3 className="doctor-modal-name">
                      {selectedDoctor.userId?.firstName && selectedDoctor.userId?.lastName 
                        ? `${selectedDoctor.userId.firstName} ${selectedDoctor.userId.lastName}` 
                        : 'Unknown Doctor'}
                    </h3>
                    <p className="doctor-modal-title">{selectedDoctor.education?.[0]?.degree || 'No degree specified'}</p>
                    <p className="doctor-modal-specialty">{selectedDoctor.specialization || 'No specialization specified'}</p>
                    {selectedDoctor.experience && (
                      <p className="doctor-modal-experience">{selectedDoctor.experience} years experience</p>
                    )}
                    {selectedDoctor.consultationFee && (
                      <p className="doctor-modal-fee">${selectedDoctor.consultationFee} consultation</p>
                    )}
                    <p className="doctor-modal-profile">{selectedDoctor.bio || 'No bio available'}</p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default DoctorListPage;