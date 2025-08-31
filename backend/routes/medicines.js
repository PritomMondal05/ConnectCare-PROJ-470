const express = require('express');
const Medicine = require('../models/Medicine');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all medicines with filtering and search
router.get('/', async (req, res) => {
  try {
    const { 
      search, 
      category, 
      prescriptionRequired, 
      minPrice, 
      maxPrice, 
      inStock,
      page = 1, 
      limit = 12 
    } = req.query;
    
    let query = { isActive: true };
    
    // Search functionality
    if (search) {
      query.$text = { $search: search };
    }
    
    // Filter by category
    if (category) {
      query.category = category;
    }
    
    // Filter by prescription requirement
    if (prescriptionRequired !== undefined) {
      query.prescriptionRequired = prescriptionRequired === 'true';
    }
    
    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
    // Filter by stock availability
    if (inStock === 'true') {
      query.stockQuantity = { $gt: 0 };
    }
    
    const medicines = await Medicine.find(query)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ name: 1 });
    
    const total = await Medicine.countDocuments(query);
    
    res.json({
      success: true,
      medicines,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total
    });
  } catch (error) {
    console.error('Get medicines error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching medicines' 
    });
  }
});

// Get medicine by ID
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }
    
    res.json({
      success: true,
      medicine
    });
  } catch (error) {
    console.error('Get medicine error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching medicine' 
    });
  }
});

// Add new medicine (Admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      genericName,
      brand,
      category,
      description,
      dosageForm,
      strength,
      price,
      stockQuantity,
      prescriptionRequired,
      sideEffects,
      contraindications,
      manufacturer,
      expiryDate,
      image,
      tags
    } = req.body;
    
    const newMedicine = new Medicine({
      name,
      genericName,
      brand,
      category,
      description,
      dosageForm,
      strength,
      price,
      stockQuantity,
      prescriptionRequired,
      sideEffects,
      contraindications,
      manufacturer,
      expiryDate,
      image,
      tags
    });
    
    await newMedicine.save();
    
    res.status(201).json({
      success: true,
      message: 'Medicine added successfully',
      medicine: newMedicine
    });
  } catch (error) {
    console.error('Add medicine error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while adding medicine' 
    });
  }
});

// Update medicine (Admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }
    
    // Update fields
    Object.keys(req.body).forEach(key => {
      if (medicine[key] !== undefined) {
        medicine[key] = req.body[key];
      }
    });
    
    await medicine.save();
    
    res.json({
      success: true,
      message: 'Medicine updated successfully',
      medicine
    });
  } catch (error) {
    console.error('Update medicine error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating medicine' 
    });
  }
});

// Update stock quantity
router.patch('/:id/stock', async (req, res) => {
  try {
    const { stockQuantity } = req.body;
    
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }
    
    medicine.stockQuantity = stockQuantity;
    await medicine.save();
    
    res.json({
      success: true,
      message: 'Stock updated successfully',
      stockQuantity: medicine.stockQuantity
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while updating stock' 
    });
  }
});

// Delete medicine (Admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    
    if (!medicine) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medicine not found' 
      });
    }
    
    medicine.isActive = false;
    await medicine.save();
    
    res.json({
      success: true,
      message: 'Medicine deleted successfully'
    });
  } catch (error) {
    console.error('Delete medicine error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while deleting medicine' 
    });
  }
});

// Get medicine categories
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Medicine.distinct('category');
    
    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching categories' 
    });
  }
});

// Get low stock medicines
router.get('/stock/low', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    
    const medicines = await Medicine.find({
      stockQuantity: { $lte: parseInt(threshold) },
      isActive: true
    }).sort({ stockQuantity: 1 });
    
    res.json({
      success: true,
      medicines
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching low stock medicines' 
    });
  }
});

module.exports = router;
