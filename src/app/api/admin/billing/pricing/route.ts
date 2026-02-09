import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { getAllPricing, updateToolPricing } from "@/lib/billing/firestore";
import { pricingUpdateSchema } from "@/lib/billing/types";

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const pricing = await getAllPricing();
    return Response.json({ pricing });
  } catch (error) {
    console.error("GET /api/admin/billing/pricing error:", error);
    return Response.json({ error: "Failed to load pricing." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = pricingUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ error: "Invalid pricing data." }, { status: 400 });
  }

  try {
    await updateToolPricing(parsed.data);
    return Response.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/billing/pricing error:", error);
    return Response.json(
      { error: "Failed to update pricing." },
      { status: 500 },
    );
  }
}
