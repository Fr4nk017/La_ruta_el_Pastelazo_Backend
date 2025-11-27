const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

/**
 * Middleware de autenticación
 * Verifica el token JWT y agrega la información del usuario a req.user
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        message: 'Token de acceso requerido',
        statusCode: 401
      });
    }

    // Verificar y decodificar token
    const decoded = jwt.verify(token, config.JWT_SECRET);
    
    // Buscar usuario
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        message: 'Usuario no encontrado',
        statusCode: 401
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        message: 'Usuario inactivo',
        statusCode: 403
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      isActive: user.isActive
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token inválido',
        statusCode: 401
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expirado',
        statusCode: 401
      });
    }
    next(error);
  }
};

/**
 * Middleware de autorización por rol
 * @param {Array<string>} allowedRoles - Roles permitidos
 */
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        statusCode: 401
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        message: 'No tienes permisos para acceder a este recurso',
        statusCode: 403
      });
    }

    next();
  };
};

/**
 * Middleware de autorización por permiso
 * @param {string} requiredPermission - Permiso requerido
 */
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        statusCode: 401
      });
    }

    if (!req.user.permissions || !req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({
        message: 'No tienes permisos para realizar esta acción',
        statusCode: 403
      });
    }

    next();
  };
};

/**
 * Middleware opcional de autenticación
 * Similar a authenticate pero no falla si no hay token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return next(); // Continuar sin usuario
    }

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (user && user.isActive) {
      req.user = {
        userId: user._id,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        isActive: user.isActive
      };
    }

    next();
  } catch (error) {
    // Ignorar errores y continuar sin usuario
    next();
  }
};

module.exports = {
  authenticate,
  requireRole,
  requirePermission,
  optionalAuth
};