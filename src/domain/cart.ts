import { supabase } from "@/lib/supabase/server";
import { ApiError } from "@/lib/errors";
import type { CartDTO, CartItemDTO } from "@/types/api";

const CART_SELECT = `
  id,
  cart_items (
    id,
    quantity,
    unit_price_cents,
    product_id,
    products ( id, name, image_url, slug )
  )
`;

function mapCart(raw: Record<string, unknown>): CartDTO {
  const rows = Array.isArray(raw["cart_items"]) ? raw["cart_items"] : [];

  const items: CartItemDTO[] = (rows as Record<string, unknown>[]).map((row) => {
    const product = row["products"] as Record<string, unknown> | null;
    const qty = row["quantity"] as number;
    const price = row["unit_price_cents"] as number;
    return {
      id: row["id"] as string,
      product_id: row["product_id"] as string,
      product_name: (product?.["name"] as string) ?? "Producto eliminado",
      product_image_url: (product?.["image_url"] as string | null) ?? null,
      quantity: qty,
      unit_price_cents: price,
      subtotal_cents: qty * price,
    };
  });

  const total_cents = items.reduce((sum, i) => sum + i.subtotal_cents, 0);
  const item_count = items.reduce((sum, i) => sum + i.quantity, 0);

  return { id: raw["id"] as string, items, total_cents, item_count };
}

async function getOrCreateCart(userId: string): Promise<string> {
  const existing = await supabase.from("carts").select("id").eq("user_id", userId).maybeSingle();

  if (existing.data) return existing.data.id as string;

  const created = await supabase.from("carts").insert({ user_id: userId }).select("id").single();

  if (created.error || !created.data) throw ApiError.internal("Error al crear carrito");
  return created.data.id as string;
}

export async function getUserCart(userId: string): Promise<CartDTO> {
  const cartId = await getOrCreateCart(userId);

  const { data, error } = await supabase
    .from("carts")
    .select(CART_SELECT)
    .eq("id", cartId)
    .single();

  if (error || !data) throw ApiError.internal("Error al obtener carrito");
  return mapCart(data as unknown as Record<string, unknown>);
}

export async function addToCart(
  userId: string,
  productId: string,
  quantity: number,
): Promise<CartDTO> {
  const cartId = await getOrCreateCart(userId);

  const { data: product, error: pErr } = await supabase
    .from("products")
    .select("id, price_cents, stock, active")
    .eq("id", productId)
    .eq("active", true)
    .single();

  if (pErr || !product) throw ApiError.notFound("Producto");

  const prod = product as unknown as { price_cents: number; stock: number };
  if (prod.stock < quantity) throw ApiError.insufficientStock("Producto");

  const { data: existing } = await supabase
    .from("cart_items")
    .select("id, quantity")
    .eq("cart_id", cartId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const newQty = (existing as unknown as { quantity: number }).quantity + quantity;
    await supabase
      .from("cart_items")
      .update({ quantity: newQty, unit_price_cents: prod.price_cents })
      .eq("id", (existing as unknown as { id: string }).id);
  } else {
    await supabase.from("cart_items").insert({
      cart_id: cartId,
      product_id: productId,
      quantity,
      unit_price_cents: prod.price_cents,
    });
  }

  return getUserCart(userId);
}

export async function updateCartItem(
  userId: string,
  itemId: string,
  quantity: number,
): Promise<CartDTO> {
  if (quantity <= 0) return removeCartItem(userId, itemId);

  const cartId = await getOrCreateCart(userId);

  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .eq("cart_id", cartId);

  if (error) throw ApiError.internal("Error al actualizar item");
  return getUserCart(userId);
}

export async function removeCartItem(userId: string, itemId: string): Promise<CartDTO> {
  const cartId = await getOrCreateCart(userId);

  await supabase.from("cart_items").delete().eq("id", itemId).eq("cart_id", cartId);

  return getUserCart(userId);
}

export async function mergeCart(
  userId: string,
  guestItems: Array<{ product_id: string; quantity: number }>,
): Promise<CartDTO> {
  for (const item of guestItems) {
    try {
      await addToCart(userId, item.product_id, item.quantity);
    } catch {
      // Skip items that fail (e.g., out of stock) — don't block the merge
    }
  }
  return getUserCart(userId);
}
