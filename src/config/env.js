require('dotenv').config();

/**
 * Configuración centralizada de variables de entorno
 */
module.exports = {
  // Server
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Database
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-multitenant',
  
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'default-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS
  // Permite múltiples orígenes separados por coma, útil para Vercel + localhost
  // Ejemplo en .env: CORS_ORIGIN=https://tu-frontend.vercel.app,http://localhost:5173
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
};

