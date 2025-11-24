import { z } from 'zod';

export const addToCartSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'ProductId debe ser un ObjectId válido'),
  quantity: z.number().int().min(1, 'Cantidad debe ser al menos 1').default(1)
});

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1, 'Cantidad debe ser al menos 1')
});
