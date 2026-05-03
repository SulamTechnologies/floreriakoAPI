import { z } from "zod";

// Zod v4 z.string().uuid() requires strict RFC 4122 version/variant bits.
// Use format-only regex to accept any UUID-shaped string (including dev seed UUIDs).
const uuidLike = z
  .string()
  .regex(
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/,
    "Formato de UUID inválido",
  );

export const productQuerySchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  per_page: z.coerce.number().int().min(1).max(48).default(12),
});

export const cartItemSchema = z.object({
  product_id: uuidLike,
  quantity: z.number().int().min(1).max(99),
});

export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1),
  address_id: uuidLike.optional(),
});
