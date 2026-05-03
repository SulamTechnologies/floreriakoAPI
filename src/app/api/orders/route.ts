import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserOrders, createOrderFromCart } from "@/domain/orders";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const orders = await getUserOrders(user.id);
  return NextResponse.json(orders);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const result = await createOrderFromCart(user.id);
  return NextResponse.json(result, { status: 201 });
});
