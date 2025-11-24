import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  priceSnapshot: { // Precio del producto al momento de agregarlo
    type: Number,
    required: true,
    min: 0
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  status: {
    type: String,
    enum: ['open', 'converted', 'abandoned'],
    default: 'open'
  },
  total: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  currency: {
    type: String,
    default: 'MXN'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, { timestamps: true });

cartSchema.index({ tenantId: 1, userId: 1, status: 1 });

// Calcular total antes de guardar
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((acc, item) => acc + item.subtotal, 0);
  next();
});

// Método para agregar producto
cartSchema.methods.addItem = async function(product, quantity = 1) {
  const existing = this.items.find(i => i.productId.toString() === product._id.toString());
  if (existing) {
    existing.quantity += quantity;
    existing.subtotal = existing.quantity * existing.priceSnapshot;
  } else {
    this.items.push({
      productId: product._id,
      quantity,
      priceSnapshot: product.price,
      subtotal: product.price * quantity
    });
  }
  return this.save();
};

// Método para actualizar cantidad
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(i => i.productId.toString() === productId.toString());
  if (!item) throw new Error('Item no encontrado en el carrito');
  if (quantity <= 0) {
    this.items = this.items.filter(i => i.productId.toString() !== productId.toString());
  } else {
    item.quantity = quantity;
    item.subtotal = item.quantity * item.priceSnapshot;
  }
  return this.save();
};

// Método para vaciar carrito
cartSchema.methods.clear = async function() {
  this.items = [];
  return this.save();
};

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
