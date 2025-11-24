import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

/**
 * Genera un JWT token con la información del usuario
 * 
 * @param {Object} payload - Datos a incluir en el token (id, tenantId, roleId)
 * @param {String} secret - Secreto para firmar el token
 * @param {String} expiresIn - Tiempo de expiración (ej: '24h', '7d')
 * @returns {String} Token JWT firmado
 */
export function signToken(payload, secret, expiresIn = '24h') {
  if (!secret) {
    throw new Error('JWT_SECRET no está definido');
  }
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Middleware de autenticación JWT
 * Verifica el token y extrae la información del usuario
 * Inyecta req.user con: { id, tenantId, roleId }
 */
export function auth(req, res, next) {
  try {
    // Obtener token del header Authorization
    const header = req.headers.authorization || '';
    
    if (!header.startsWith('Bearer ')) {
      throw new AppError('Token no proporcionado. Use: Authorization: Bearer <token>', 401);
    }
    
    const token = header.slice(7).trim();
    
    if (!token) {
      throw new AppError('Token requerido', 401);
    }
    
    // Verificar y decodificar el token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET no está configurado en las variables de entorno');
    }
    
    const decoded = jwt.verify(token, secret);
    
    // Inyectar información del usuario en la request
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      roleId: decoded.roleId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    // Los errores de JWT ya tienen nombres específicos que maneja errorHandler
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return next(error);
    }
    
    // Otros errores
    next(error);
  }
}

/**
 * Middleware opcional de autenticación
 * No lanza error si no hay token, pero si hay token lo valida
 * Útil para rutas que pueden funcionar con o sin autenticación
 */
export function optionalAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    
    if (!header.startsWith('Bearer ')) {
      // No hay token, continuar sin autenticar
      return next();
    }
    
    const token = header.slice(7).trim();
    
    if (!token) {
      return next();
    }
    
    const secret = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, secret);
    
    req.user = {
      id: decoded.id,
      tenantId: decoded.tenantId,
      roleId: decoded.roleId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    // Si el token es inválido, continuar sin autenticar
    // (o puedes optar por lanzar error)
    next();
  }
}

// Alias para compatibilidad
export const authMiddleware = auth;

export default {
  signToken,
  auth,
  authMiddleware,
  optionalAuth
};
 