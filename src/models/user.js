import mongoose from "mongoose";

/**
 * Modelo User (Usuario)
 * Usuarios del sistema asociados a un tenant específico
 */
const userSchema = new mongoose.Schema({
  // Relación con Tenant (obligatorio para multi-tenant)
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'El tenantId es requerido'],
    index: true
  },
  
  // Relación con Role
  roleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: [true, 'El roleId es requerido'],
    index: true
  },
  
  firstName: {
    type: String,
    trim: true,
    required: [true, 'El nombre es requerido'],
    minLength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxLength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  
  lastName: {
    type: String,
    trim: true,
    required: [true, 'El apellido es requerido'],
    minLength: [2, 'El apellido debe tener al menos 2 caracteres'],
    maxLength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  
  passwordHash: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    select: false // No incluir en queries por defecto
  },
  
  phone: {
    type: String,
    trim: true,
    required: false,
  },
  
  // Estado del usuario
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Imagen de perfil
  profileImage: {
    type: String,
    required: false,
    default: null
  },
  
  // Fecha del último login
  lastLogin: {
    type: Date,
    default: null
  },
  
  // Metadata adicional
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
  
}, {
  timestamps: true, // createdAt, updatedAt
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      // Nunca devolver passwordHash en JSON
      delete ret.passwordHash;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.passwordHash;
      return ret;
    }
  }
});

// Índice compuesto: email único por tenant (un email puede existir en diferentes tenants)
userSchema.index({ tenantId: 1, email: 1 }, { unique: true });
userSchema.index({ tenantId: 1, phone: 1 }, { unique: true, sparse: true });
userSchema.index({ tenantId: 1, isActive: 1 });
// roleId ya tiene index:true en la definición del schema, no duplicar

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Método para verificar si tiene un permiso específico
userSchema.methods.hasPermission = async function(resource, action) {
  await this.populate('roleId');
  if (!this.roleId || typeof this.roleId.hasPermission !== 'function') {
    return false;
  }
  return this.roleId.hasPermission(resource, action);
};

// Método para actualizar último login
userSchema.methods.updateLastLogin = async function() {
  this.lastLogin = new Date();
  return await this.save();
};

// Middleware para validar que roleId pertenece al mismo tenant
userSchema.pre('save', async function(next) {
  if (this.isModified('roleId') && this.roleId && this.tenantId) {
    const Role = mongoose.model('Role');
    const role = await Role.findById(this.roleId);
    
    if (!role) {
      return next(new Error('El rol especificado no existe'));
    }
    
    if (role.tenantId.toString() !== this.tenantId.toString()) {
      return next(new Error('El rol no pertenece al mismo tenant'));
    }
  }
  next();
});

export const User = mongoose.model("User", userSchema);
export default User;
