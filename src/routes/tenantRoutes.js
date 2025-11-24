import { Router } from 'express';
import {
  createTenant,
  getAllTenants,
  getTenantById,
  updateTenant,
  updateTenantStatus,
  deleteTenant,
  permanentDeleteTenant,
  getTenantStats
} from '../controllers/tenantController.js';
import { auth } from '../middlewares/auth.js';
import { noTenantRequired, tenantIsolation, requirePermission, verifyTenantUser } from '../middlewares/tenantIsolation.js';

const router = Router();

/**
 * Rutas públicas (sin autenticación)
 */

// Crear nuevo tenant (registro)
router.post('/', noTenantRequired, createTenant);

// Obtener tenant por ID o slug (público para validación)
router.get('/:identifier', noTenantRequired, getTenantById);

/**
 * Rutas protegidas (requieren autenticación)
 * TODO: Implementar super-admin para gestión global de tenants
 */

// Listar todos los tenants (solo super-admin)
// router.get('/', auth, isSuperAdmin, getAllTenants);

// Actualizar tenant (solo admin del tenant)
router.put(
  '/:id',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('tenant', 'edit'),
  updateTenant
);

// Cambiar estado del tenant (solo admin del tenant)
router.patch(
  '/:id/status',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('tenant', 'edit'),
  updateTenantStatus
);

// Obtener estadísticas del tenant (admin del tenant)
router.get(
  '/:id/stats',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('tenant', 'view'),
  getTenantStats
);

// Desactivar tenant (soft delete)
router.delete(
  '/:id',
  auth,
  tenantIsolation(),
  verifyTenantUser,
  requirePermission('tenant', 'edit'),
  deleteTenant
);

// Eliminar permanentemente (solo super-admin)
// router.delete('/:id/permanent', auth, isSuperAdmin, permanentDeleteTenant);

export default router;
