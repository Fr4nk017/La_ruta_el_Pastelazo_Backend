const express = require('express');
const cors = require('cors');

const app = express();

// CORS simple
app.use(cors({
  origin: '*',
  credentials: true
}));

// Body Parser
app.use(express.json());

// Health Check simple
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hasMongoUri: !!process.env.MONGODB_URI,
    hasJwtSecret: !!process.env.JWT_SECRET
  });
});

// Ruta raíz
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'La Ruta el Pastelazo - Backend API',
    version: '1.0.0'
  });
});

module.exports = app;
