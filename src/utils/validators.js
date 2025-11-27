const Joi = require('joi');

/**
 * Validadores de entrada usando Joi
 */

// Validación para registro de usuario
const registerValidator = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().min(6).required().messages({
    'string.min': 'La contraseña debe tener al menos 6 caracteres',
    'any.required': 'La contraseña es requerida'
  }),
  firstName: Joi.string().required().messages({
    'any.required': 'El nombre es requerido'
  }),
  lastName: Joi.string().required().messages({
    'any.required': 'El apellido es requerido'
  }),
  phone: Joi.string().optional(),
  role: Joi.string().valid('admin', 'customer').optional()
});

// Validación para login
const loginValidator = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'El email es requerido'
  }),
  password: Joi.string().required().messages({
    'any.required': 'La contraseña es requerida'
  })
});

// Validación para crear tenant
const createTenantValidator = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'El nombre del tenant es requerido'
  }),
  slug: Joi.string().lowercase().required().messages({
    'any.required': 'El slug es requerido'
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Email inválido',
    'any.required': 'El email es requerido'
  }),
  domain: Joi.string().optional()
});

// Validación para crear producto
const createProductValidator = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'El nombre del producto es requerido'
  }),
  slug: Joi.string().lowercase().required().messages({
    'any.required': 'El slug es requerido'
  }),
  description: Joi.string().required().messages({
    'any.required': 'La descripción es requerida'
  }),
  price: Joi.number().min(0).required().messages({
    'number.min': 'El precio no puede ser negativo',
    'any.required': 'El precio es requerido'
  }),
  comparePrice: Joi.number().min(0).optional(),
  sku: Joi.string().optional(),
  category: Joi.string().required().messages({
    'any.required': 'La categoría es requerida'
  }),
  tags: Joi.array().items(Joi.string()).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().required(),
      alt: Joi.string().optional(),
      isPrimary: Joi.boolean().optional()
    })
  ).optional(),
  inventory: Joi.object({
    quantity: Joi.number().min(0).required(),
    trackInventory: Joi.boolean().optional(),
    lowStockThreshold: Joi.number().min(0).optional()
  }).optional(),
  status: Joi.string().valid('active', 'draft', 'archived').optional(),
  featured: Joi.boolean().optional()
});

// Validación para añadir item al carrito
const addToCartValidator = Joi.object({
  productId: Joi.string().required().messages({
    'any.required': 'El ID del producto es requerido'
  }),
  quantity: Joi.number().min(1).required().messages({
    'number.min': 'La cantidad debe ser al menos 1',
    'any.required': 'La cantidad es requerida'
  })
});

// Validación para crear orden
const createOrderValidator = Joi.object({
  paymentMethod: Joi.string()
    .valid('credit_card', 'debit_card', 'paypal', 'cash', 'bank_transfer')
    .required().messages({
      'any.required': 'El método de pago es requerido'
    }),
  shippingAddress: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    country: Joi.string().required(),
    phone: Joi.string().required()
  }).required().messages({
    'any.required': 'La dirección de envío es requerida'
  }),
  notes: Joi.string().optional()
});

/**
 * Middleware para validar datos
 * @param {Object} schema - Schema de Joi a usar
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        success: false,
        message: 'Errores de validación',
        errors
      });
    }
    
    next();
  };
};

module.exports = {
  validate,
  registerValidator,
  loginValidator,
  createTenantValidator,
  createProductValidator,
  addToCartValidator,
  createOrderValidator
};

