import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { requireRole } from "@/lib/supabase/auth";
import { updateOrderStatus } from "@/domain/orders";
import { z } from "zod";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

const updateOrderSchema = z.object({
  status: z.enum(["pending", "paid", "shipped", "delivered", "cancelled"]),
});

export const PATCH = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  await requireRole(req, "admin");
  const { params } = ctx as { params: { id: string } };

  const body = await req.json();
  const parsed = updateOrderSchema.parse(body);

  const order = await updateOrderStatus(params.id, parsed.status);
  return NextResponse.json(order);
});
