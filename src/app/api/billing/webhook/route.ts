import { applyPurchaseFromStripe } from "@/lib/billing/firestore";
import { constructWebhookEvent } from "@/lib/billing/stripe";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return Response.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  let body: string;
  try {
    body = await request.text();
  } catch {
    return Response.json({ error: "Failed to read body." }, { status: 400 });
  }

  let event: ReturnType<typeof constructWebhookEvent>;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const uid = session.metadata?.uid;
    const email = session.metadata?.email;
    const credits = Number(session.metadata?.credits);

    if (!uid || !email || !credits) {
      console.error("Webhook missing metadata:", session.metadata);
      return Response.json(
        { error: "Missing session metadata." },
        { status: 400 },
      );
    }

    try {
      await applyPurchaseFromStripe({
        uid,
        email,
        stripeSessionId: session.id,
        stripeEventId: event.id,
        usdCents: session.amount_total ?? 0,
        credits,
      });
    } catch (error) {
      console.error("Failed to apply purchase:", error);
      return Response.json(
        { error: "Failed to process purchase." },
        { status: 500 },
      );
    }
  }

  return Response.json({ received: true });
}
