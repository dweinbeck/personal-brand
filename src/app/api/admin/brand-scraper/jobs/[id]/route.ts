export const dynamic = "force-dynamic";

import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import {
  BrandScraperError,
  getScrapeJobStatus,
} from "@/lib/brand-scraper/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Auth check — must be first operation
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  // 2. Extract and validate job ID from route params
  const { id } = await params;
  if (!id) {
    return Response.json({ error: "Missing job ID." }, { status: 400 });
  }

  // 3. Proxy to brand scraper Fastify service
  try {
    const result = await getScrapeJobStatus(id);
    return Response.json(result);
  } catch (err) {
    if (err instanceof BrandScraperError) {
      return Response.json(
        { error: err.message },
        { status: err.status >= 500 ? 502 : err.status },
      );
    }
    return Response.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
