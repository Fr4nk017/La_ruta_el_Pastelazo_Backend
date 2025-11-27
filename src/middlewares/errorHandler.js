/**
 * Middleware de manejo centralizado de errores
 * Debe ir al final de la cadena de middlewares en app.js
 */
const errorHandler = (err, req, res, next) => {
  // Registrar el error en consola
  console.error('❌ Error capturado:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });

  // Determinar status code
  let statusCode = err.statusCode || err.status || 500;
  let message = err.message || 'Error interno del servidor';
  let details = null;

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Errores de validación';
    details = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Error de casting de Mongoose (ID inválido)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `ID inválido: ${err.value}`;
  }

  // Error de duplicado (clave única)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyPattern)[0];
    message = `El campo ${field} ya existe`;
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // Construir respuesta consistente
  const response = {
    message,
    statusCode
  };

  // Agregar details si existen
  if (details) {
    response.details = details;
  }

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;

