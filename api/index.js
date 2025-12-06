const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../src/config/env');

const app = express();

// =====================
// Modelo de Usuario
// =====================
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, required: true, trim: true },
  role: { type: String, enum: ['admin', 'trabajador', 'cliente'], default: 'cliente' },
  permissions: { type: [String], default: ['view_products', 'place_orders'] },
  isActive: { type: Boolean, default: true },
  preferences: {
    newsletter: { type: Boolean, default: true },
    promotions: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Hash password antes de guardar
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// Método para comparar passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model('User', userSchema);

// =====================
// Modelo de Producto
// =====================
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  img: { type: String, default: '/imagenes/tortas/default.png' },
  category: { 
    type: String, 
    required: true,
    enum: ['clasicas', 'especiales', 'frutales', 'gourmet', 'clasicos', 'saludables', 'veganos', 'individuales']
  },
  stock: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

// =====================
// Utilidades JWT
// =====================
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

// =====================
// Middleware de Autenticación
// =====================
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token inválido' });
  }
};

// =====================
// Conexión a MongoDB
// =====================
let isConnected = false;

const connectToDatabase = async () => {
  if (!config.MONGODB_URI) {
    throw new Error('MONGODB_URI no está definida. Configúrala en el entorno de Vercel.');
  }

  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  try {
    await mongoose.connect(config.MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log(`✅ MongoDB conectado (${config.NODE_ENV})`);
  } catch (error) {
    console.error('❌ Error MongoDB:', error.message);
    isConnected = false;
    throw error;
  }
};

// =====================
// Middlewares
// =====================
app.use(helmet());

// CORS alineado con config/CORS_ORIGIN (permite múltiples dominios separados por coma)
const allowedOrigins = (config.CORS_ORIGIN || '')
  .split(',')
  .map(o => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) {
      return callback(null, true);
    }

    const normalizedOrigin = origin.replace(/\/$/, '');
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    callback(new Error('No permitido por CORS: ' + origin));
  },
  credentials: true,
}));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
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

// =====================
// RUTA PARA POBLAR BD (solo en desarrollo o con clave secreta)
// =====================
app.post('/api/seed', async (req, res) => {
  try {
    // Verificar clave secreta para seguridad
    const { secret } = req.body;
    if (secret !== process.env.SEED_SECRET && process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'No autorizado'
      });
    }

    await connectToDatabase();

    // Productos de ejemplo
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

    // Limpiar productos existentes
    await Product.deleteMany({});
    
    // Insertar productos
    const products = await Product.insertMany(sampleProducts);

    res.json({
      success: true,
      message: 'Base de datos poblada exitosamente',
      productsCreated: products.length
    });
  } catch (error) {
    console.error('Error en seed:', error);
    res.status(500).json({
      success: false,
      message: 'Error poblando base de datos',
      error: error.message
    });
  }
});

// =====================
// RUTAS DE AUTH
// =====================

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { firstName, lastName, email, password, phone, role } = req.body;

    if (!firstName || !lastName || !email || !password || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El email ya está registrado'
      });
    }

    let permissions = ['view_products', 'place_orders'];
    const userRole = role || 'cliente';
    
    if (userRole === 'admin') {
      permissions = ['view_products', 'place_orders', 'manage_users', 'manage_products', 'view_reports', 'manage_system'];
    } else if (userRole === 'trabajador') {
      permissions = ['view_products', 'place_orders', 'manage_orders', 'view_inventory', 'manage_products'];
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      role: userRole,
      permissions,
      isActive: true
    });

    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email,
      permissions: user.permissions
    });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      },
      token
    });
  } catch (error) {
    console.error('Error en register:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Usuario inactivo'
      });
    }

    const token = generateToken({
      userId: user._id,
      role: user.role,
      email: user.email,
      permissions: user.permissions
    });

    res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      },
      token
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
});

// =====================
// RUTAS DE PRODUCTOS
// =====================

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    await connectToDatabase();
    const products = await Product.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({
      success: true,
      products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    await connectToDatabase();
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }
    res.json({
      success: true,
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
});

// POST /api/products (protegido)
app.post('/api/products', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!req.user.permissions.includes('manage_products')) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear productos'
      });
    }

    const product = await Product.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
});

// =====================
// MODELO DE ORDEN
// =====================
const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  img: { type: String }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false, default: null },
  orderNumber: { 
    type: String, 
    unique: true,
    default: function() {
      return 'PED-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true, min: 0 },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  customerInfo: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true }
  },
  deliveryInfo: {
    address: { type: String },
    city: { type: String },
    notes: { type: String }
  },
  paymentMethod: { type: String, default: 'cash' }
}, { timestamps: true });

