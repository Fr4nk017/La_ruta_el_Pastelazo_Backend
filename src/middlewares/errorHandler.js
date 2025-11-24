/**
 * Middleware centralizado para manejo de errores
 * Captura todos los errores de la aplicación y devuelve respuestas consistentes
 */

export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true; // Indica que es un error esperado/manejable
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware de manejo de errores global
 * Debe ser el último middleware en server.js
 */
export const errorHandler = (error, req, res, next) => {
  // Si ya se envió una respuesta, delegar al manejador por defecto
  if (res.headersSent) {
    return next(error);
  }

  // Errores de validación de Mongoose
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => ({
      field: err.path,
      message: err.message
    }));
    
    return res.status(400).json({
      error: true,
      message: 'Error de validación',
      details: errors
    });
  }

  // Errores de duplicados de Mongoose (código 11000)
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return res.status(409).json({
      error: true,
      message: `El ${field} ya está en uso`,
      details: { field }
    });
  }

  // Errores de cast de Mongoose (IDs inválidos)
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: true,
      message: `ID inválido: ${error.value}`
    });
  }

  // Errores JWT
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: true,
      message: 'Token inválido'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: true,
      message: 'Token expirado'
    });
  }

  // Errores operacionales personalizados (AppError)
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      error: true,
      message: error.message,
      ...(error.details && { details: error.details })
    });
  }

  // Errores no esperados
  console.error('❌ Error no manejado:', error);
  
  // En producción, no exponer detalles del error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  return res.status(500).json({
    error: true,
    message: 'Error interno del servidor',
    ...(isDevelopment && { 
      stack: error.stack,
      details: error.message 
    })
  });
};

/**
 * Middleware para rutas no encontradas (404)
 * Debe ir antes del errorHandler en server.js
 */
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(
    `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    404
  );
  next(error);
};

/**
 * Wrapper para async functions en controladores
 * Evita tener que usar try/catch en cada controlador
 * 
 * Uso:
 * router.get('/users', asyncHandler(async (req, res) => {
 *   const users = await User.find();
 *   res.json({ data: users });
 * }));
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
