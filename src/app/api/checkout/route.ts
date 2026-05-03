import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { withErrorHandling } from "@/lib/errors";
import { optionsHandler } from "@/lib/cors";
import { getUserFromRequest } from "@/lib/supabase/auth";
import { getUserCart } from "@/domain/cart";
import { stripe } from "@/lib/stripe";
import { ApiError } from "@/lib/errors";

export function OPTIONS(req: NextRequest) {
  return optionsHandler(req);
}

export const POST = withErrorHandling(async (req: NextRequest) => {
  const user = await getUserFromRequest(req);
  const cart = await getUserCart(user.id);

  if (cart.items.length === 0) {
    throw new ApiError("VALIDATION_ERROR", "El carrito está vacío", 400);
  }

  const frontendUrl = process.env["FRONTEND_URL"] ?? "http://localhost:5173";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    currency: "mxn",
    line_items: cart.items.map((item) => ({
      price_data: {
        currency: "mxn",
        unit_amount: item.unit_price_cents,
        product_data: {
          name: item.product_name,
          ...(item.product_image_url ? { images: [item.product_image_url] } : {}),
        },
      },
      quantity: item.quantity,
    })),
    metadata: {
      user_id: user.id,
    },
    success_url: `${frontendUrl}/checkout/exito?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/checkout`,
    locale: "es",
    payment_method_types: ["card"],
  });

  return NextResponse.json({
    checkout_url: session.url,
    session_id: session.id,
  });
});
