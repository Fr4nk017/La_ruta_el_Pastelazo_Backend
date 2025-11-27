const mongoose = require('mongoose');

/**
 * Modelo de Orden/Pedido - La Ruta el Pastelazo
 * Adaptado para single-tenant con campos completos del frontend
 */
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'El productId es requerido']
  },
  name: {
    type: String,
    required: [true, 'El nombre del producto es requerido']
  },
  quantity: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [1, 'La cantidad debe ser al menos 1']
  },
  price: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  image: {
    type: String
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El userId es requerido']
  },
  orderNumber: {
    type: String,
    unique: true,
    default: function() {
      return 'PED-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Los items son requeridos'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Debe haber al menos un item en la orden'
    }
  },
  customerInfo: {
    firstName: {
      type: String,
      required: [true, 'El nombre es requerido']
    },
    lastName: {
      type: String,
      required: [true, 'El apellido es requerido']
    },
    email: {
      type: String,
      required: [true, 'El email es requerido']
    },
    phone: {
      type: String,
      required: [true, 'El teléfono es requerido']
    },
    address: {
      type: String,
      required: [true, 'La dirección es requerida']
    },
    comuna: {
      type: String,
      required: [true, 'La comuna es requerida']
    },
    reference: {
      type: String
    }
  },
  deliveryDate: {
    type: Date,
    required: [true, 'La fecha de entrega es requerida']
  },
  deliveryTime: {
    type: String,
    enum: ['manana', 'tarde', 'noche'],
    required: [true, 'El horario de entrega es requerido']
  },
  paymentMethod: {
    type: String,
    enum: ['transferencia', 'efectivo', 'tarjeta'],
    required: [true, 'El método de pago es requerido']
  },
  specialInstructions: {
    type: String
  },
  couponCode: {
    type: String
  },
  total: {
    type: Number,
    required: [true, 'El total es requerido'],
    min: [0, 'El total no puede ser negativo']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Índices para facilitar búsquedas
orderSchema.index({ userId: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ orderNumber: 1 }, { unique: true });
orderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Order', orderSchema);

