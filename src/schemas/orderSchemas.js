import { z } from 'zod';

export const updateOrderStatusSchema = z.object({
  status: z.enum(['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

export const createOrderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1, 'Nombre completo es requerido'),
    street: z.string().min(1, 'Calle es requerida'),
    city: z.string().min(1, 'Ciudad es requerida'),
    state: z.string().min(1, 'Estado es requerido'),
    country: z.string().min(1, 'País es requerido'),
    postalCode: z.string().min(1, 'Código postal es requerido')
  }).optional(),
  paymentMethod: z.enum(['none', 'card', 'transfer', 'cash', 'test']).default('none'),
  notes: z.string().max(500).optional()
});
