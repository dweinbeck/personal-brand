import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";

const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;

/**
 * POST /api/tools/brand-scraper/jobs/{id}/assets/zip
 *
 * Authenticated proxy for on-demand zip creation and download.
 * 1. Proxies to the backend POST /jobs/:id/assets/zip to trigger creation.
 * 2. Fetches the resulting zip from the signed URL.
 * 3. Streams the zip content back with Content-Disposition: attachment.
 *
 * This avoids cross-origin issues with GCS signed URLs that prevent
 * the browser from triggering a real file download.
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
    // Step 1: Request zip creation from the scraper service
    const createRes = await fetch(
      `${BRAND_SCRAPER_API_URL}/jobs/${id}/assets/zip`,
      {
        method: "POST",
        signal: AbortSignal.timeout(60_000),
      },
    );

    if (!createRes.ok) {
      let errorMessage = `Zip creation failed (${createRes.status})`;
      try {
        const body = await createRes.json();
        if (typeof body?.error === "string") {
          errorMessage = body.error;
        }
      } catch {
        // Response body is not JSON — use default message
      }
      return Response.json(
        { error: errorMessage },
        { status: createRes.status },
      );
    }

    const data = (await createRes.json()) as { zip_url?: string };

    if (!data.zip_url) {
      return Response.json(
        { error: "No zip URL returned from scraper service." },
        { status: 502 },
      );
    }

    // Step 2: Fetch the zip content from the signed URL
    const zipRes = await fetch(data.zip_url, {
      signal: AbortSignal.timeout(60_000),
    });

    if (!zipRes.ok || !zipRes.body) {
      return Response.json(
        { error: `Failed to download zip file (${zipRes.status})` },
        { status: 502 },
      );
    }

    // Step 3: Stream the zip content back to the client
    const contentLength = zipRes.headers.get("Content-Length");
    const headers: Record<string, string> = {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="brand-assets-${id}.zip"`,
    };
    if (contentLength) {
      headers["Content-Length"] = contentLength;
    }

    return new Response(zipRes.body, { status: 200, headers });
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
