import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { listBillingUsers } from "@/lib/billing/firestore";

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const users = await listBillingUsers();
    return Response.json({ users });
  } catch (error) {
    console.error("GET /api/admin/billing/users error:", error);
    return Response.json({ error: "Failed to list users." }, { status: 500 });
  }
}
