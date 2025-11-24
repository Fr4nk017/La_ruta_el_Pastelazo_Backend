import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('MONGO_URI no está definida en las variables de entorno');
    }

    await mongoose.connect(mongoURI);
    
    console.log('✅ MongoDB conectado exitosamente');
    console.log(`📦 Base de datos: ${mongoose.connection.name}`);
    
  } catch (error) {
    console.error('❌ Error al conectar a MongoDB:', error.message);
    process.exit(1); // Terminar la aplicación si no hay conexión a la BD
  }
};

// Manejar eventos de conexión
mongoose.connection.on('error', (err) => {
  console.error('Error de MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB desconectado');
});

// Cerrar la conexión cuando se termina el proceso
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('Conexión a MongoDB cerrada');
  process.exit(0);
});
