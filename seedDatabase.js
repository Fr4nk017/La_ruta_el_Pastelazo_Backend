/**
 * Script para poblar la base de datos con productos de ejemplo
 * La Ruta el Pastelazo
 */
const mongoose = require('mongoose');
require('dotenv').config();

// Importar modelos
const Product = require('./src/models/Product');
const User = require('./src/models/User');

// Conectar a MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado para seeding');
  } catch (error) {
    console.error('❌ Error conectando MongoDB:', error);
    process.exit(1);
  }
};

// Productos de ejemplo basados en el frontend original
const sampleProducts = [
  {
    name: "Torta Cuadrada de Chocolate",
    description: "Deliciosa torta de chocolate húmeda con cobertura de chocolate intenso.",
    price: 14990,
    img: "/imagenes/tortas/Torta Cuadrada de Chocolate.png",
    category: "clasicas",
    stock: 10,
    isActive: true
  },
  {
    name: "Torta Circular de Vainilla",
    description: "Esponjosa torta de vainilla con suave crema de mantequilla.",
    price: 12990,
    img: "/imagenes/tortas/Torta_Circular_de_Vainilla.png",
    category: "clasicas",
    stock: 8,
    isActive: true
  },
  {
    name: "Torta Circular de Manjar",
    description: "Torta de vainilla rellena con exquisito manjar casero.",
    price: 15990,
    img: "/imagenes/tortas/Torta_Circular _de _Manjar.png",
    category: "clasicas",
    stock: 6,
    isActive: true
  },
  {
    name: "Torta Tres Leches",
    description: "Suave bizcocho empapado en tres tipos de leche con crema chantilly.",
    price: 18990,
    img: "/imagenes/tortas/Torta_Tres_Leches.png",
    category: "especiales",
    stock: 5,
    isActive: true
  },
  {
    name: "Tiramisu Clásico",
    description: "El clásico postre italiano con café, mascarpone y cacao.",
    price: 16990,
    img: "/imagenes/postres/Tiramisu_clasico.png",
    category: "especiales",
    stock: 7,
    isActive: true
  },
  {
    name: "Cheesecake de Frutos Rojos",
    description: "Cremoso cheesecake con salsa de frutos rojos naturales.",
    price: 19990,
    img: "/imagenes/postres/Cheesecake_frutos_rojos.png",
    category: "frutales",
    stock: 4,
    isActive: true
  },
  {
    name: "Torta Cumpleaños Decorada",
    description: "Torta personalizada perfecta para celebraciones especiales.",
    price: 25990,
    img: "/imagenes/tortas/Torta_cumpleanos.png",
    category: "especiales",
    stock: 3,
    isActive: true
  },
  {
    name: "Torta Vegana de Chocolate",
    description: "Deliciosa torta de chocolate 100% vegana, sin ingredientes de origen animal.",
    price: 17990,
    img: "/imagenes/tortas/Torta_vegana_chocolate.png",
    category: "veganos",
    stock: 5,
    isActive: true
  },
  {
    name: "Cheesecake Sin Azúcar",
    description: "Versión saludable del cheesecake, endulzado con stevia natural.",
    price: 16990,
    img: "/imagenes/postres/Cheesecake_sin_azucar.png",
    category: "saludables",
    stock: 6,
    isActive: true
  },
  {
    name: "Mini Tortas Individuales",
    description: "Selección de 6 mini tortas de diferentes sabores.",
    price: 12990,
    img: "/imagenes/tortas/Mini_tortas_individuales.png",
    category: "individuales",
    stock: 10,
    isActive: true
  }
];

// Usuario administrador de ejemplo
const adminUser = {
  firstName: "Francisco",
  lastName: "Administrador",
  email: "admin@larutaelpastelazo.cl",
  password: "admin123", // Se hasheará automáticamente por el middleware
  phone: "+56912345678",
  role: "admin",
  permissions: [
    'view_products', 'place_orders', 'manage_users', 'manage_products', 
    'view_reports', 'manage_system', 'update_prices', 'add_products', 
    'delete_products', 'manage_orders'
  ],
  isActive: true,
  preferences: {
    newsletter: true,
    promotions: true
  }
};

// Usuario trabajador de ejemplo
const workerUser = {
  firstName: "María",
  lastName: "Trabajadora",
  email: "trabajador@larutaelpastelazo.cl",
  password: "trabajador123",
  phone: "+56987654321",
  role: "trabajador",
  permissions: [
    'view_products', 'place_orders', 'manage_orders', 'view_inventory',
    'update_order_status', 'manage_products', 'update_prices', 'add_products'
  ],
  isActive: true,
  preferences: {
    newsletter: true,
    promotions: false
  }
};

// Usuario cliente de ejemplo
const clientUser = {
  firstName: "Carlos",
  lastName: "Cliente",
  email: "cliente@example.com",
  password: "cliente123",
  phone: "+56911223344",
  role: "cliente",
  permissions: ['view_products', 'place_orders', 'view_own_orders', 'update_profile'],
  isActive: true,
  preferences: {
    newsletter: true,
    promotions: true
  }
};

// Función para poblar productos
const seedProducts = async () => {
  try {
    console.log('🌱 Eliminando productos existentes...');
    await Product.deleteMany({});
    
    console.log('🌱 Creando productos de ejemplo...');
    const createdProducts = await Product.insertMany(sampleProducts);
    
    console.log(`✅ ${createdProducts.length} productos creados exitosamente`);
    
    // Mostrar algunos ejemplos
    createdProducts.slice(0, 3).forEach(product => {
      console.log(`   📦 ${product.name} - $${product.price} (${product.category})`);
    });
    
  } catch (error) {
    console.error('❌ Error creando productos:', error);
    throw error;
  }
};

// Función para poblar usuarios
const seedUsers = async () => {
  try {
    console.log('👥 Eliminando usuarios existentes...');
    await User.deleteMany({});
    
    console.log('👥 Creando usuarios de ejemplo...');
    const users = [adminUser, workerUser, clientUser];
    
    for (const userData of users) {
      await User.create(userData);
      console.log(`   ✅ Usuario creado: ${userData.email} (${userData.role})`);
    }
    
  } catch (error) {
    console.error('❌ Error creando usuarios:', error);
    throw error;
  }
};

// Función principal
const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Iniciando población de la base de datos...\n');
    
    await seedUsers();
    console.log('');
    await seedProducts();
    
    console.log('\n🎉 ¡Base de datos poblada exitosamente!');
    console.log('\n📋 Usuarios de prueba:');
    console.log('   👤 Admin: admin@larutaelpastelazo.cl / admin123');
    console.log('   👤 Trabajador: trabajador@larutaelpastelazo.cl / trabajador123');
    console.log('   👤 Cliente: cliente@example.com / cliente123');
    
  } catch (error) {
    console.error('❌ Error poblando base de datos:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Desconectado de MongoDB');
    process.exit(0);
  }
};

// Ejecutar el script si es llamado directamente
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleProducts, adminUser, workerUser, clientUser };