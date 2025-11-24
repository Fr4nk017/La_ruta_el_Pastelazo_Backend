#!/usr/bin/env node

/**
 * Script de prueba para verificar la conexión a MongoDB
 * Ejecutar con: node test-connection.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const testConnection = async () => {
  console.log('🔍 Probando conexión a MongoDB...\n');
  
  const mongoURI = process.env.MONGO_URI;
  
  console.log('📌 Configuración:');
  console.log(`   - MONGO_URI definida: ${mongoURI ? '✅ Sí' : '❌ No'}`);
  console.log(`   - URI (parcial): ${mongoURI ? mongoURI.substring(0, 50) + '...' : 'N/A'}`);
  console.log(`   - NODE_ENV: ${process.env.NODE_ENV || 'no definido'}`);
  console.log(`   - PORT: ${process.env.PORT || 'no definido'}`);
  console.log();

  if (!mongoURI) {
    console.error('❌ MONGO_URI no está definida en .env');
    process.exit(1);
  }

  try {
    console.log('⏳ Conectando a MongoDB...');
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000, // 10 segundos timeout
    });
    
    console.log('✅ MongoDB conectado exitosamente!');
    console.log(`📦 Base de datos: ${mongoose.connection.name}`);
    console.log(`🔗 Host: ${mongoose.connection.host}`);
    console.log(`🔌 Estado: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    
    // Probar una operación simple
    console.log('\n⏳ Probando operación en la base de datos...');
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`✅ Colecciones encontradas: ${collections.length}`);
    if (collections.length > 0) {
      console.log('   Colecciones:', collections.map(c => c.name).join(', '));
    }
    
    await mongoose.connection.close();
    console.log('\n✅ Prueba completada exitosamente!');
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Error al conectar a MongoDB:');
    console.error(`   Tipo: ${error.name}`);
    console.error(`   Mensaje: ${error.message}`);
    
    if (error.message.includes('IP')) {
      console.error('\n💡 Solución sugerida:');
      console.error('   1. Ve a MongoDB Atlas → Network Access');
      console.error('   2. Agrega tu IP o permite todas (0.0.0.0/0) para desarrollo');
    }
    
    if (error.message.includes('authentication')) {
      console.error('\n💡 Solución sugerida:');
      console.error('   Verifica que el usuario y contraseña sean correctos');
    }
    
    await mongoose.connection.close();
    process.exit(1);
  }
};

testConnection();
