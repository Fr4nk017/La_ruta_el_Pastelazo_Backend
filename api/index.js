const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const connectDB = require('../config/database');
const errorHandler = require('../middlewares/errorHandler');

// Importar rutas
const authRoutes = require('../routes/authRoutes');
const userRoutes = require('../routes/userRoutes');
const productRoutes = require('../routes/productRoutes');
const orderRoutes = require('../routes/orderRoutes');

const app = express();

// =====================
// Conectar a MongoDB (con caché para Vercel Serverless)
// =====================
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && require('mongoose').connection.readyState === 1) {
    return;
  }

  try {
    await connectDB();
    isConnected = true;
    console.log('✅ Conexión a MongoDB establecida');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error.message);
    isConnected = false;
    throw error;
  }
};

// Middleware para asegurar conexión a DB
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// =====================
// Middlewares Globales
// =====================

// Seguridad con Helmet
app.use(helmet());

// CORS - Simplificado para Vercel
app.use(cors({
  origin: config.CORS_ORIGIN === '*' ? '*' : function(origin, callback) {
    const allowedOrigins = (config.CORS_ORIGIN || '*').split(',').map(o => o.trim());
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Temporalmente aceptar todo mientras configuramos
    }
  },
  credentials: true
}));

// Logger HTTP con Morgan
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body Parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate Limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX_REQUESTS,
  message: 'Demasiadas solicitudes, intenta más tarde'
});
app.use('/api/', limiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: config.NODE_ENV
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Ruta raíz para Vercel
app.get('/', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'La Ruta el Pastelazo - Backend API',
    version: '1.0.0',
    endpoint: 'https://la-ruta-el-pastelazo-backend.vercel.app'
  });
});

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de Errores
app.use(errorHandler);

module.exports = app;
