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

// ---------------------------------------------------------------------------
// Brand Taxonomy schemas — aligned with real scraper service output.
// Every extracted item is wrapped in an ExtractedField envelope with
// { value, confidence, evidence, needs_review }.
// All object schemas use .passthrough() for forward-compatibility.
// ---------------------------------------------------------------------------

/**
 * Evidence attached to each extracted field.
 */
const evidenceSchema = z
  .object({
    source_url: z.string(),
    selector: z.string().optional(),
    css_rule: z.string().optional(),
    method: z.string(),
  })
  .passthrough();

/**
 * Generic ExtractedField wrapper used by the scraper service for every
 * individually-extracted data point.
 */
function extractedFieldSchema<T extends z.ZodType>(valueSchema: T) {
  return z
    .object({
      value: valueSchema,
      confidence: z.number(),
      evidence: z.array(evidenceSchema),
      needs_review: z.boolean(),
    })
    .passthrough();
}

/** Infer the TypeScript type of an ExtractedField<T>. */
export type ExtractedField<T> = {
  value: T;
  confidence: number;
  evidence: z.infer<typeof evidenceSchema>[];
  needs_review: boolean;
  [key: string]: unknown;
};

// --- Value schemas for each data type ---

const colorPaletteEntrySchema = z
  .object({
    hex: z.string(),
    rgb: z.object({ r: z.number(), g: z.number(), b: z.number() }),
    role: z.string().optional(),
    frequency: z.number().optional(),
  })
  .passthrough();

const typographyEntrySchema = z
  .object({
    family: z.string(),
    weight: z.string(),
    size: z.string().optional(),
    line_height: z.string().optional(),
    usage: z.string().optional(),
    source: z.string().optional(),
  })
  .passthrough();

const assetEntrySchema = z
  .object({
    url: z.string(),
    local_path: z.string().optional(),
    type: z.string(),
    format: z.string().optional(),
    sizes: z.string().optional(),
    score: z.number().optional(),
    downloaded: z.boolean().optional(),
  })
  .passthrough();

// --- Top-level brand taxonomy ---

/**
 * Validates the brand taxonomy returned as the `result` of a completed job.
 * Aligned with the real scraper service taxonomy (ExtractedField wrappers).
 * Uses .passthrough() generously for forward-compatibility.
 */
export const brandTaxonomySchema = z
  .object({
    brand_id: z.string(),
    source: z
      .object({
        site_url: z.string(),
        timestamp: z.string(),
        pages_sampled: z.number(),
      })
      .passthrough(),
    color: z
      .object({
        palette: z.array(extractedFieldSchema(colorPaletteEntrySchema)),
        tokens_detected: z.boolean(),
      })
      .passthrough()
      .optional(),
    typography: z
      .object({
        font_families: z.array(extractedFieldSchema(typographyEntrySchema)),
        type_scale: z.record(z.string(), z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
    assets: z
      .object({
        logos: z.array(extractedFieldSchema(assetEntrySchema)).optional(),
        favicons: z.array(extractedFieldSchema(assetEntrySchema)).optional(),
        og_images: z.array(extractedFieldSchema(assetEntrySchema)).optional(),
      })
      .passthrough()
      .optional(),
    design_tokens: z
      .object({
        tokens: z.array(z.unknown()),
        source_count: z.number(),
      })
      .passthrough()
      .optional(),
    identity: z
      .object({
        tagline: z.string().optional(),
        industry_guess: z.string().optional(),
      })
      .passthrough()
      .optional(),
    governance: z
      .object({
        robots_respected: z.boolean().optional(),
        license_hints: z.array(z.string()).optional(),
      })
      .passthrough()
      .optional(),
    meta: z
      .object({
        extraction_version: z.string(),
        stages_completed: z.array(z.string()),
        stages_failed: z.array(z.string()),
        errors: z.array(
          z
            .object({
              code: z.string(),
              message: z.string(),
              stage: z.string(),
            })
            .passthrough(),
        ),
        summary: z
          .object({
            fields_populated: z.number(),
            low_confidence_count: z.number(),
            duration_ms: z.number(),
          })
          .passthrough(),
      })
      .passthrough(),
  })
  .passthrough();

export type BrandTaxonomy = z.infer<typeof brandTaxonomySchema>;

// --- Pipeline meta & assets manifest schemas (Phase 28 enriched response) ---

/**
 * Individual progress event from pipeline_meta.events.
 */
export const progressEventSchema = z
  .object({
    type: z.string(),
    timestamp: z.string(),
    detail: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type ProgressEvent = z.infer<typeof progressEventSchema>;

/**
 * Pipeline execution metadata returned for enriched job responses.
 */
export const pipelineMetaSchema = z
  .object({
    stages: z
      .array(
        z
          .object({
            stage: z.string(),
            status: z.string(),
            duration_ms: z.number(),
          })
          .passthrough(),
      )
      .optional(),
    pages_sampled: z.number().optional(),
    duration_ms: z.number().optional(),
    events: z.array(progressEventSchema).optional(),
  })
  .passthrough();

export type PipelineMeta = z.infer<typeof pipelineMetaSchema>;

/**
 * Individual asset entry in the assets manifest (snake_case per Phase 28-04).
 */
export const assetManifestEntrySchema = z
  .object({
    category: z.string(),
    filename: z.string(),
    original_url: z.string(),
    content_type: z.string(),
    size_bytes: z.number(),
    gcs_object_path: z.string(),
    signed_url: z.string().optional(),
  })
  .passthrough();

export type AssetManifestEntry = z.infer<typeof assetManifestEntrySchema>;

/**
 * Assets manifest envelope (snake_case per Phase 28-04).
 */
export const assetsManifestSchema = z
  .object({
    assets: z.array(assetManifestEntrySchema),
    total_count: z.number(),
    total_size_bytes: z.number(),
    created_at: z.string(),
  })
  .passthrough();

export type AssetsManifest = z.infer<typeof assetsManifestSchema>;

// --- Job status schema ---

/**
 * Error object returned by the scraper service on failure.
 */
const jobErrorSchema = z
  .object({
    code: z.string(),
    message: z.string(),
    stage: z.string(),
  })
  .passthrough();

export type JobError = z.infer<typeof jobErrorSchema>;

/**
 * Validates the Fastify GET /jobs/:id response (job status polling).
 * Uses .passthrough() to avoid breaking on unexpected extra fields.
 * pipeline_meta and assets_manifest are nullish for backward compatibility
 * with jobs created before Phase 28.
 */
export const jobStatusSchema = z
  .object({
    job_id: z.string(),
    status: z.string(),
    result: brandTaxonomySchema.nullish(),
    error: jobErrorSchema.nullish(),
    brand_json_url: z.string().nullish(),
    assets_zip_url: z.string().nullish(),
    pipeline_meta: pipelineMetaSchema.nullish(),
    assets_manifest: assetsManifestSchema.nullish(),
  })
  .passthrough();

export type ScrapeRequest = z.infer<typeof scrapeRequestSchema>;
export type ScrapeJobSubmission = z.infer<typeof scrapeJobSubmissionSchema>;
export type JobStatus = z.infer<typeof jobStatusSchema>;

/**
 * Client-side type for scrape history API responses.
 * Firestore Timestamps are serialized to ISO strings by the API route.
 */
export type ScrapeHistoryEntry = {
  id: string;
  jobId: string;
  siteUrl: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};
