const mongoose = require('mongoose');

/**
 * Modelo de Producto - La Ruta el Pastelazo
 * Adaptado para single-tenant con campos específicos del frontend
 */
const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  img: {
    type: String,
    required: [true, 'La imagen es requerida'],
    default: '/imagenes/tortas/default.png'
  },
  category: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['clasicas', 'especiales', 'frutales', 'gourmet', 'clasicos', 'saludables', 'veganos', 'individuales'],
    default: 'clasicas'
  },
  stock: {
    type: Number,
    min: [0, 'El stock no puede ser negativo'],
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices para facilitar búsquedas
productSchema.index({ name: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);

