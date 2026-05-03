import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getOrderById } from "@/domain/orders";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export const GET = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  const { params } = ctx as { params: { id: string } };
  const user = await getUserFromRequest(req);
  const order = await getOrderById(params.id, user.id);
  return NextResponse.json(order);
});
