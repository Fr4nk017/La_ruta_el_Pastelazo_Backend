const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile
} = require('../controllers/userController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');
const { updateUserValidator, validate } = require('../utils/validators');

/**
 * @swagger
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Obtener todos los usuarios (Solo Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, trabajador, cliente]
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
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
 *         description: Lista de usuarios obtenida exitosamente
 *       403:
 *         description: No tiene permisos (requiere rol admin)
 *   post:
 *     tags: [Users]
 *     summary: Crear usuario (Solo Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - phone
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@example.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!
 *               phone:
 *                 type: string
 *                 example: +56912345678
 *               role:
 *                 type: string
 *                 enum: [admin, trabajador, cliente]
 *                 example: cliente
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente
 *       403:
 *         description: No tiene permisos (requiere rol admin)
 *       409:
 *         description: Email ya registrado
 */
router.get('/', authenticate, requireRole(['admin']), getUsers);
router.post('/', authenticate, requireRole(['admin']), createUser);

/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     tags: [Users]
 *     summary: Obtener perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil obtenido exitosamente
 *       404:
 *         description: Usuario no encontrado
 *   put:
 *     tags: [Users]
 *     summary: Actualizar perfil del usuario actual
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: Pérez
 *               phone:
 *                 type: string
 *                 example: +56912345678
 *               preferences:
 *                 type: object
 *                 properties:
 *                   newsletter:
 *                     type: boolean
 *                   promotions:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateUserValidator), updateProfile);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Obtener usuario por ID (Solo Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario obtenido exitosamente
 *       404:
 *         description: Usuario no encontrado
 *       403:
 *         description: No tiene permisos
 *   put:
 *     tags: [Users]
 *     summary: Actualizar usuario (Admin o propio perfil)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, trabajador, cliente]
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *               isActive:
 *                 type: boolean
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Usuario actualizado exitosamente
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Usuario no encontrado
 *   delete:
 *     tags: [Users]
 *     summary: Eliminar/Desactivar usuario (Solo Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario desactivado exitosamente
 *       403:
 *         description: No tiene permisos
 *       404:
 *         description: Usuario no encontrado
 */
router.get('/:id', authenticate, requireRole(['admin']), getUserById);
router.put('/:id', authenticate, validate(updateUserValidator), updateUser);
router.delete('/:id', authenticate, requireRole(['admin']), deleteUser);

module.exports = router;