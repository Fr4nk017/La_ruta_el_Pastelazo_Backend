import express from 'express';
import { authMiddleware } from '../middlewares/auth.js';
import { tenantIsolation } from '../middlewares/tenantIsolation.js';
import { validate } from '../middlewares/validate.js';
import { addToCartSchema, updateCartItemSchema } from '../schemas/cartSchemas.js';
import { getCart, addToCart, updateItemQuantity, removeItem, clearCart } from '../controllers/cartController.js';

const router = express.Router({ mergeParams: true });
router.use(tenantIsolation, authMiddleware);

router.get('/', getCart);
router.post('/items', validate(addToCartSchema), addToCart);
router.put('/items/:productId', validate(updateCartItemSchema), updateItemQuantity);
router.delete('/items/:productId', removeItem);
router.delete('/clear', clearCart);

export default router;
