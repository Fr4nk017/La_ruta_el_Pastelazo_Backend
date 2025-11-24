import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    minLength: 2,
    maxLength: 150
  },
  slug: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug inválido']
  },
  description: {
    type: String,
    trim: true,
    maxLength: 5000
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'MXN',
    uppercase: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    trim: true,
    lowercase: true
  },
  images: [{
    url: { type: String, trim: true },
    alt: { type: String, trim: true }
  }],
  tags: [{ type: String, trim: true, lowercase: true }],
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

// Índice compuesto: slug único dentro del tenant
productSchema.index({ tenantId: 1, slug: 1 }, { unique: true });

// Generar slug si no existe
productSchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
  }
  next();
});

// Método para ajustar stock de forma segura
productSchema.methods.adjustStock = async function(delta) {
  const newStock = this.stock + delta;
  if (newStock < 0) throw new Error('Stock insuficiente');
  this.stock = newStock;
  return this.save();
};

export const Product = mongoose.model('Product', productSchema);
export default Product;
