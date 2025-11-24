import mongoose from "mongoose";

/**
 * Modelo Role (Rol)
 * Define los roles y permisos dentro de cada tenant
 * Cada tenant tiene sus propios roles
 */
const roleSchema = new mongoose.Schema({
  // Relación con Tenant (obligatorio)
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'El tenantId es requerido'],
    index: true
  },
  
  name: {
    type: String,
    required: [true, 'El nombre del rol es requerido'],
    trim: true,
    minLength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxLength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  
  // Slug para identificación única dentro del tenant
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-_]+$/, 'El slug solo puede contener letras minúsculas, números, guiones y guiones bajos']
  },
  
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  
  // Permisos del rol
  permissions: {
    // Permisos de usuarios
    users: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    
    // Permisos de productos
    products: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
      manageStock: { type: Boolean, default: false }
    },
    
    // Permisos de órdenes
    orders: {
      view: { type: Boolean, default: false },
      viewAll: { type: Boolean, default: false }, // Ver órdenes de todos vs solo propias
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      cancel: { type: Boolean, default: false },
      updateStatus: { type: Boolean, default: false }
    },
    
    // Permisos de roles (solo admins)
    roles: {
      view: { type: Boolean, default: false },
      create: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    
    // Permisos del tenant (configuración)
    tenant: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    
    // Permisos adicionales flexibles
    custom: {
      type: Map,
      of: Boolean,
      default: {}
    }
  },
  
  // Nivel de prioridad (mayor = más privilegios)
  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  
  // Si es un rol del sistema (no editable/eliminable)
  isSystem: {
    type: Boolean,
    default: false
  },
  
  // Estado del rol
  isActive: {
    type: Boolean,
    default: true
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índice compuesto: un tenant no puede tener dos roles con el mismo slug
roleSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
roleSchema.index({ tenantId: 1, name: 1 });
roleSchema.index({ isActive: 1 });

// Virtual para contar usuarios con este rol
roleSchema.virtual('userCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'roleId',
  count: true
});

// Método para verificar si tiene un permiso específico
roleSchema.methods.hasPermission = function(resource, action) {
  if (!this.permissions[resource]) {
    return false;
  }
  return this.permissions[resource][action] === true;
};

// Método para verificar si tiene algún permiso en un recurso
roleSchema.methods.hasAnyPermission = function(resource) {
  if (!this.permissions[resource]) {
    return false;
  }
  return Object.values(this.permissions[resource]).some(value => value === true);
};

// Método estático para crear roles por defecto de un tenant
roleSchema.statics.createDefaultRoles = async function(tenantId) {
  const defaultRoles = [
    {
      tenantId,
      name: 'Administrador',
      slug: 'admin',
      description: 'Acceso completo al sistema',
      isSystem: true,
      priority: 100,
      permissions: {
        users: { view: true, create: true, edit: true, delete: true },
        products: { view: true, create: true, edit: true, delete: true, manageStock: true },
        orders: { view: true, viewAll: true, create: true, edit: true, cancel: true, updateStatus: true },
        roles: { view: true, create: true, edit: true, delete: true },
        tenant: { view: true, edit: true }
      }
    },
    {
      tenantId,
      name: 'Vendedor',
      slug: 'seller',
      description: 'Puede gestionar productos y órdenes',
      isSystem: true,
      priority: 50,
      permissions: {
        users: { view: true, create: false, edit: false, delete: false },
        products: { view: true, create: true, edit: true, delete: false, manageStock: true },
        orders: { view: true, viewAll: true, create: true, edit: true, cancel: false, updateStatus: true },
        roles: { view: true, create: false, edit: false, delete: false },
        tenant: { view: true, edit: false }
      }
    },
    {
      tenantId,
      name: 'Cliente',
      slug: 'customer',
      description: 'Usuario cliente con acceso básico',
      isSystem: true,
      priority: 10,
      permissions: {
        users: { view: false, create: false, edit: false, delete: false },
        products: { view: true, create: false, edit: false, delete: false, manageStock: false },
        orders: { view: true, viewAll: false, create: true, edit: false, cancel: true, updateStatus: false },
        roles: { view: false, create: false, edit: false, delete: false },
        tenant: { view: false, edit: false }
      }
    }
  ];
  
  return await this.insertMany(defaultRoles);
};

// Middleware pre-save: generar slug si no existe
roleSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-_]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
  next();
});

// Evitar eliminar roles del sistema
roleSchema.pre('deleteOne', { document: true, query: false }, function(next) {
  if (this.isSystem) {
    return next(new Error('No se pueden eliminar roles del sistema'));
  }
  next();
});

export const Role = mongoose.model('Role', roleSchema);
export default Role;