const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);

// =====================
// RUTAS DE ÓRDENES
// =====================

// POST /api/orders - Crear orden (permite invitados)
app.post('/api/orders', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { items, customerInfo = {}, deliveryInfo, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'La orden debe tener al menos un producto'
      });
    }

    // Normalizar customerInfo: aceptar {name} o {firstName, lastName}
    const customerName = customerInfo.name || [customerInfo.firstName, customerInfo.lastName].filter(Boolean).join(' ').trim();
    if (!customerName || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({
        success: false,
        message: 'Información del cliente incompleta (name/firstName+lastName, email, phone)'
      });
    }

    // Preparar items tomando precios reales del catálogo si se envía productId
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      if (!item.productId && !item.price) {
        return res.status(400).json({
          success: false,
          message: 'Cada item debe tener productId o price'
        });
      }

      let product = null;
      if (item.productId) {
        product = await Product.findById(item.productId).lean();
        if (!product) {
          return res.status(404).json({
            success: false,
            message: `Producto no encontrado: ${item.productId}`
          });
        }
      }

      const price = product ? product.price : item.price;
      const name = product ? product.name : item.name;
      const quantity = item.quantity || 1;

      processedItems.push({
        productId: product ? product._id : undefined,
        name,
        price,
        quantity,
        img: product?.img || item.img
      });

      totalAmount += price * quantity;
    }

    const orderData = {
      items: processedItems,
      totalAmount,
      customerInfo: { ...customerInfo, name: customerName },
      deliveryInfo,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending'
    };

    // Si hay usuario autenticado, agregarlo
    if (req.headers.authorization) {
      try {
        const token = req.headers.authorization.replace('Bearer ', '');
        const decoded = verifyToken(token);
        orderData.userId = decoded.userId;
      } catch (err) {
        // Si el token es inválido, continuar como invitado
      }
    }

    const order = await Order.create(orderData);

    res.status(201).json({
      success: true,
      message: 'Orden creada exitosamente',
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
        status: order.status,
        items: order.items
      }
    });
  } catch (error) {
    console.error('Error creando orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear orden',
      error: error.message
    });
  }
});

// GET /api/orders - Obtener órdenes del usuario
app.get('/api/orders', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    const orders = await Order.find({ userId: req.user.userId })
      .populate('items.productId', 'name img')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error: error.message
    });
  }
});

// GET /api/orders/all - Obtener todas las órdenes (admin/trabajador)
app.get('/api/orders/all', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!req.user.permissions.includes('manage_orders') && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver todas las órdenes'
      });
    }

    const orders = await Order.find()
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'name img')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener órdenes',
      error: error.message
    });
  }
});

// GET /api/orders/:id - Obtener orden por ID
app.get('/api/orders/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const order = await Order.findById(req.params.id)
      .populate('userId', 'firstName lastName email')
      .populate('items.productId', 'name img');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener orden',
      error: error.message
    });
  }
});

// PATCH /api/orders/:id/status - Actualizar estado de orden
app.patch('/api/orders/:id/status', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!req.user.permissions.includes('manage_orders') && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar órdenes'
      });
    }

    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Orden no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado actualizado',
      order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar orden',
      error: error.message
    });
  }
});

// =====================
// RUTAS DE USUARIOS
// =====================

// GET /api/users - Obtener todos los usuarios (admin y trabajador)
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!['admin', 'trabajador'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden ver usuarios'
      });
    }

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message
    });
  }
});

// GET /api/users/profile - Obtener perfil del usuario actual
app.get('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    const user = await User.findById(req.user.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
});

// PUT /api/users/profile - Actualizar perfil del usuario actual
app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    const { firstName, lastName, phone, preferences } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Perfil actualizado',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
});

// GET /api/users/:id - Obtener usuario por ID (admin y trabajador)
app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (!['admin', 'trabajador'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden ver otros usuarios'
      });
    }

    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuario',
      error: error.message
    });
  }
});

// PUT /api/users/:id - Actualizar usuario (admin)
app.put('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden actualizar usuarios'
      });
    }

    const { firstName, lastName, phone, role, permissions, isActive } = req.body;
    
    const updateData = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (role) updateData.role = role;
    if (permissions) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario actualizado',
      user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar usuario',
      error: error.message
    });
  }
});

// DELETE /api/users/:id - Eliminar usuario (admin)
app.delete('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    await connectToDatabase();
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Solo administradores pueden eliminar usuarios'
      });
    }

    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Usuario eliminado'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message
    });
  }
});

// 404
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Ruta no encontrada',
    path: req.originalUrl 
  });
});

module.exports = app;
