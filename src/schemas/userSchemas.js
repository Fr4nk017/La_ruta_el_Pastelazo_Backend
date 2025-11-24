import { z } from 'zod';

/**
 * Schema de validación para registro de usuarios
 */
export const registerSchema = z.object({
  firstName: z
    .string({
      required_error: 'El nombre es requerido',
      invalid_type_error: 'El nombre debe ser texto'
    })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim(),
  
  lastName: z
    .string({
      required_error: 'El apellido es requerido',
      invalid_type_error: 'El apellido debe ser texto'
    })
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .trim(),
  
  email: z
    .string({
      required_error: 'El email es requerido',
      invalid_type_error: 'El email debe ser texto'
    })
    .email('Formato de email inválido')
    .toLowerCase()
    .trim(),
  
  password: z
    .string({
      required_error: 'La contraseña es requerida',
      invalid_type_error: 'La contraseña debe ser texto'
    })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(100, 'La contraseña no puede exceder 100 caracteres')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La contraseña debe contener al menos una mayúscula, una minúscula y un número'
    ),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal(''))
});

/**
 * Schema de validación para login
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'El email es requerido'
    })
    .email('Formato de email inválido')
    .toLowerCase()
    .trim(),
  
  password: z
    .string({
      required_error: 'La contraseña es requerida'
    })
    .min(1, 'La contraseña no puede estar vacía')
});

/**
 * Schema de validación para actualización de perfil
 */
export const updateUserSchema = z.object({
  firstName: z
    .string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede exceder 50 caracteres')
    .trim()
    .optional(),
  
  lastName: z
    .string()
    .min(2, 'El apellido debe tener al menos 2 caracteres')
    .max(50, 'El apellido no puede exceder 50 caracteres')
    .trim()
    .optional(),
  
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Formato de teléfono inválido')
    .optional()
    .or(z.literal(''))
});
