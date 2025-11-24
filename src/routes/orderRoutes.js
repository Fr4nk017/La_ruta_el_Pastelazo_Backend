import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { tenantIsolation, requirePermission } from '../middlewares/tenantIsolation.js';
import { validate } from '../middlewares/validate.js';
import { createOrderSchema, updateOrderStatusSchema } from '../schemas/orderSchemas.js';
import { createOrderFromCart, listMyOrders, getOrder, updateOrderStatus, listAllOrders } from '../controllers/orderController.js';

const router = express.Router({ mergeParams: true });
router.use(tenantIsolation);

// Crear orden desde carrito (usuario autenticado)
router.post('/', authMiddleware, validate(createOrderSchema), createOrderFromCart);
router.get('/mine', authMiddleware, listMyOrders);
router.get('/:id', authMiddleware, getOrder);

// Rutas administrativas
router.get('/', authMiddleware, requirePermission('orders', 'list'), listAllOrders);
router.patch('/:id/status', authMiddleware, requirePermission('orders', 'update'), validate(updateOrderStatusSchema), updateOrderStatus);

export default router;
