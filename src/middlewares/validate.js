import { z } from 'zod';

/**
 * Middleware para validar datos usando esquemas de Zod
 * @param {z.ZodSchema} schema - Esquema de validación de Zod
 * @returns {Function} Middleware de Express
 */
export const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Validar el body de la petición
      const validatedData = await schema.parseAsync(req.body);
      
      // Reemplazar req.body con los datos validados y sanitizados
      req.body = validatedData;
      
      next();
    } catch (error) {
      // Si es un error de validación de Zod
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          error: 'Error de validación',
          details: errors
        });
      }
      
      // Otro tipo de error
      console.error('Error en validación:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  };
};
