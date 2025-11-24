import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { tenantIsolation, requirePermission } from '../middlewares/tenantIsolation.js';
import { validate } from '../middlewares/validate.js';
import { createProductSchema, updateProductSchema, adjustStockSchema } from '../schemas/productSchemas.js';
import { listProducts, getProduct, createProduct, updateProduct, adjustStock, deleteProduct } from '../controllers/productController.js';

const router = express.Router({ mergeParams: true });

router.use(tenantIsolation);

// Público (listar y obtener)
router.get('/', listProducts);
router.get('/:id', getProduct);

// Protegido (crear, actualizar, stock, eliminar)
router.post('/', authMiddleware, requirePermission('products', 'create'), validate(createProductSchema), createProduct);
router.put('/:id', authMiddleware, requirePermission('products', 'update'), validate(updateProductSchema), updateProduct);
router.patch('/:id/stock', authMiddleware, requirePermission('products', 'update'), validate(adjustStockSchema), adjustStock);
router.delete('/:id', authMiddleware, requirePermission('products', 'delete'), deleteProduct);

export default router;
