# ConnectCare Backend API

A comprehensive healthcare management system backend built with Node.js, Express, and MongoDB.

## Features

- **User Authentication & Authorization**: JWT-based authentication with role-based access control
- **Doctor Management**: Doctor profiles, specializations, availability, and scheduling
- **Patient Management**: Patient profiles, medical history, and health records
- **Prescription Management**: Digital prescription creation and management
- **Medicine Store**: Complete medicine inventory management
- **Appointment Booking**: Appointment scheduling with conflict detection
- **Database Integration**: Full MongoDB integration with Mongoose ODM

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## Installation

1. Clone the repository and navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
```env
MONGO_URI=mongodb://localhost:27017/connectcare
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=5000
NODE_ENV=development
```

4. Start the server:
```bash
npm run server
```

5. (Optional) Seed the database with sample data:
```bash
npm run seed
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Doctors

- `GET /api/doctors` - Get all doctors (with filtering)
- `GET /api/doctors/:id` - Get doctor by ID
- `GET /api/doctors/:id/appointments` - Get doctor's appointments
- `PUT /api/doctors/:id/availability` - Update doctor availability
- `GET /api/doctors/:id/stats` - Get doctor statistics
- `GET /api/doctors/specializations/list` - Get all specializations

### Medicines

- `GET /api/medicines` - Get all medicines (with filtering and search)
- `GET /api/medicines/:id` - Get medicine by ID
- `POST /api/medicines` - Add new medicine (Admin only)
- `PUT /api/medicines/:id` - Update medicine (Admin only)
- `PATCH /api/medicines/:id/stock` - Update medicine stock
- `DELETE /api/medicines/:id` - Delete medicine (Admin only)
- `GET /api/medicines/categories/list` - Get medicine categories
- `GET /api/medicines/stock/low` - Get low stock medicines

### Prescriptions

- `POST /api/prescriptions` - Create new prescription
- `GET /api/prescriptions/patient/:patientId` - Get patient's prescriptions
- `GET /api/prescriptions/doctor/:doctorId` - Get doctor's prescriptions
- `GET /api/prescriptions/:id` - Get prescription by ID
- `PUT /api/prescriptions/:id` - Update prescription
- `PATCH /api/prescriptions/:id/status` - Update prescription status
- `GET /api/prescriptions/stats/overview` - Get prescription statistics

### Appointments

- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/patient/:patientId` - Get patient's appointments
- `GET /api/appointments/doctor/:doctorId` - Get doctor's appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `PUT /api/appointments/:id` - Update appointment
- `PATCH /api/appointments/:id/status` - Update appointment status
- `GET /api/appointments/doctor/:doctorId/available-slots` - Get available time slots
- `GET /api/appointments/stats/overview` - Get appointment statistics

## Database Models

### User
- Basic user information (email, password, name, role)
- Profile data (phone, date of birth, gender, address)
- Role-based access control (admin, doctor, patient)

### Doctor
- Specialization and license information
- Experience, education, and certifications
- Availability schedule and consultation fees
- Rating and review system

### Patient
- Medical information (blood group, height, weight)
- Emergency contact details
- Medical history and allergies
- Current medications and insurance

### Medicine
- Complete medicine information (name, brand, category)
- Dosage forms, strength, and pricing
- Stock management and prescription requirements
- Side effects and contraindications

### Prescription
- Patient and doctor information
- Diagnosis and symptoms
- Prescribed medications with dosages
- Instructions and follow-up dates

### Appointment
- Patient and doctor scheduling
- Appointment types and status tracking
- Virtual appointment support
- Conflict detection and time slot management

## Sample Data

The seed script creates:

- **Admin User**: admin@connectcare.com / admin123
- **Sample Doctors**:
  - Dr. Sarah Johnson (Cardiology)
  - Dr. Michael Chen (Family Medicine)
  - Dr. Emma Wilson (Pediatrics)
- **Sample Patients**:
  - John Doe, Jane Smith, Robert Brown
- **Sample Medicines**: Paracetamol, Ibuprofen, Amoxicillin, Vitamin D3, Omeprazole

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/connectcare` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key-change-in-production` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment mode | `development` |

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Helmet security headers

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Development

- **Hot Reload**: Uses nodemon for automatic server restart
- **Logging**: Morgan HTTP request logging
- **Compression**: Response compression for better performance
- **Validation**: Express-validator for input validation

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong JWT secret
3. Configure MongoDB Atlas or production database
4. Set up proper CORS origins
5. Configure environment variables securely

## API Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {} // Response data
}
```

## Contributing

1. Follow the existing code structure
2. Add proper error handling
3. Include input validation
4. Update documentation for new endpoints
5. Test thoroughly before submitting

## License

This project is part of the ConnectCare healthcare management system.
