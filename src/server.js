const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config/env');
const connectDB = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const { swaggerUi, swaggerSpec } = require('./config/swagger');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// =====================
// Conectar a MongoDB
// =====================
connectDB();

// =====================
// Middlewares Globales
// =====================

// Seguridad con Helmet
app.use(helmet());

// CORS
// Permitir múltiples orígenes en desarrollo (React y Vite)
const allowedOrigins = (config.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Permitir requests sin origin (como Postman) o si está en la lista
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    callback(new Error('No permitido por CORS: ' + origin));
  },
  credentials: true
}));

// Logger HTTP con Morgan
if (config.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Formato colorido para desarrollo
} else {
  app.use(morgan('combined')); // Formato Apache para producción
}

// Rate limiting - prevenir ataques de fuerza bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por windowMs
  message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.'
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =====================
// Middleware de Debugging
// =====================
// Log todas las peticiones POST a /api/orders
app.use('/api/orders', (req, res, next) => {
  if (req.method === 'POST') {
    console.log('\n🚀 ================== NEW ORDER REQUEST ==================');
    console.log('📥 Method:', req.method);
    console.log('📥 URL:', req.originalUrl);
    console.log('📥 Headers:', req.headers);
    console.log('📥 Body:', JSON.stringify(req.body, null, 2));
    console.log('🚀 =========================================================\n');
  }
  next();
});

// =====================
// Rutas
// =====================

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '1.2.0-debug'
  });
});

// Test endpoint para verificar que se está recibiendo data correctamente
app.post('/test-order', express.json(), (req, res) => {
  console.log('🧪 TEST ENDPOINT - Received data:');
  console.log(JSON.stringify(req.body, null, 2));
  res.status(200).json({
    success: true,
    message: 'Data received correctly',
    receivedData: req.body
  });
});

// =====================
// Documentación Swagger
// =====================

// Configuración especial para Vercel/producción
const swaggerUiOptions = {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'E-Commerce API Docs',
  swaggerOptions: {
    persistAuthorization: true
  }
};

// Middleware de Swagger UI - Compatible con Vercel
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Endpoint para obtener la especificación JSON
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Ruta 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// =====================
// Manejo de Errores
// =====================
app.use(errorHandler);

// =====================
// Iniciar Servidor
// =====================
const PORT = config.PORT;

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║   🚀 Server running on port ${PORT}                ║
  ║   📦 Environment: ${config.NODE_ENV.padEnd(27)} ║
  ║   🔗 http://localhost:${PORT}                      ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

module.exports = app;

