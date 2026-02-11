import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";

const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;

/**
 * POST /api/tools/brand-scraper/jobs/{id}/assets/zip
 *
 * Authenticated proxy for on-demand zip creation.
 * Proxies to the backend POST /jobs/:id/assets/zip endpoint.
 * Returns the zip signed URL on success.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  if (!BRAND_SCRAPER_API_URL) {
    return Response.json(
      { error: "Brand scraper service not configured." },
      { status: 503 },
    );
  }

  try {
    const res = await fetch(`${BRAND_SCRAPER_API_URL}/jobs/${id}/assets/zip`, {
      method: "POST",
      signal: AbortSignal.timeout(60_000),
    });

    if (!res.ok) {
      let errorMessage = `Zip creation failed (${res.status})`;
      try {
        const body = await res.json();
        if (typeof body?.error === "string") {
          errorMessage = body.error;
        }
      } catch {
        // Response body is not JSON — use default message
      }
      return Response.json({ error: errorMessage }, { status: res.status });
    }

    return Response.json(await res.json());
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    return Response.json(
      {
        error: isTimeout
          ? "Zip creation timed out."
          : "Failed to reach brand scraper service.",
      },
      { status: 503 },
    );
  }
}
