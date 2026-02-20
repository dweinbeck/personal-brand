import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { getAllCaptures, getCaptureCounts } from "@/lib/gsd/capture";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? "50");

  const [captures, counts] = await Promise.all([
    getAllCaptures({ status, limit }),
    getCaptureCounts(),
  ]);

  return Response.json({ captures, counts });
}
