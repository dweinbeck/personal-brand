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
 * Validates the brand taxonomy returned as the `result` of a completed job.
 * Shape is a best guess (LOW confidence) based on expected scraper output.
 * Uses .passthrough() on all levels to tolerate unexpected extra fields.
 */
export const brandTaxonomySchema = z
  .object({
    colors: z
      .array(
        z.object({
          hex: z.string(),
          rgb: z
            .object({ r: z.number(), g: z.number(), b: z.number() })
            .optional(),
          name: z.string().optional(),
          role: z.string().optional(),
          confidence: z.number(),
          needs_review: z.boolean().optional(),
        }),
      )
      .optional(),
    fonts: z
      .array(
        z.object({
          family: z.string(),
          weights: z.array(z.number()).optional(),
          usage: z.string().optional(),
          source: z.string().optional(),
          confidence: z.number(),
          needs_review: z.boolean().optional(),
        }),
      )
      .optional(),
    logos: z
      .array(
        z.object({
          url: z.string(),
          format: z.string().optional(),
          dimensions: z
            .object({ width: z.number(), height: z.number() })
            .optional(),
          confidence: z.number(),
          needs_review: z.boolean().optional(),
        }),
      )
      .optional(),
    assets: z
      .array(
        z.object({
          url: z.string(),
          type: z.string().optional(),
          format: z.string().optional(),
          confidence: z.number().optional(),
        }),
      )
      .optional(),
    identity: z
      .object({
        tagline: z.string().optional(),
        industry: z.string().optional(),
      })
      .optional(),
  })
  .passthrough();

export type BrandTaxonomy = z.infer<typeof brandTaxonomySchema>;

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
    result: brandTaxonomySchema.nullish(),
    error: z.string().nullish(),
    brand_json_url: z.string().nullish(),
    assets_zip_url: z.string().nullish(),
  })
  .passthrough();

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;
export type ScrapeJobSubmission = z.infer<typeof scrapeJobSubmissionSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;
