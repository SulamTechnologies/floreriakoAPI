import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserCart, addToCart } from "@/domain/cart";
import { z } from "zod";

export const OPTIONS = optionsHandler;

const addItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
});

export const GET = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const cart = await getUserCart(user.id);
  return NextResponse.json(cart);
});

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const body = await req.json();
  const parsed = addItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Datos inválidos",
          details: parsed.error.issues,
        },
      },
      { status: 400 },
    );
  }
  const cart = await addToCart(user.id, parsed.data.product_id, parsed.data.quantity);
  return NextResponse.json(cart);
});
