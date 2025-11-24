import Cart from '../models/cart.js';
import Product from '../models/product.js';
import { AppError } from '../middlewares/errorHandler.js';

const ensureCart = async (tenantId, userId) => {
  let cart = await Cart.findOne({ tenantId, userId });
  if (!cart) cart = await Cart.create({ tenantId, userId, items: [] });
  return cart;
};

export const getCart = async (req, res) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const cart = await ensureCart(tenantId, userId);
  res.json(cart);
};

export const addToCart = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const { productId, quantity = 1 } = req.body;
  const product = await Product.findOne({ _id: productId, tenantId });
  if (!product) return next(new AppError('Producto no encontrado', 404));
  const cart = await ensureCart(tenantId, userId);
  await cart.addItem({ productId, name: product.name, price: product.price, quantity });
  res.status(201).json(cart);
};

export const updateItemQuantity = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const { quantity } = req.body;
  const productId = req.params.productId;
  const cart = await ensureCart(tenantId, userId);
  await cart.updateItemQuantity(productId, quantity);
  res.json(cart);
};

export const removeItem = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const productId = req.params.productId;
  const cart = await ensureCart(tenantId, userId);
  const itemIndex = cart.items.findIndex(i => i.productId.toString() === productId);
  if (itemIndex === -1) return next(new AppError('Item no encontrado en carrito', 404));
  cart.items.splice(itemIndex, 1);
  await cart.save();
  res.json(cart);
};

export const clearCart = async (req, res) => {
  const { tenantId } = req.tenantContext;
  const userId = req.user.id;
  const cart = await ensureCart(tenantId, userId);
  await cart.clear();
  res.json(cart);
};
