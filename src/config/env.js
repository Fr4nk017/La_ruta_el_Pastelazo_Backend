// Solo cargar dotenv en desarrollo local (Vercel provee variables de entorno directamente)
try {
  if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
  }
} catch (error) {
  // Ignorar si dotenv no está disponible en producción
  console.log('dotenv no disponible, usando variables de entorno del sistema');
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// Construir MONGODB_URI con fail-fast en producción para evitar "localhost" accidental
const localMongoUri = 'mongodb://localhost:27017/ecommerce-multitenant';
const MONGODB_URI = process.env.MONGODB_URI || (isProduction ? '' : localMongoUri);

if (isProduction && !process.env.MONGODB_URI) {
  throw new Error('MONGODB_URI es obligatorio en producción (configúralo en Vercel).');
}

// Dominios permitidos para CORS: incluir localhost + Vercel frontend por defecto
const defaultCorsOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://la-ruta-el-pastelazo-1.vercel.app',
];

const CORS_ORIGIN = process.env.CORS_ORIGIN || defaultCorsOrigins.join(',');

/**
 * Configuración centralizada de variables de entorno
 */
module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV,
  isProduction,
  
  // Database
  MONGODB_URI,
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  // Permite múltiples orígenes separados por coma, útil para Vercel + localhost
  // Ejemplo en .env: CORS_ORIGIN=https://tu-frontend.vercel.app,http://localhost:5173
  CORS_ORIGIN,
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutos
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
};

