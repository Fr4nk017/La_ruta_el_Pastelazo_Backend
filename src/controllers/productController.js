import Product from '../models/product.js';
import { AppError } from '../middlewares/errorHandler.js';

// Listar productos (público por tenant)
export const listProducts = async (req, res) => {
  const { tenantId } = req.tenantContext;
  const { page = 1, limit = 20, q, category } = req.query;
  const filter = { tenantId };
  if (q) filter.$text = { $search: q };
  if (category) filter.category = category;
  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    Product.countDocuments(filter)
  ]);
  res.json({ items, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
};

// Obtener un producto
export const getProduct = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const product = await Product.findOne({ _id: req.params.id, tenantId });
  if (!product) return next(new AppError('Producto no encontrado', 404));
  res.json(product);
};

// Crear producto (requiere permiso)
export const createProduct = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const data = { ...req.body, tenantId };
  const product = await Product.create(data);
  res.status(201).json(product);
};

// Actualizar producto
export const updateProduct = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const product = await Product.findOneAndUpdate({ _id: req.params.id, tenantId }, req.body, { new: true });
  if (!product) return next(new AppError('Producto no encontrado', 404));
  res.json(product);
};

// Ajustar stock
export const adjustStock = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const { delta } = req.body;
  if (typeof delta !== 'number') return next(new AppError('Delta inválido', 400));
  const product = await Product.findOne({ _id: req.params.id, tenantId });
  if (!product) return next(new AppError('Producto no encontrado', 404));
  await product.adjustStock(delta);
  res.json({ id: product._id, stock: product.stock });
};

// Eliminar producto
export const deleteProduct = async (req, res, next) => {
  const { tenantId } = req.tenantContext;
  const product = await Product.findOneAndDelete({ _id: req.params.id, tenantId });
  if (!product) return next(new AppError('Producto no encontrado', 404));
  res.json({ message: 'Producto eliminado' });
};
