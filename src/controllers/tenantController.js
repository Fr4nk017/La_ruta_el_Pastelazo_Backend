import { asyncHandler, AppError } from '../middlewares/errorHandler.js';
import Tenant from '../models/tenant.js';
import Role from '../models/role.js';

/**
 * Crear un nuevo tenant
 * POST /api/tenants
 * Público (no requiere autenticación para permitir registro)
 */
export const createTenant = asyncHandler(async (req, res) => {
  const { 
    name, 
    slug, 
    domain, 
    contactEmail, 
    contactPhone, 
    address,
    settings 
  } = req.body;
  
  // Verificar si el slug ya existe
  if (slug) {
    const existing = await Tenant.findOne({ slug: slug.toLowerCase() });
    if (existing) {
      throw new AppError('El slug ya está en uso', 409);
    }
  }
  
  // Verificar si el dominio ya existe
  if (domain) {
    const existingDomain = await Tenant.findOne({ domain: domain.toLowerCase() });
    if (existingDomain) {
      throw new AppError('El dominio ya está en uso', 409);
    }
  }
  
  // Crear el tenant
  const tenant = new Tenant({
    name,
    slug,
    domain,
    contactEmail,
    contactPhone,
    address,
    settings: settings || {},
    status: 'trial' // Los nuevos tenants empiezan en trial
  });
  
  await tenant.save();
  
  // Crear roles por defecto para el tenant
  await Role.createDefaultRoles(tenant._id);
  
  res.status(201).json({
    message: 'Tenant creado exitosamente',
    data: {
      id: tenant._id,
      name: tenant.name,
      slug: tenant.slug,
      domain: tenant.domain,
      contactEmail: tenant.contactEmail,
      status: tenant.status,
      createdAt: tenant.createdAt
    }
  });
});

/**
 * Obtener todos los tenants (con paginación)
 * GET /api/tenants?page=1&limit=10&status=active
 * Requiere autenticación de super-admin (implementar según necesidad)
 */
export const getAllTenants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  
  const filter = {};
  
  if (status) {
    filter.status = status;
  }
  
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { slug: { $regex: search, $options: 'i' } },
      { contactEmail: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [tenants, total] = await Promise.all([
    Tenant.find(filter)
      .select('-metadata -settings.features')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Tenant.countDocuments(filter)
  ]);
  
  res.json({
    data: tenants,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / parseInt(limit))
    }
  });
});

/**
 * Obtener un tenant por ID o slug
 * GET /api/tenants/:identifier
 */
export const getTenantById = asyncHandler(async (req, res) => {
  const { identifier } = req.params;
  
  let tenant;
  
  // Si es un ObjectId válido, buscar por ID
  if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
    tenant = await Tenant.findById(identifier);
  } else {
    // Buscar por slug o domain
    tenant = await Tenant.findByIdentifier(identifier);
  }
  
  if (!tenant) {
    throw new AppError('Tenant no encontrado', 404);
  }
  
  res.json({
    data: tenant
  });
});

/**
 * Actualizar un tenant
 * PUT /api/tenants/:id
 * Requiere ser admin del tenant
 */
export const updateTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  
  // Campos que no se pueden actualizar directamente
  const protectedFields = ['_id', 'createdAt', 'updatedAt'];
  protectedFields.forEach(field => delete updates[field]);
  
  // Si se actualiza el slug, verificar que no exista
  if (updates.slug) {
    const existing = await Tenant.findOne({ 
      slug: updates.slug.toLowerCase(),
      _id: { $ne: id }
    });
    if (existing) {
      throw new AppError('El slug ya está en uso', 409);
    }
  }
  
  // Si se actualiza el dominio, verificar que no exista
  if (updates.domain) {
    const existingDomain = await Tenant.findOne({ 
      domain: updates.domain.toLowerCase(),
      _id: { $ne: id }
    });
    if (existingDomain) {
      throw new AppError('El dominio ya está en uso', 409);
    }
  }
  
  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  if (!tenant) {
    throw new AppError('Tenant no encontrado', 404);
  }
  
  res.json({
    message: 'Tenant actualizado exitosamente',
    data: tenant
  });
});

/**
 * Cambiar estado de un tenant
 * PATCH /api/tenants/:id/status
 * Body: { status: 'active' | 'inactive' | 'suspended' | 'trial' }
 */
export const updateTenantStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  const validStatuses = ['active', 'inactive', 'suspended', 'trial'];
  if (!validStatuses.includes(status)) {
    throw new AppError(`Estado inválido. Debe ser: ${validStatuses.join(', ')}`, 400);
  }
  
  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { status },
    { new: true, runValidators: true }
  );
  
  if (!tenant) {
    throw new AppError('Tenant no encontrado', 404);
  }
  
  res.json({
    message: `Estado del tenant actualizado a '${status}'`,
    data: {
      id: tenant._id,
      name: tenant.name,
      status: tenant.status
    }
  });
});

/**
 * Eliminar un tenant (soft delete)
 * DELETE /api/tenants/:id
 * Cambia el estado a 'inactive' en lugar de eliminar
 */
export const deleteTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tenant = await Tenant.findByIdAndUpdate(
    id,
    { status: 'inactive' },
    { new: true }
  );
  
  if (!tenant) {
    throw new AppError('Tenant no encontrado', 404);
  }
  
  res.json({
    message: 'Tenant desactivado exitosamente',
    data: {
      id: tenant._id,
      name: tenant.name,
      status: tenant.status
    }
  });
});

/**
 * Eliminar permanentemente un tenant (hard delete)
 * DELETE /api/tenants/:id/permanent
 * ⚠️ CUIDADO: Esto elimina el tenant y todos sus datos relacionados
 */
export const permanentDeleteTenant = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tenant = await Tenant.findById(id);
  
  if (!tenant) {
    throw new AppError('Tenant no encontrado', 404);
  }
  
  // Eliminar todos los datos relacionados al tenant
  const User = (await import('../models/user.js')).default;
  await User.deleteMany({ tenantId: id });
  await Role.deleteMany({ tenantId: id });
  // TODO: Eliminar Products, Carts, Orders cuando se creen esos modelos
  
  // Eliminar el tenant
  await Tenant.findByIdAndDelete(id);
  
  res.json({
    message: 'Tenant y todos sus datos eliminados permanentemente',
    data: {
      id: tenant._id,
      name: tenant.name
    }
  });
});

/**
 * Obtener estadísticas de un tenant
 * GET /api/tenants/:id/stats
 */
export const getTenantStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const tenant = await Tenant.findById(id);
  
  if (!tenant) {
    throw new AppError('Tenant no encontrado', 404);
  }
  
  const User = (await import('../models/user.js')).default;
  
  const [totalUsers, activeUsers, totalRoles] = await Promise.all([
    User.countDocuments({ tenantId: id }),
    User.countDocuments({ tenantId: id, isActive: true }),
    Role.countDocuments({ tenantId: id })
  ]);
  
  // TODO: Agregar stats de productos, órdenes, etc cuando existan
  
  res.json({
    data: {
      tenant: {
        id: tenant._id,
        name: tenant.name,
        status: tenant.status
      },
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        roles: totalRoles
        // products: totalProducts,
        // orders: totalOrders,
        // revenue: totalRevenue
      }
    }
  });
});

export default {
  createTenant,
  getAllTenants,
  getTenantById,
  updateTenant,
  updateTenantStatus,
  deleteTenant,
  permanentDeleteTenant,
  getTenantStats
};
