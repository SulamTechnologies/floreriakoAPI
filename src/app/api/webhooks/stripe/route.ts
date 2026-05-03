import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabase } from "@/lib/supabase/server";
import { createOrderFromCart } from "@/domain/orders";

// Stripe requires the raw body — do NOT use withErrorHandling (it calls req.json())
export const POST = async (req: NextRequest): Promise<NextResponse> => {
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (!webhookSecret) {
    console.error("[webhook] Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("[webhook] Signature verification failed:", msg);
    return NextResponse.json({ error: `Webhook error: ${msg}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutCompleted(session);
  }

  return NextResponse.json({ received: true });
};

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.["user_id"];

  if (!userId) {
    console.error("[webhook] checkout.session.completed missing user_id in metadata", session.id);
    return;
  }

  // Idempotency: skip if this session was already processed
  const { data: existing } = await supabase
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();

  if (existing) {
    return;
  }

  try {
    const { order_id } = await createOrderFromCart(userId);

    await supabase
      .from("orders")
      .update({
        status: "paid",
        stripe_session_id: session.id,
        stripe_payment_intent_id:
          typeof session.payment_intent === "string" ? session.payment_intent : null,
      })
      .eq("id", order_id);
  } catch (err) {
    console.error("[webhook] Failed to create order for user", userId, err);
  }
}
