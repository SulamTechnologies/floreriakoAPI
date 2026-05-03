import { supabase } from "@/lib/supabase/server";
import { ApiError } from "@/lib/errors";
import type { OrderDTO, OrderItemDTO } from "@/types/api";

const ORDER_SELECT = `
  id,
  user_id,
  status,
  total_cents,
  currency,
  stripe_session_id,
  stripe_payment_intent_id,
  created_at,
  order_items (
    id,
    product_id,
    quantity,
    unit_price_cents,
    product_snapshot
  )
`;

function mapOrderItems(raw: Record<string, unknown>[]): OrderItemDTO[] {
  return raw.map((row) => ({
    id: row["id"] as string,
    product_id: row["product_id"] as string,
    quantity: row["quantity"] as number,
    unit_price_cents: row["unit_price_cents"] as number,
    product_snapshot: (row["product_snapshot"] as Record<string, unknown>) ?? {},
  }));
}

function mapOrder(raw: Record<string, unknown>): OrderDTO {
  const rows = Array.isArray(raw["order_items"]) ? raw["order_items"] : [];
  return {
    id: raw["id"] as string,
    status: raw["status"] as OrderDTO["status"],
    total_cents: raw["total_cents"] as number,
    currency: raw["currency"] as string,
    items: mapOrderItems(rows as Record<string, unknown>[]),
    created_at: raw["created_at"] as string,
  };
}

export async function getUserOrders(userId: string): Promise<OrderDTO[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Error al obtener pedidos");

  return (data as unknown as Record<string, unknown>[]).map(mapOrder);
}

export async function getOrderById(orderId: string, userId: string): Promise<OrderDTO> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .eq("user_id", userId)
    .single();

  if (error || !data) throw ApiError.notFound("Pedido");

  return mapOrder(data as unknown as Record<string, unknown>);
}

export async function createOrderFromCart(userId: string): Promise<{ order_id: string }> {
  // Get user's cart
  const { data: cart, error: cartError } = await supabase
    .from("carts")
    .select("id, cart_items ( product_id, quantity )")
    .eq("user_id", userId)
    .single();

  if (cartError || !cart) throw ApiError.notFound("Carrito");

  const cartRaw = cart as unknown as Record<string, unknown>;
  const cartId = cartRaw["id"] as string;
  const cartItems = Array.isArray(cartRaw["cart_items"])
    ? (cartRaw["cart_items"] as Record<string, unknown>[])
    : [];

  if (cartItems.length === 0) {
    throw new ApiError("VALIDATION_ERROR", "El carrito está vacío", 400);
  }

  const items = cartItems.map((item) => ({
    product_id: item["product_id"] as string,
    quantity: item["quantity"] as number,
  }));

  // Call the RPC to create the order
  const { data: rpcData, error: rpcError } = await supabase.rpc("create_order", {
    p_user_id: userId,
    p_items: items,
  });

  if (rpcError) {
    const msg = rpcError.message ?? "";
    if (msg.includes("INSUFFICIENT_STOCK")) {
      throw ApiError.insufficientStock("uno o más productos");
    }
    if (msg.includes("NOT_FOUND")) {
      throw ApiError.notFound("Producto");
    }
    throw ApiError.internal("Error al crear pedido");
  }

  const rpcRows = Array.isArray(rpcData) ? (rpcData as Record<string, unknown>[]) : [];
  const firstRow = rpcRows[0];
  if (!firstRow || !firstRow["order_id"]) {
    throw ApiError.internal("Error al crear pedido: respuesta inesperada");
  }

  const orderId = firstRow["order_id"] as string;

  // Clear cart items
  await supabase.from("cart_items").delete().eq("cart_id", cartId);

  return { order_id: orderId };
}

export interface AdminOrderDTO extends OrderDTO {
  user_email?: string;
  user_id: string;
}

export async function getAllOrders(): Promise<AdminOrderDTO[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });

  if (error) throw ApiError.internal("Error al obtener pedidos");

  const orders = (data as unknown as Record<string, unknown>[]).map((raw) => {
    const order = mapOrder(raw);
    return {
      ...order,
      user_id: raw["user_id"] as string,
    } as AdminOrderDTO;
  });

  // Try to enrich with user emails via admin API
  try {
    const userIds = [...new Set(orders.map((o) => o.user_id))];
    const emailMap = new Map<string, string>();

    await Promise.all(
      userIds.map(async (uid) => {
        const { data: userData } = await supabase.auth.admin.getUserById(uid);
        if (userData?.user?.email) {
          emailMap.set(uid, userData.user.email);
        }
      }),
    );

    return orders.map((order) => ({
      ...order,
      user_email: emailMap.get(order.user_id),
    }));
  } catch {
    // If email enrichment fails, return orders without emails
    return orders;
  }
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderDTO["status"],
): Promise<OrderDTO> {
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", orderId)
    .select(ORDER_SELECT)
    .single();

  if (error || !data) throw ApiError.notFound("Pedido");

  return mapOrder(data as unknown as Record<string, unknown>);
}
