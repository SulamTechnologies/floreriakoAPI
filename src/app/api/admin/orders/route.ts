import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { requireRole } from "@/lib/supabase/auth";
import { getAllOrders } from "@/domain/orders";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export const GET = withErrorHandling(async (req: NextRequest) => {
  await requireRole(req, "admin");
  const orders = await getAllOrders();
  return NextResponse.json(orders);
});
