import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser
} from "../controllers/userController.js";
import { auth } from "../middlewares/auth.js";
import { tenantIsolation, verifyTenantUser, requirePermission } from "../middlewares/tenantIsolation.js";
import { validate } from "../middlewares/validate.js";
import { loginSchema, registerSchema, updateUserSchema } from "../schemas/userSchemas.js";

const router = Router();

/**
 * Rutas públicas (no requieren autenticación)
 * Requieren tenantIsolation para identificar el tenant
 */

// Registrar nuevo usuario
router.post(
  '/register',
  tenantIsolation(),
  validate(registerSchema),
  registerUser
);

// Iniciar sesión
router.post(
  '/login',
  tenantIsolation(),
  validate(loginSchema),
  loginUser
);

/**
 * Rutas protegidas (requieren autenticación y verificación de tenant)
 */

// Obtener perfil del usuario autenticado
router.get(
  '/profile',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  getUserProfile
);

// Actualizar perfil del usuario autenticado
router.put(
  '/profile',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  validate(updateUserSchema),
  updateUserProfile
);

/**
 * Rutas administrativas (requieren permisos)
 */

// Listar todos los usuarios del tenant
router.get(
  '/',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('users', 'view'),
  getAllUsers
);

// Obtener un usuario específico por ID
router.get(
  '/:id',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('users', 'view'),
  getUserById
);

// Actualizar un usuario (admin)
router.put(
  '/:id',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('users', 'edit'),
  updateUser
);

// Desactivar un usuario (soft delete)
router.delete(
  '/:id',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('users', 'delete'),
  deleteUser
);

export default router;