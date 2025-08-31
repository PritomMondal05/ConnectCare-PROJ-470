import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MedicineStore.css';

const MedicineStore = () => {
  const [medicines, setMedicines] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load from API
  useEffect(() => {
    const fetchMeds = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/medicines');
        const normalized = (res.data.medicines || []).map(m => ({
          id: m._id,
          name: m.name,
          description: m.description,
          category: m.category,
          price: m.price,
          quantity: m.stockQuantity,
          manufacturer: m.manufacturer,
          expiryDate: m.expiryDate,
          requiresPrescription: m.prescriptionRequired === true
        }));
        setMedicines(normalized);
        setFilteredMedicines(normalized);
      } catch (e) {
        setMedicines([]);
        setFilteredMedicines([]);
      } finally {
        setLoading(false);
      }
    };
    fetchMeds();
  }, []);

  // Search and filter functionality
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMedicines(medicines);
    } else {
      const filtered = medicines.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMedicines(filtered);
    }
  }, [searchTerm, medicines]);

  const getQuantityStatus = (quantity) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 20) return 'low-stock';
    if (quantity <= 50) return 'medium-stock';
    return 'in-stock';
  };

  const getQuantityStatusText = (quantity) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 20) return 'Low Stock';
    if (quantity <= 50) return 'Medium Stock';
    return 'In Stock';
  };

  const getQuantityStatusColor = (quantity) => {
    if (quantity === 0) return '#dc3545';
    if (quantity <= 20) return '#ffc107';
    if (quantity <= 50) return '#fd7e14';
    return '#28a745';
  };

  if (loading) {
    return (
      <section className="medicine-store" id="medicine-store">
        <div className="container">
          <div className="medicine-store__header">
            <h2 className="medicine-store__title">Medicine Store</h2>
            <p className="medicine-store__subtitle">Browse and search our comprehensive medicine collection</p>
          </div>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading medicines...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="medicine-store" id="medicine-store">
      <div className="container">
        <div className="medicine-store__header">
          <div className="store-header-bar">
            <div className="store-brand" onClick={() => (window.location.href = '/') }>
              <img src="/logo/connectcare icon.svg" alt="ConnectCare" className="store-logo" />
              <span className="brand-name">ConnectCare</span>
            </div>
            <button className="back-home-btn" onClick={() => (window.location.href = '/') }>Back to Home</button>
          </div>
          <h2 className="medicine-store__title">Medicine Store</h2>
          <p className="medicine-store__subtitle">Browse and search our comprehensive medicine collection</p>
        </div>

        {/* Search and Filter Section */}
        <div className="medicine-store__search">
          <div className="search-container">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search medicines by name, category, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="search-stats">
              <span className="total-medicines">
                {filteredMedicines.length} of {medicines.length} medicines
              </span>
            </div>
          </div>
        </div>

        {/* Medicine Grid */}
        <div className="medicine-store__grid">
          {filteredMedicines.length === 0 ? (
            <div className="no-results">
              <svg className="no-results-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.172 16.172L4.343 21L3 19.657L7.828 14.828L9.172 16.172ZM19.071 4.929C19.461 5.319 19.461 5.949 19.071 6.339L17.656 7.754L16.242 6.34L17.657 4.925C18.047 4.535 18.677 4.535 19.067 4.925L19.071 4.929ZM19.071 4.929L14.243 9.757L12.828 8.343L17.656 3.515C18.046 3.125 18.676 3.125 19.066 3.515L19.071 4.929Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <h3>No medicines found</h3>
              <p>Try adjusting your search terms or browse all available medicines.</p>
            </div>
          ) : (
            filteredMedicines.map(medicine => (
              <div key={medicine.id} className="medicine-card">
                <div className="medicine-card__header">
                  <div className="medicine-category">{medicine.category}</div>
                  <div 
                    className={`medicine-status ${getQuantityStatus(medicine.quantity)}`}
                    style={{ backgroundColor: getQuantityStatusColor(medicine.quantity) }}
                  >
                    {getQuantityStatusText(medicine.quantity)}
                  </div>
                </div>
                
                <div className="medicine-card__content">
                  <h3 className="medicine-name">{medicine.name}</h3>
                  <p className="medicine-description">{medicine.description}</p>
                  
                  <div className="medicine-details">
                    <div className="medicine-detail">
                      <span className="detail-label">Manufacturer:</span>
                      <span className="detail-value">{medicine.manufacturer}</span>
                    </div>
                    <div className="medicine-detail">
                      <span className="detail-label">Expiry:</span>
                      <span className="detail-value">{new Date(medicine.expiryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="medicine-detail">
                      <span className="detail-label">Quantity:</span>
                      <span className={`detail-value quantity-${getQuantityStatus(medicine.quantity)}`}>
                        {medicine.quantity} units
                      </span>
                    </div>
                  </div>
                </div>

                <div className="medicine-card__footer">
                  <div className="medicine-price">${medicine.price}</div>
                  <div className="medicine-actions">
                    {medicine.requiresPrescription && (
                      <span className="prescription-required">Prescription Required</span>
                    )}
                    <button className="view-details-btn">View Details</button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Stats */}
        <div className="medicine-store__stats">
          <div className="stat-item">
            <div className="stat-number">{medicines.length}</div>
            <div className="stat-label">Total Medicines</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {medicines.filter(m => m.quantity > 0).length}
            </div>
            <div className="stat-label">In Stock</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {medicines.filter(m => m.requiresPrescription).length}
            </div>
            <div className="stat-label">Prescription Required</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">
              {medicines.filter(m => m.quantity <= 20 && m.quantity > 0).length}
            </div>
            <div className="stat-label">Low Stock</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MedicineStore;

