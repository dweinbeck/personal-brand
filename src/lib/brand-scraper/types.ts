import { z } from "zod";

/**
 * Validates the incoming request body from the frontend.
 */
export const scrapeRequestSchema = z.object({
  url: z.string().url(),
});

/**
 * Validates the Fastify POST /scrape response (job submission acknowledgment).
 */
export const scrapeJobSubmissionSchema = z.object({
  job_id: z.string(),
  status: z.string(),
});

/**
 * Validates the Fastify GET /jobs/:id response (job status polling).
 * Uses .passthrough() to avoid breaking on unexpected extra fields.
 * The `status` field uses z.string() (not z.enum()) because the exact
 * values are unconfirmed -- will be tightened in Phase 21.
 */
export const jobStatusSchema = z
  .object({
    job_id: z.string(),
    status: z.string(),
    result: z.unknown().optional(),
    error: z.string().optional(),
    brand_json_url: z.string().optional(),
    assets_zip_url: z.string().optional(),
  })
  .passthrough();

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;
export type ScrapeJobSubmission = z.infer<typeof scrapeJobSubmissionSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
