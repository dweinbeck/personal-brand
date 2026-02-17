// ── Centralized Environment Variable Validation ─────────────────
// Uses Zod v4 to validate all env vars at startup. Split into
// client (NEXT_PUBLIC_*) and server schemas so the client bundle
// never references server secrets.
//
// Usage:
//   import { serverEnv } from "@/lib/env";  // server components / API routes
//   import { clientEnv } from "@/lib/env";  // client components (public vars only)

import { z } from "zod/v4";

// ── Placeholder detection ───────────────────────────────────────

const PLACEHOLDER_PATTERNS = [
  /^your[_-]/i,
  /^sk[_-]your/i,
  /^ghp[_-]your/i,
  /^whsec[_-]your/i,
  /placeholder/i,
  /^xxx/i,
  /^CHANGE[_-]ME/i,
  /^TODO/i,
  /^INSERT[_-]/i,
  /YOUR[_-].*[_-]HERE/i,
  /YOUR[_-].*KEY/i,
];

/** Returns true if the value does NOT look like a placeholder. */
function isNotPlaceholder(val: string): boolean {
  return !PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(val));
}

/** Creates a Zod string schema with min(1) and placeholder detection. */
function nonEmptyNonPlaceholder(fieldName: string) {
  return z
    .string()
    .min(1, `${fieldName} is required`)
    .refine(
      isNotPlaceholder,
      `${fieldName} looks like a placeholder value. Set a real value.`,
    );
}

// ── Client env schema (NEXT_PUBLIC_* only) ──────────────────────

export const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: nonEmptyNonPlaceholder(
    "NEXT_PUBLIC_FIREBASE_API_KEY",
  ),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: nonEmptyNonPlaceholder(
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  ),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: nonEmptyNonPlaceholder(
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
  ),
  NEXT_PUBLIC_TASKS_APP_URL: z.string().url().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

// ── Server env schema ───────────────────────────────────────────

const serverEnvBaseSchema = z.object({
  // Firebase Admin (optional locally — Cloud Run uses ADC)
  FIREBASE_PROJECT_ID: nonEmptyNonPlaceholder("FIREBASE_PROJECT_ID"),

  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email("FIREBASE_CLIENT_EMAIL must be a valid email")
    .optional(),

  FIREBASE_PRIVATE_KEY: z.string().min(1).optional(),

  // Client vars (needed server-side for cross-field validation)
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1),

  // External service URLs
  CHATBOT_API_URL: z.string().url("CHATBOT_API_URL must be a valid URL"),

  BRAND_SCRAPER_API_URL: z
    .string()
    .url("BRAND_SCRAPER_API_URL must be a valid URL"),

  // API keys — optional keys have fallback behavior in their consumers
  CHATBOT_API_KEY: z
    .string()
    .min(1)
    .refine(isNotPlaceholder, "CHATBOT_API_KEY looks like a placeholder")
    .optional(),

  GITHUB_TOKEN: z
    .string()
    .min(1)
    .refine(isNotPlaceholder, "GITHUB_TOKEN looks like a placeholder")
    .refine(
      (val) => val.startsWith("ghp_") || val.startsWith("github_pat_"),
      "GITHUB_TOKEN must start with 'ghp_' or 'github_pat_'",
    )
    .optional(),

  TODOIST_API_TOKEN: z
    .string()
    .min(1)
    .refine(isNotPlaceholder, "TODOIST_API_TOKEN looks like a placeholder")
    .optional(),

  STRIPE_SECRET_KEY: z
    .string()
    .min(1)
    .refine(isNotPlaceholder, "STRIPE_SECRET_KEY looks like a placeholder")
    .refine(
      (val) => val.startsWith("sk_test_") || val.startsWith("sk_live_"),
      "STRIPE_SECRET_KEY must start with 'sk_test_' or 'sk_live_'",
    )
    .optional(),

  STRIPE_WEBHOOK_SECRET: z
    .string()
    .min(1)
    .refine(isNotPlaceholder, "STRIPE_WEBHOOK_SECRET looks like a placeholder")
    .refine(
      (val) => val.startsWith("whsec_"),
      "STRIPE_WEBHOOK_SECRET must start with 'whsec_'",
    )
    .optional(),

  OPENAI_API_KEY: z
    .string()
    .min(1)
    .refine(isNotPlaceholder, "OPENAI_API_KEY looks like a placeholder")
    .refine(
      (val) => val.startsWith("sk-"),
      "OPENAI_API_KEY must start with 'sk-'",
    )
    .optional(),

  GOOGLE_GENERATIVE_AI_API_KEY: z
    .string()
    .min(1)
    .refine(
      isNotPlaceholder,
      "GOOGLE_GENERATIVE_AI_API_KEY looks like a placeholder",
    )
    .optional(),
});

