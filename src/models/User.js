const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Modelo de Usuario - La Ruta el Pastelazo
 * Adaptado para single-tenant con campos específicos del frontend
 */
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    select: false // No incluir password en queries por defecto
  },
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'trabajador', 'cliente'],
    default: 'cliente',
    required: [true, 'El rol es requerido']
  },
  permissions: {
    type: [String],
    default: ['view_products', 'place_orders']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  preferences: {
    newsletter: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// El índice único de email ya está declarado en el campo con unique: true

// Middleware: Hashear password antes de guardar
userSchema.pre('save', async function(next) {
  // Solo hashear si el password fue modificado
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

