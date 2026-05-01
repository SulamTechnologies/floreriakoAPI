import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { updateCartItem, removeCartItem } from "@/domain/cart";
import { z } from "zod";

export const OPTIONS = optionsHandler;

type Ctx = { params: { id: string } };

const updateSchema = z.object({
  quantity: z.number().int().min(0).max(99),
});

export const PATCH = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  const user = await getUserFromRequest(req);
  const { params } = ctx as Ctx;
  const body = await req.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Datos inválidos" } },
      { status: 400 },
    );
  }
  const cart = await updateCartItem(user.id, params.id, parsed.data.quantity);
  return NextResponse.json(cart);
});

export const DELETE = withErrorHandling(async (req: NextRequest, ctx: unknown) => {
  const user = await getUserFromRequest(req);
  const { params } = ctx as Ctx;
  const cart = await removeCartItem(user.id, params.id);
  return NextResponse.json(cart);
});
