import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { createCheckoutSession } from "@/lib/billing/stripe";
import { CREDIT_PACKS, creditPackSchema } from "@/lib/billing/types";

export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = creditPackSchema.safeParse(body);
  if (!parsed.success) {
    const validPacks = Object.keys(CREDIT_PACKS).join(", ");
    return Response.json(
      { error: `Invalid pack. Valid packs: ${validPacks}` },
      { status: 400 },
    );
  }

  try {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
    const origin = forwardedHost
      ? `${forwardedProto}://${forwardedHost}`
      : new URL(request.url).origin;
    const url = await createCheckoutSession({
      uid: auth.uid,
      email: auth.email,
      pack: parsed.data.pack,
      successUrl: `${origin}/billing/success`,
      cancelUrl: `${origin}/billing/cancel`,
    });

    return Response.json({ url });
  } catch (error) {
    console.error("POST /api/billing/checkout error:", error);
    return Response.json(
      { error: "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
