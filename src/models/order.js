import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true }, // snapshot
  quantity: { type: Number, required: true, min: 1 },
  unitPrice: { type: Number, required: true, min: 0 },
  lineTotal: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'MXN' },
  status: {
    type: String,
    enum: ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['none', 'card', 'transfer', 'cash', 'test'],
    default: 'none'
  },
  shippingAddress: {
    fullName: String,
    street: String,
    city: String,
    state: String,
    country: String,
    postalCode: String
  },
  notes: { type: String, trim: true },
  metadata: { type: Map, of: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

orderSchema.index({ tenantId: 1, status: 1 });
orderSchema.index({ tenantId: 1, userId: 1 });

// Método para cambiar estado
orderSchema.methods.updateStatus = async function(newStatus) {
  const valid = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!valid.includes(newStatus)) throw new Error('Estado inválido');
  this.status = newStatus;
  return this.save();
};

export const Order = mongoose.model('Order', orderSchema);
export default Order;
