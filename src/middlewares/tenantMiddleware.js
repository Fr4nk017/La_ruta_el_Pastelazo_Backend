const mongoose = require('mongoose');
const Tenant = require('../models/Tenant');

/**
 * Middleware de extracción y validación de tenant
 * Lee el header x-tenant-id y valida que el tenant existe y está activo
 */
const extractTenant = async (req, res, next) => {
  try {
    // 1. Leer el header x-tenant-id
    const tenantId = req.headers['x-tenant-id'];

    // 2. Verificar que existe
    if (!tenantId) {
      return res.status(400).json({
        message: 'Falta el header x-tenant-id',
        statusCode: 400
      });
    }

    // 3. Validar que sea un ObjectId válido
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      return res.status(400).json({
        message: 'El x-tenant-id no es un ObjectId válido',
        statusCode: 400
      });
    }

    // 4. Buscar el tenant en la base de datos
    const tenant = await Tenant.findById(tenantId);

    // 5. Verificar que existe
    if (!tenant) {
      return res.status(404).json({
        message: 'Tenant no encontrado',
        statusCode: 404
      });
    }

    // 6. Verificar que está activo
    if (!tenant.isActive) {
      return res.status(403).json({
        message: 'Tenant inactivo',
        statusCode: 403
      });
    }

    // 7. Guardar tenant y tenantId en req para uso posterior
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  extractTenant
};

