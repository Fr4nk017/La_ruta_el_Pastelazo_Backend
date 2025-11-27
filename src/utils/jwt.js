const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Genera un token JWT para un usuario
 * @param {Object} payload - Datos a incluir en el token (userId, tenantId, role)
 * @returns {String} Token JWT
 */
const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN
  });
};

/**
 * Verifica y decodifica un token JWT
 * @param {String} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
};

module.exports = {
  generateToken,
  verifyToken
};

