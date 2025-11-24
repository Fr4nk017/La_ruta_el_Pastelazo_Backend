import Order from '../models/order.js';
import Cart from '../models/cart.js';
import Product from '../models/product.js';
import { AppError } from '../middlewares/errorHandler.js';

// Crear orden a partir del carrito
export const createOrderFromCart = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const cart = await Cart.findOne({ tenantId, userId });
  if (!cart || cart.items.length === 0) return next(new AppError('Carrito vacío', 400));

  // Verificar stock
  const productIds = cart.items.map(i => i.productId);
  const products = await Product.find({ _id: { $in: productIds }, tenantId });
  const productMap = new Map(products.map(p => [p._id.toString(), p]));

  for (const item of cart.items) {
    const p = productMap.get(item.productId.toString());
    if (!p) return next(new AppError(`Producto no disponible: ${item.productId}`, 400));
    if (p.stock < item.quantity) return next(new AppError(`Stock insuficiente para ${p.name}`, 400));
  }

  // Ajustar stock
  for (const item of cart.items) {
    const p = productMap.get(item.productId.toString());
    await p.adjustStock(-item.quantity);
  }

  const orderItems = cart.items.map(item => ({
    productId: item.productId,
    name: item.name,
    quantity: item.quantity,
    unitPrice: item.price,
    lineTotal: item.quantity * item.price
  }));
  const total = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

  const order = await Order.create({
    tenantId,
    userId,
    items: orderItems,
    total,
    currency: 'MXN',
    status: 'pending'
  });

  // Vaciar carrito
  cart.items = [];
  await cart.save();

  res.status(201).json(order);
};

// Listar órdenes del usuario
export const listMyOrders = async (req, res) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const orders = await Order.find({ tenantId, userId }).sort({ createdAt: -1 });
  res.json(orders);
};

// Obtener detalle de orden
export const getOrder = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const order = await Order.findOne({ _id: req.params.id, tenantId, userId });
  if (!order) return next(new AppError('Orden no encontrada', 404));
  res.json(order);
};

// Actualizar estado (admin / seller)
export const updateOrderStatus = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const { status } = req.body;
  const order = await Order.findOne({ _id: req.params.id, tenantId });
  if (!order) return next(new AppError('Orden no encontrada', 404));
  await order.updateStatus(status);
  res.json(order);
};

// Listar todas las órdenes (admin/seller)
export const listAllOrders = async (req, res) => {
  const { tenantId } = req.tenantContext;
  const { page = 1, limit = 20, status } = req.query;
  const filter = { tenantId };
  if (status) filter.status = status;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Order.countDocuments(filter)
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};
