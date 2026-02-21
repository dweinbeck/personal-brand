import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { getScrapeJobStatus } from "@/lib/brand-scraper/client";

/**
 * GET /api/tools/brand-scraper/jobs/{id}/download/json
 *
 * Proxies the brand JSON download through our server to avoid CORS issues
 * with GCS signed URLs. Returns the JSON file with Content-Disposition header
 * so the browser triggers a real file download.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  try {
    const job = await getScrapeJobStatus(id);

    if (!job.brand_json_url) {
      return Response.json(
        { error: "Brand JSON not available for this job." },
        { status: 404 },
      );
    }

    const res = await fetch(job.brand_json_url, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      return Response.json(
        { error: `Failed to fetch brand JSON (${res.status})` },
        { status: 502 },
      );
    }

    const content = await res.arrayBuffer();

    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="brand-${id}.json"`,
        "Content-Length": String(content.byteLength),
      },
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    return Response.json(
      {
        error: isTimeout
          ? "Download timed out."
          : "Failed to download brand JSON.",
      },
      { status: 503 },
    );
  }
}
