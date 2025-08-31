import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [medicines, setMedicines] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddMedicineModalOpen, setIsAddMedicineModalOpen] = useState(false);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMedicines, setFilteredMedicines] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [showMessageModal, setShowMessageModal] = useState(false);


  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [medRes, docRes, patRes] = await Promise.all([
          axios.get('/api/medicines'),
          axios.get('/api/doctors'),
          axios.get('/api/patients')
        ]);
        const normalizedMeds = (medRes.data.medicines || []).map(m => ({
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
        setMedicines(normalizedMeds);
        setFilteredMedicines(normalizedMeds);
        setDoctors(docRes.data.doctors || []);
        setPatients(patRes.data.patients || []);
      } catch (e) {
        setMedicines([]);
        setFilteredMedicines([]);
        setDoctors([]);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (searchTerm.trim() === '') setFilteredMedicines(medicines);
    else setFilteredMedicines(medicines.filter(m => (m.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (m.category || '').toLowerCase().includes(searchTerm.toLowerCase())));
  }, [searchTerm, medicines]);

  const [newMedicine, setNewMedicine] = useState({
    name: '',
    description: '',
    category: '',
    price: '',
    quantity: '',
    manufacturer: '',
    expiryDate: '',
    requiresPrescription: false
  });

  // Must match backend enum in models/Medicine.js
  const categories = [
    'antibiotic', 'painkiller', 'vitamin', 'supplement', 'prescription', 'otc', 'other'
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewMedicine(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const payload = {
        name: newMedicine.name,
        category: newMedicine.category,
        description: newMedicine.description,
        price: parseFloat(newMedicine.price),
        stockQuantity: parseInt(newMedicine.quantity || '0', 10),
        manufacturer: newMedicine.manufacturer,
        expiryDate: newMedicine.expiryDate,
        prescriptionRequired: !!newMedicine.requiresPrescription
      };
      if (editingMedicine) {
        await axios.put(`/api/medicines/${editingMedicine.id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post('/api/medicines', payload, { headers: { Authorization: `Bearer ${token}` } });
      }
      const medRes = await axios.get('/api/medicines');
      const normalizedMeds = (medRes.data.medicines || []).map(m => ({
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
      setMedicines(normalizedMeds);
      setFilteredMedicines(normalizedMeds);
      setEditingMedicine(null);
      setNewMedicine({ name: '', description: '', category: '', price: '', quantity: '', manufacturer: '', expiryDate: '', requiresPrescription: false });
      setIsAddMedicineModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save medicine');
    }
  };

  const handleEditMedicine = (medicine) => {
    setEditingMedicine(medicine);
    setNewMedicine({
      name: medicine.name,
      description: medicine.description,
      category: medicine.category,
      price: medicine.price.toString(),
      quantity: medicine.quantity.toString(),
      manufacturer: medicine.manufacturer,
      expiryDate: medicine.expiryDate,
      requiresPrescription: medicine.requiresPrescription
    });
    setIsAddMedicineModalOpen(true);
  };

  const handleDeleteMedicine = async (medicineId) => {
    const token = localStorage.getItem('token');
    if (!window.confirm('Are you sure you want to delete this medicine?')) return;
    try {
      await axios.delete(`/api/medicines/${medicineId}`, { headers: { Authorization: `Bearer ${token}` } });
      setMedicines(prev => prev.filter(med => med.id !== medicineId));
      setFilteredMedicines(prev => prev.filter(med => med.id !== medicineId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete medicine');
    }
  };

  const getQuantityStatus = (quantity) => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= 20) return 'low-stock';
    if (quantity <= 50) return 'medium-stock';
    return 'in-stock';
  };

  const getQuantityStatusColor = (quantity) => {
    if (quantity === 0) return '#dc3545';
    if (quantity <= 20) return '#ffc107';
    if (quantity <= 50) return '#fd7e14';
    return '#28a745';
  };



  const [profileForm, setProfileForm] = useState({ firstName: '', lastName: '', phone: '', address: '' });
  const [editingUser, setEditingUser] = useState(null); // { role: 'doctor'|'patient', data }
  const [editUserForm, setEditUserForm] = useState({ firstName: '', lastName: '', phone: '', address: '', specialization: '', experience: '', bio: '', consultationFee: '', bloodGroup: '', height: '', weight: '' });
  useEffect(() => {
    if (editingUser) {
      const u = editingUser.data.userId || {};
      if (editingUser.role === 'doctor') {
        setEditUserForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          address: u.address || '',
          specialization: editingUser.data.specialization || '',
          experience: editingUser.data.experience ?? '',
          bio: editingUser.data.bio || '',
          consultationFee: editingUser.data.consultationFee ?? '',
          bloodGroup: '',
          height: '',
          weight: ''
        });
      } else {
        setEditUserForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          address: u.address || '',
          specialization: '',
          experience: '',
          bio: '',
          consultationFee: '',
          bloodGroup: editingUser.data.bloodGroup || '',
          height: editingUser.data.height ?? '',
          weight: editingUser.data.weight ?? ''
        });
      }
    }
  }, [editingUser]);
  useEffect(() => {
    if (user) setProfileForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: user.phone || '', address: user.address || '' });
  }, [user]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await axios.put('/api/auth/profile', profileForm, { headers: { Authorization: `Bearer ${token}` } });
      const updatedUser = res.data.user;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      alert('Profile updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile');
    }
  };
  const handleProfileClear = () => setProfileForm({ firstName: '', lastName: '', phone: '', address: '' });

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="container">
          <h1 className="admin-title">Admin Dashboard</h1>
          <p className="admin-subtitle">Manage medicines, users, and system settings</p>
          <div style={{ marginTop: 12 }}>
            <button
              className="add-medicine-btn"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = '/';
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="section-header" style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className={`add-medicine-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
            <button className={`add-medicine-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Doctors & Patients</button>
            <button className={`add-medicine-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>Messages</button>
            <button className={`add-medicine-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Profile</button>
          </div>
        </div>

        {activeTab === 'overview' && (
        <>
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">{medicines.length}</div>
              <div className="stat-label">Total Medicines</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">
                {medicines.filter(m => m.quantity > 0).length}
              </div>
              <div className="stat-label">In Stock</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">
                {medicines.filter(m => m.quantity <= 20 && m.quantity > 0).length}
              </div>
              <div className="stat-label">Low Stock</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-number">
                ${medicines.reduce((sum, med) => sum + (med.price * med.quantity), 0).toFixed(2)}
              </div>
              <div className="stat-label">Total Value</div>
            </div>
          </div>
        </div>

        {/* Medicine Management Section */}
        <div className="medicine-management">
          <div className="section-header">
            <h2>Medicine Management</h2>
            <button 
              className="add-medicine-btn"
              onClick={() => setIsAddMedicineModalOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Add Medicine
            </button>
          </div>

          {/* Search Bar */}
          <div className="search-section">
            <div className="search-input-wrapper">
              <svg className="search-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <input
                type="text"
                placeholder="Search medicines..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </div>

          {/* Medicines Table */}
          <div className="medicines-table">
            <div className="table-header">
              <div className="table-cell">Name</div>
              <div className="table-cell">Category</div>
              <div className="table-cell">Quantity</div>
              <div className="table-cell">Price</div>
              <div className="table-cell">Status</div>
              <div className="table-cell">Actions</div>
            </div>
            
            {filteredMedicines.map(medicine => (
              <div key={medicine.id} className="table-row">
                <div className="table-cell">
                  <div className="medicine-info">
                    <div className="medicine-name">{medicine.name}</div>
                    <div className="medicine-manufacturer">{medicine.manufacturer}</div>
                  </div>
                </div>
                <div className="table-cell">
                  <span className="category-badge">{medicine.category}</span>
                </div>
                <div className="table-cell">
                  <span className={`quantity-badge ${getQuantityStatus(medicine.quantity)}`}>
                    {medicine.quantity}
                  </span>
                </div>
                <div className="table-cell">
                  <span className="price">${medicine.price}</span>
                </div>
                <div className="table-cell">
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getQuantityStatusColor(medicine.quantity) }}
                  >
                    {medicine.quantity === 0 ? 'Out of Stock' : 
                     medicine.quantity <= 20 ? 'Low Stock' : 
                     medicine.quantity <= 50 ? 'Medium Stock' : 'In Stock'}
                  </span>
                </div>
                <div className="table-cell">
                  <div className="action-buttons">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEditMedicine(medicine)}
                    >
                      Edit
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteMedicine(medicine.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        </>
        )}

        {activeTab === 'users' && (
          <div className="medicine-management">
            <div className="section-header">
              <h2>Users</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <h3>Doctors ({doctors.length})</h3>
                <div className="medicines-table">
                  {(doctors || []).map(d => (
                    <div key={d._id} className="table-row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <div className="table-cell">
                        <div className="medicine-info">
                          <div className="medicine-name">{d.userId?.firstName} {d.userId?.lastName}</div>
                          <div className="medicine-manufacturer">{d.specialization}</div>
                        </div>
                      </div>
                                              <div className="table-cell">
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="edit-btn" onClick={() => setShowMessageModal(true)}>Message</button>
                            <button className="delete-btn" onClick={() => setEditingUser({ role: 'doctor', data: d })}>Edit</button>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3>Patients ({patients.length})</h3>
                <div className="medicines-table">
                  {(patients || []).map(p => (
                    <div key={p._id} className="table-row" style={{ gridTemplateColumns: '1fr auto' }}>
                      <div className="table-cell">
                        <div className="medicine-info">
                          <div className="medicine-name">{p.userId?.firstName} {p.userId?.lastName}</div>
                          <div className="medicine-manufacturer">{p.userId?.email}</div>
                        </div>
                      </div>
                                              <div className="table-cell">
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button className="edit-btn" onClick={() => setShowMessageModal(true)}>Message</button>
                            <button className="delete-btn" onClick={() => setEditingUser({ role: 'patient', data: p })}>Edit</button>
                          </div>
                        </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="medicine-management">
            <div className="section-header">
              <h2>Messaging</h2>
              <button className="add-medicine-btn" onClick={() => setShowMessageModal(true)}>
                + Send Message
              </button>
            </div>
            <div className="messages-overview">
              <p>Use the "Send Message" button to compose new messages to doctors or patients.</p>
              <p>Individual message buttons on user cards also open the compose interface.</p>
            </div>
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="medicine-management">
            <div className="section-header">
              <h2>My Profile</h2>
            </div>
            <form onSubmit={handleProfileSave} className="medicine-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name</label>
                  <input value={profileForm.firstName} onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input value={profileForm.lastName} onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone</label>
                  <input value={profileForm.phone} onChange={(e) => setProfileForm(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <input value={profileForm.address} onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={handleProfileClear}>Clear</button>
                <button type="submit" className="submit-btn">Save</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Add/Edit Medicine Modal */}
      {isAddMedicineModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddMedicineModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingMedicine ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              <button 
                className="close-btn"
                onClick={() => setIsAddMedicineModalOpen(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleAddMedicine} className="medicine-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Medicine Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={newMedicine.name}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., Paracetamol 500mg"
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    name="category"
                    value={newMedicine.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={newMedicine.description}
                  onChange={handleInputChange}
                  required
                  placeholder="Describe the medicine and its uses..."
                  rows="3"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input
                    type="number"
                    name="price"
                    value={newMedicine.price}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={newMedicine.quantity}
                    onChange={handleInputChange}
                    required
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Manufacturer *</label>
                  <input
                    type="text"
                    name="manufacturer"
                    value={newMedicine.manufacturer}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g., PharmaCorp"
                  />
                </div>
                <div className="form-group">
                  <label>Expiry Date *</label>
                  <input
                    type="date"
                    name="expiryDate"
                    value={newMedicine.expiryDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="requiresPrescription"
                    checked={newMedicine.requiresPrescription}
                    onChange={handleInputChange}
                  />
                  <span className="checkmark"></span>
                  Requires Prescription
                </label>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setIsAddMedicineModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingMedicine ? 'Update Medicine' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit {editingUser.role === 'doctor' ? 'Doctor' : 'Patient'}</h3>
              <button className="close-btn" onClick={() => setEditingUser(null)}>×</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const token = localStorage.getItem('token');
              try {
                await axios.put(`/api/admin/users/${editingUser.data.userId?._id || editingUser.data.userId}/profile`, editUserForm, { headers: { Authorization: `Bearer ${token}` } });
                alert('User updated');
                setEditingUser(null);
                // refresh users minimally
                const [docRes, patRes] = await Promise.all([axios.get('/api/doctors'), axios.get('/api/patients')]);
                setDoctors(docRes.data.doctors || []);
                setPatients(patRes.data.patients || []);
              } catch (err) {
                alert(err.response?.data?.message || 'Failed to update user');
              }
            }} className="medicine-form">
              <div className="form-row">
                <div className="form-group"><label>First Name</label><input value={editUserForm.firstName} onChange={(e) => setEditUserForm(prev => ({ ...prev, firstName: e.target.value }))} /></div>
                <div className="form-group"><label>Last Name</label><input value={editUserForm.lastName} onChange={(e) => setEditUserForm(prev => ({ ...prev, lastName: e.target.value }))} /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Phone</label><input value={editUserForm.phone} onChange={(e) => setEditUserForm(prev => ({ ...prev, phone: e.target.value }))} /></div>
                <div className="form-group"><label>Address</label><input value={editUserForm.address} onChange={(e) => setEditUserForm(prev => ({ ...prev, address: e.target.value }))} /></div>
              </div>
              {editingUser.role === 'doctor' && (
                <>
                  <div className="form-row">
                    <div className="form-group"><label>Specialization</label><input value={editUserForm.specialization} onChange={(e) => setEditUserForm(prev => ({ ...prev, specialization: e.target.value }))} /></div>
                    <div className="form-group"><label>Experience (years)</label><input type="number" value={editUserForm.experience} onChange={(e) => setEditUserForm(prev => ({ ...prev, experience: e.target.value }))} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Bio</label><input value={editUserForm.bio} onChange={(e) => setEditUserForm(prev => ({ ...prev, bio: e.target.value }))} /></div>
                    <div className="form-group"><label>Consultation Fee</label><input type="number" value={editUserForm.consultationFee} onChange={(e) => setEditUserForm(prev => ({ ...prev, consultationFee: e.target.value }))} /></div>
                  </div>
                </>
              )}
              {editingUser.role === 'patient' && (
                <>
                  <div className="form-row">
                    <div className="form-group"><label>Blood Group</label><input value={editUserForm.bloodGroup} onChange={(e) => setEditUserForm(prev => ({ ...prev, bloodGroup: e.target.value }))} /></div>
                    <div className="form-group"><label>Height (cm)</label><input type="number" value={editUserForm.height} onChange={(e) => setEditUserForm(prev => ({ ...prev, height: e.target.value }))} /></div>
                  </div>
                  <div className="form-row">
                    <div className="form-group"><label>Weight (kg)</label><input type="number" value={editUserForm.weight} onChange={(e) => setEditUserForm(prev => ({ ...prev, weight: e.target.value }))} /></div>
                  </div>
                </>
              )}
              <div className="form-actions"><button type="button" className="cancel-btn" onClick={() => setEditingUser(null)}>Cancel</button><button type="submit" className="submit-btn">Save</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Send Message Modal */}
      {showMessageModal && (
        <div className="modal-overlay" onClick={() => setShowMessageModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Message</h3>
              <button className="close-btn" onClick={() => setShowMessageModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Message functionality is available in the Messages tab.</p>
              <p>You can also use individual message buttons on user cards.</p>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowMessageModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

