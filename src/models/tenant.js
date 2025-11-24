import mongoose from "mongoose";

/**
 * Modelo Tenant (Inquilino)
 * Representa una tienda o cliente en el sistema multi-tenant
 */
const tenantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del tenant es requerido'],
    trim: true,
    minLength: [3, 'El nombre debe tener al menos 3 caracteres'],
    maxLength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  
  // Identificador único para el tenant (puede ser subdominio, slug, etc.)
  slug: {
    type: String,
    required: [true, 'El slug es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones']
  },
  
  // Dominio personalizado (opcional)
  domain: {
    type: String,
    trim: true,
    lowercase: true,
    sparse: true, // Permite múltiples valores null
    unique: true
  },
  
  // Información de contacto
  contactEmail: {
    type: String,
    required: [true, 'El email de contacto es requerido'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  
  contactPhone: {
    type: String,
    trim: true
  },
  
  // Dirección
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  
  // Estado del tenant
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'suspended', 'trial'],
      message: '{VALUE} no es un estado válido'
    },
    default: 'trial'
  },
  
  // Configuración personalizada del tenant
  settings: {
    currency: {
      type: String,
      default: 'USD',
      uppercase: true
    },
    language: {
      type: String,
      default: 'es',
      lowercase: true
    },
    timezone: {
      type: String,
      default: 'America/Mexico_City'
    },
    // Configuraciones de email, pagos, etc.
    features: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  
  // Plan de suscripción (para futuras expansiones)
  subscription: {
    plan: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: Date,
    isActive: {
      type: Boolean,
      default: true
    }
  },
  
  // Logo y branding
  logo: {
    type: String,
    default: null
  },
  
  // Metadata adicional
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
  
}, {
  timestamps: true, // Agrega createdAt y updatedAt automáticamente
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimizar búsquedas (slug y domain ya tienen unique:true, no duplicar)
tenantSchema.index({ status: 1 });
tenantSchema.index({ 'subscription.plan': 1 });

// Virtual para obtener usuarios del tenant
tenantSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'tenantId'
});

// Método para verificar si el tenant está activo
tenantSchema.methods.isActive = function() {
  return this.status === 'active' && this.subscription.isActive;
};

// Método estático para buscar por slug o domain
tenantSchema.statics.findByIdentifier = async function(identifier) {
  return this.findOne({
    $or: [
      { slug: identifier.toLowerCase() },
      { domain: identifier.toLowerCase() }
    ]
  });
};

// Middleware pre-save: generar slug si no existe
tenantSchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  next();
});

export const Tenant = mongoose.model('Tenant', tenantSchema);
export default Tenant;
