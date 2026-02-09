import Stripe from "stripe";
import { CREDIT_PACKS } from "./types";

let _stripe: Stripe | undefined;

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
    }
    _stripe = new Stripe(key);
  }
  return _stripe;
}

export async function createCheckoutSession({
  uid,
  email,
  pack,
  successUrl,
  cancelUrl,
}: {
  uid: string;
  email: string;
  pack: keyof typeof CREDIT_PACKS;
  successUrl: string;
  cancelUrl: string;
}): Promise<string> {
  const { credits, usdCents, label } = CREDIT_PACKS[pack];

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: label },
          unit_amount: usdCents,
        },
        quantity: 1,
      },
    ],
    metadata: {
      uid,
      email,
      credits: String(credits),
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL.");
  }

  return session.url;
}

export function constructWebhookEvent(
  body: string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET environment variable is not set.");
  }
  return getStripe().webhooks.constructEvent(body, signature, secret);
}
