const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/productController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/products:
 *   get:
 *     tags: [Products]
 *     summary: Listar productos
 *     description: Obtiene lista de productos con filtros y paginación
 *     parameters:
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Lista de productos obtenida exitosamente
 *   post:
 *     tags: [Products]
 *     summary: Crear producto (Admin/Trabajador)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Torta de Chocolate
 *               description:
 *                 type: string
 *                 example: Deliciosa torta de chocolate artesanal
 *               price:
 *                 type: number
 *                 example: 15990
 *               img:
 *                 type: string
 *                 example: /imagenes/tortas/chocolate.jpg
 *               category:
 *                 type: string
 *                 enum: [clasicas, especiales, frutales, gourmet, clasicos, saludables, veganos, individuales]
 *                 example: clasicas
 *               stock:
 *                 type: number
 *                 example: 10
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 *       403:
 *         description: No tiene permisos (requiere rol admin o trabajador)
 */
// Ruta pública para obtener productos
router.get('/', getProducts);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     tags: [Products]
 *     summary: Obtener producto por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del producto
 *     responses:
 *       200:
 *         description: Producto obtenido exitosamente
 *       404:
 *         description: Producto no encontrado
 */
// Ruta pública para obtener producto por ID
router.get('/:id', getProductById);

// Rutas protegidas que requieren autenticación
router.post('/', authenticate, requireRole(['admin', 'trabajador']), createProduct);
router.put('/:id', authenticate, requireRole(['admin', 'trabajador']), updateProduct);
router.delete('/:id', authenticate, requireRole(['admin']), deleteProduct);

module.exports = router;
