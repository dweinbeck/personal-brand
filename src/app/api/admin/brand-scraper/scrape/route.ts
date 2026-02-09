export const dynamic = "force-dynamic";

import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { BrandScraperError, submitScrapeJob } from "@/lib/brand-scraper/client";
import { scrapeRequestSchema } from "@/lib/brand-scraper/types";

export async function POST(request: Request) {
  // 1. Auth check — must be first operation
  const auth = await verifyAdmin(request);
  if (!auth.authorized) {
    return unauthorizedResponse(auth);
  }

  // 2. Parse request body as JSON
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  // 3. Validate with Zod
  const parsed = scrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        error: "Invalid request.",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  // 4. Proxy to brand scraper Fastify service
  try {
    const result = await submitScrapeJob(parsed.data.url);
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
