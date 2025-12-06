const mongoose = require('mongoose');
const { MONGODB_URI, NODE_ENV } = require('./env');

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  if (!MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida. Configúrala en el entorno.');
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      // Opciones recomendadas para MongoDB
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB conectado: ${conn.connection.host} (env: ${NODE_ENV})`);

    // Manejo de eventos de la conexión
    mongoose.connection.on('error', (err) => {
      console.error('❌ Error de MongoDB:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  MongoDB desconectado');
    });

  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    throw error; // No usar process.exit en Vercel Serverless
  }
};

module.exports = connectDB;