// Cross-field validation: FIREBASE_PROJECT_ID must match NEXT_PUBLIC_FIREBASE_PROJECT_ID
export const serverEnvSchema = serverEnvBaseSchema.refine(
  (env) =>
    !env.FIREBASE_PROJECT_ID ||
    !env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    env.FIREBASE_PROJECT_ID === env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  {
    message:
      "FIREBASE_PROJECT_ID must equal NEXT_PUBLIC_FIREBASE_PROJECT_ID. Using the wrong project ID breaks auth token verification.",
    path: ["FIREBASE_PROJECT_ID"],
  },
);

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// ── Self-reference URL detection ────────────────────────────────
// These checks happen outside the Zod schema because they need
// knowledge of the app's own Cloud Run service URL, which is only
// available at runtime.

export interface EnvWarning {
  field: string;
  message: string;
}

/**
 * Checks if any external service URLs accidentally point back to
 * this app's own domain (a common misconfiguration on Cloud Run).
 */
export function detectSelfReferenceUrls(
  env: Pick<ServerEnv, "CHATBOT_API_URL" | "BRAND_SCRAPER_API_URL">,
): EnvWarning[] {
  const warnings: EnvWarning[] = [];

  // K_SERVICE is set by Cloud Run — use it to identify the app's own URL
  const kService = process.env.K_SERVICE;
  if (!kService) return warnings;

  const selfPatterns = [
    kService, // e.g. "personal-brand"
    "dan-weinbeck.com",
    "dev.dan-weinbeck.com",
  ];

  for (const [field, url] of Object.entries(env) as [string, string][]) {
    if (!url) continue;
    try {
      const hostname = new URL(url).hostname;
      for (const pattern of selfPatterns) {
        if (hostname.includes(pattern)) {
          warnings.push({
            field,
            message: `${field} ("${url}") appears to point to this app itself (matched "${pattern}"). It should point to the external service.`,
          });
          break;
        }
      }
    } catch {
      // URL parsing failed — Zod already catches this
    }
  }

  return warnings;
}

// ── Lazy singletons ─────────────────────────────────────────────
// Parse once on first call. Using functions (not top-level const)
// avoids executing during client bundle or build phase.

let _clientEnv: ClientEnv | undefined;
let _serverEnv: ServerEnv | undefined;

/** Parsed + validated client env vars. Safe for client components. */
export function clientEnv(): ClientEnv {
  if (!_clientEnv) {
    _clientEnv = clientEnvSchema.parse({
      NEXT_PUBLIC_FIREBASE_API_KEY:
        process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      NEXT_PUBLIC_TASKS_APP_URL:
        process.env.NEXT_PUBLIC_TASKS_APP_URL || undefined,
    });
  }
  return _clientEnv;
}

/** Parsed + validated server env vars. Only use in server components / API routes. */
export function serverEnv(): ServerEnv {
  if (!_serverEnv) {
    _serverEnv = serverEnvSchema.parse({
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || undefined,
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || undefined,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID:
        process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
      CHATBOT_API_URL: process.env.CHATBOT_API_URL ?? "",
      BRAND_SCRAPER_API_URL: process.env.BRAND_SCRAPER_API_URL ?? "",
      CHATBOT_API_KEY: process.env.CHATBOT_API_KEY || undefined,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN || undefined,
      TODOIST_API_TOKEN: process.env.TODOIST_API_TOKEN || undefined,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
      GOOGLE_GENERATIVE_AI_API_KEY:
        process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined,
    });
  }
  return _serverEnv;
}

// ── Validation result (non-throwing) ────────────────────────────
// Used by instrumentation.ts to log issues without crashing in dev.

export interface ValidationResult {
  success: boolean;
  errors: string[];
  warnings: EnvWarning[];
}

/** Validates server env vars and returns a result object instead of throwing. */
export function validateServerEnv(): ValidationResult {
  const errors: string[] = [];

  const parsed = serverEnvSchema.safeParse({
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || undefined,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || undefined,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    CHATBOT_API_URL: process.env.CHATBOT_API_URL ?? "",
    BRAND_SCRAPER_API_URL: process.env.BRAND_SCRAPER_API_URL ?? "",
    CHATBOT_API_KEY: process.env.CHATBOT_API_KEY || undefined,
    GITHUB_TOKEN: process.env.GITHUB_TOKEN || undefined,
    TODOIST_API_TOKEN: process.env.TODOIST_API_TOKEN || undefined,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    GOOGLE_GENERATIVE_AI_API_KEY:
      process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined,
  });

  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      errors.push(`${path}: ${issue.message}`);
    }
  }

  const warnings = parsed.success ? detectSelfReferenceUrls(parsed.data) : [];

  return { success: parsed.success, errors, warnings };
}
