import {
  type JobStatus,
  type ScrapeJobSubmission,
  jobStatusSchema,
  scrapeJobSubmissionSchema,
} from "@/lib/brand-scraper/types";

const BRAND_SCRAPER_API_URL = process.env.BRAND_SCRAPER_API_URL;

export class BrandScraperError extends Error {
  constructor(
    message: string,
    public status: number,
    public isTimeout: boolean = false,
  ) {
    super(message);
    this.name = "BrandScraperError";
  }
}

/**
 * Attempts to extract an error message from a non-200 response body.
 * Falls back to a generic message if the body is not JSON or lacks an error field.
 */
async function extractErrorMessage(
  res: Response,
  fallback: string,
): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body?.error === "string") {
      return body.error;
    }
  } catch {
    // Response body is not JSON -- use fallback
  }
  return fallback;
}

/**
 * Submits a URL to the brand scraper Fastify service for processing.
 * Returns the job submission acknowledgment with job_id and initial status.
 * Timeout: 30 seconds (longer than chatbot due to Cloud Run cold starts).
 */
export async function submitScrapeJob(
  url: string,
): Promise<ScrapeJobSubmission> {
  if (!BRAND_SCRAPER_API_URL) {
    throw new BrandScraperError("BRAND_SCRAPER_API_URL not configured", 503);
  }

  let res: Response;
  try {
    res = await fetch(`${BRAND_SCRAPER_API_URL}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ site_url: url }),
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    throw new BrandScraperError(
      isTimeout ? "Request timed out" : "Network error",
      503,
      isTimeout,
    );
  }

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      `Brand scraper returned ${res.status}`,
    );
    throw new BrandScraperError(message, res.status);
  }

  const raw = await res.json();
  const parsed = scrapeJobSubmissionSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BrandScraperError(
      "Invalid response shape from brand scraper",
      502,
    );
  }

  return parsed.data;
}

/**
 * Polls the brand scraper Fastify service for job status.
 * Returns the current job status with optional result data and download URLs.
 * Timeout: 10 seconds (lightweight status check).
 */
export async function getScrapeJobStatus(jobId: string): Promise<JobStatus> {
  if (!BRAND_SCRAPER_API_URL) {
    throw new BrandScraperError("BRAND_SCRAPER_API_URL not configured", 503);
  }

  let res: Response;
  try {
    res = await fetch(`${BRAND_SCRAPER_API_URL}/jobs/${jobId}`, {
      signal: AbortSignal.timeout(10_000),
    });
  } catch (err) {
    const isTimeout =
      err instanceof DOMException && err.name === "TimeoutError";
    throw new BrandScraperError(
      isTimeout ? "Request timed out" : "Network error",
      503,
      isTimeout,
    );
  }

  if (!res.ok) {
    const message = await extractErrorMessage(
      res,
      `Brand scraper returned ${res.status}`,
    );
    throw new BrandScraperError(message, res.status);
  }

  const raw = await res.json();
  const parsed = jobStatusSchema.safeParse(raw);
  if (!parsed.success) {
    throw new BrandScraperError(
      "Invalid response shape from brand scraper",
      502,
    );
  }

  return parsed.data;
}
