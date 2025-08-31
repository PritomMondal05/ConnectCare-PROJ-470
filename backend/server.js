const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const doctorRoutes = require('./routes/doctors');
const medicineRoutes = require('./routes/medicines');
const prescriptionRoutes = require('./routes/prescriptions');
const appointmentRoutes = require('./routes/appointments');
const patientRoutes = require('./routes/patients');
const adminRoutes = require('./routes/admin');
const messageRoutes = require('./routes/messages');

const app = express();

connectDB();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "data:"],
    },
  },
}));
app.use(compression());
app.use(morgan('combined'));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '..', 'resources', 'assets')));
app.use('/Font', express.static(path.join(__dirname, '..', 'resources', 'assets', 'fonts')));
app.use('/logo', express.static(path.join(__dirname, '..', 'resources', 'assets', 'logos')));

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ConnectCare API is running' });
});

// Static data routes (keeping these for landing page)
app.get('/api/testimonials', (req, res) => {
  const testimonials = [
    {
      id: 1,
      name: "Dr. Sarah Johnson",
      role: "Chief Medical Officer",
      organization: "Metro Health System",
      quote: "ConnectCare's AI Copilot has transformed patient interactions by allowing for deeper engagement and ensuring patients feel heard. It enhances care quality, improves clinic efficiency, and prioritizes patient-centered care."
    },
    {
      id: 2,
      name: "Dr. Michael Chen",
      role: "Family Physician", 
      organization: "Community Medical Group",
      quote: "The clinic dictation and documentation process has been revolutionized. ConnectCare's platform seamlessly integrates with our existing systems and significantly reduces administrative burden."
    }
  ];
  res.json(testimonials);
});

app.get('/api/stats', (req, res) => {
  const stats = [
    { id: 1, percentage: '91%', label: 'Excellent patient compliance' },
    { id: 2, percentage: '87%', label: 'Higher patient satisfaction' },
    { id: 3, percentage: '59%', label: 'Improved clinical documentations' },
    { id: 4, percentage: '88%', label: 'Higher provider satisfaction' }
  ];
  res.json(stats);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/messages', messageRoutes);

// Serve React app
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'client', 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});