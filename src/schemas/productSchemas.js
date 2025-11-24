import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Nombre es requerido').max(200),
  description: z.string().optional(),
  price: z.number().min(0, 'Precio debe ser mayor o igual a 0'),
  stock: z.number().int().min(0, 'Stock debe ser mayor o igual a 0').default(0),
  category: z.string().optional(),
  imageUrl: z.string().url('URL de imagen inválida').optional(),
  metadata: z.record(z.any()).optional()
});

export const updateProductSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  price: z.number().min(0).optional(),
  stock: z.number().int().min(0).optional(),
  category: z.string().optional(),
  imageUrl: z.string().url('URL de imagen inválida').optional(),
  metadata: z.record(z.any()).optional(),
  isActive: z.boolean().optional()
}).strict();

export const adjustStockSchema = z.object({
  delta: z.number().int('Delta debe ser un entero')
});
