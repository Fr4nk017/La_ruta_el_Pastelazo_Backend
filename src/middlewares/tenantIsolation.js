import Tenant from '../models/tenant.js';
import { AppError } from './errorHandler.js';

/**
 * Middleware para inyectar y validar tenantId
 * 
 * ESTRATEGIA DE TENANT ISOLATION:
 * 
 * 1. El tenantId se extrae de:
 *    - Header personalizado: x-tenant-id (para APIs)
 *    - Subdominio: tenant.dominio.com
 *    - Path parameter: /api/:tenantId/...
 *    - Token JWT (si el usuario ya está autenticado)
 * 
 * 2. Se valida que el tenant existe y está activo
 * 
 * 3. Se inyecta req.tenantId para usar en controladores
 */

/**
 * Extrae tenantId del header x-tenant-id
 */
const getTenantFromHeader = (req) => {
  return req.headers['x-tenant-id'] || null;
};

/**
 * Extrae tenantId del subdominio
 * Ejemplo: si el host es "acme.mitienda.com", extrae "acme"
 */
const getTenantFromSubdomain = (req) => {
  const host = req.headers.host || req.hostname;
  if (!host) return null;
  
  const parts = host.split('.');
  
  // Si tiene al menos 3 partes (subdominio.dominio.com), el primero es el tenant
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Evitar subdominios comunes que no son tenants
    const ignoredSubdomains = ['www', 'api', 'admin', 'app', 'localhost'];
    if (!ignoredSubdomains.includes(subdomain)) {
      return subdomain;
    }
  }
  
  return null;
};

/**
 * Extrae tenantId del path parameter
 * Ejemplo: /api/:tenantSlug/products
 */
const getTenantFromPath = (req) => {
  return req.params.tenantSlug || req.params.tenantId || null;
};

/**
 * Extrae tenantId del usuario autenticado (desde el token JWT)
 */
const getTenantFromUser = (req) => {
  // Si ya se ejecutó el middleware auth, req.user.tenantId estará disponible
  return req.user?.tenantId || null;
};

/**
 * Middleware principal de tenant isolation
 * 
 * Opciones:
 * - required: Si es true, lanza error si no se encuentra tenantId (default: true)
 * - source: De dónde obtener el tenantId ('header', 'subdomain', 'path', 'user', 'auto')
 *           'auto' intenta todas las fuentes en orden (default: 'auto')
 */
export const tenantIsolation = (options = {}) => {
  const { required = true, source = 'auto' } = options;
  
  return async (req, res, next) => {
    try {
      let tenantIdentifier = null;
      
      // Obtener tenantId según la fuente especificada
      switch (source) {
        case 'header':
          tenantIdentifier = getTenantFromHeader(req);
          break;
        case 'subdomain':
          tenantIdentifier = getTenantFromSubdomain(req);
          break;
        case 'path':
          tenantIdentifier = getTenantFromPath(req);
          break;
        case 'user':
          tenantIdentifier = getTenantFromUser(req);
          break;
        case 'auto':
        default:
          // Intentar en orden de prioridad
          tenantIdentifier = getTenantFromUser(req) ||
                           getTenantFromHeader(req) ||
                           getTenantFromPath(req) ||
                           getTenantFromSubdomain(req);
          break;
      }
      
      // Si no se encontró y es requerido, lanzar error
      if (!tenantIdentifier && required) {
        throw new AppError(
          'Tenant no especificado. Proporcione x-tenant-id en headers, use subdominio o autentíquese.',
          400
        );
      }
      
      // Si se encontró, validar que existe y está activo
      if (tenantIdentifier) {
        let tenant;
        
        // Si es un ObjectId válido, buscar por _id, sino por slug/domain
        if (tenantIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
          tenant = await Tenant.findById(tenantIdentifier);
        } else {
          tenant = await Tenant.findByIdentifier(tenantIdentifier);
        }
        
        if (!tenant) {
          throw new AppError(`Tenant '${tenantIdentifier}' no encontrado`, 404);
        }
        
        // Verificar que el tenant está activo
        if (!tenant.isActive()) {
          throw new AppError(
            `Tenant '${tenant.name}' no está activo. Estado: ${tenant.status}`,
            403
          );
        }
        
        // Inyectar tenantId y tenant completo en la request
        req.tenantId = tenant._id;
        req.tenant = tenant;
        
        console.log(`🏢 Tenant: ${tenant.name} (${tenant._id})`);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware para verificar que el usuario pertenece al tenant
 * Debe ejecutarse DESPUÉS de auth y tenantIsolation
 */
export const verifyTenantUser = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      throw new AppError('Usuario no autenticado', 401);
    }
    
    if (!req.tenantId) {
      throw new AppError('Tenant no especificado', 400);
    }
    
    // Verificar que el usuario pertenece al tenant
    const User = (await import('../models/user.js')).default;
    const user = await User.findOne({ 
      _id: req.user.id,
      tenantId: req.tenantId 
    }).populate('roleId');
    
    if (!user) {
      throw new AppError('Usuario no pertenece a este tenant', 403);
    }
    
    if (!user.isActive) {
      throw new AppError('Usuario inactivo', 403);
    }
    
    // Inyectar información completa del usuario
    req.user = {
      id: user._id,
      tenantId: user.tenantId,
      roleId: user.roleId._id,
      role: user.roleId,
      email: user.email,
      fullName: user.fullName
    };
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware para verificar permisos específicos
 * Debe ejecutarse DESPUÉS de auth, tenantIsolation y verifyTenantUser
 * 
 * Uso: requirePermission('products', 'create')
 */
export const requirePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (!req.user?.role) {
        throw new AppError('Información de rol no disponible', 500);
      }
      
      const hasPermission = req.user.role.hasPermission(resource, action);
      
      if (!hasPermission) {
        throw new AppError(
          `No tienes permiso para ${action} en ${resource}`,
          403
        );
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Helper para agregar filtro de tenant a queries de Mongoose
 * 
 * Uso en controladores:
 * const products = await Product.find(withTenantFilter(req, { category: 'electronics' }));
 */
export const withTenantFilter = (req, filter = {}) => {
  if (!req.tenantId) {
    throw new AppError('TenantId no disponible en la request', 500);
  }
  
  return {
    ...filter,
    tenantId: req.tenantId
  };
};

/**
 * Middleware para rutas públicas que no requieren tenant
 * Útil para rutas como registro de tenant, health check, etc.
 */
export const noTenantRequired = tenantIsolation({ required: false });

export default {
  tenantIsolation,
  verifyTenantUser,
  requirePermission,
  withTenantFilter,
  noTenantRequired
};
