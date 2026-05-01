import { z } from "zod";

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(48).default(12),
});

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  address_id: z.string().uuid().optional(),
});
