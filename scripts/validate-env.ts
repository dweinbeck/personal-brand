#!/usr/bin/env tsx
// ── Pre-Deploy Environment Validation ───────────────────────────
// Validates env vars, checks cross-field consistency, detects
// self-reference URLs, verifies secret formats, and optionally
// probes external service health.
//
// Usage:
//   npx tsx scripts/validate-env.ts              # full check
//   npx tsx scripts/validate-env.ts --skip-health  # skip health probes

// Load .env.local for local dev (no-op in CI/Cloud Run)
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const envLocalPath = resolve(process.cwd(), ".env.local");
if (existsSync(envLocalPath)) {
  const lines = readFileSync(envLocalPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1).replace(/^["']|["']$/g, "");
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

// ── Colors (ANSI) ───────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

const PASS = green("PASS");
const FAIL = red("FAIL");
const WARN = yellow("WARN");
const SKIP = dim("SKIP");

// ── State ───────────────────────────────────────────────────────

let hasFailure = false;
const skipHealth = process.argv.includes("--skip-health");

function log(status: string, message: string) {
  console.log(`  ${status}  ${message}`);
}

// ── Phase 1: Env var presence + placeholder detection ───────────

console.log(`\n${bold("Phase 1: Environment variable presence")}\n`);

// Import the schemas — they're pure Zod objects, no side effects
const { clientEnvSchema, serverEnvSchema } = await import("../src/lib/env.js");

const clientInput = {
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
};

const clientResult = clientEnvSchema.safeParse(clientInput);
if (clientResult.success) {
  log(PASS, "Client env vars (NEXT_PUBLIC_*) present and valid");
} else {
  hasFailure = true;
  for (const issue of clientResult.error.issues) {
    log(FAIL, `${issue.path.join(".")}: ${issue.message}`);
  }
}

const serverInput = {
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ?? "",
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || undefined,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY || undefined,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  CHATBOT_API_URL: process.env.CHATBOT_API_URL ?? "",
  BRAND_SCRAPER_API_URL: process.env.BRAND_SCRAPER_API_URL ?? "",
  CHATBOT_API_KEY: process.env.CHATBOT_API_KEY || undefined,
  GITHUB_TOKEN: process.env.GITHUB_TOKEN || undefined,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || undefined,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || undefined,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
  GOOGLE_GENERATIVE_AI_API_KEY:
    process.env.GOOGLE_GENERATIVE_AI_API_KEY || undefined,
};

const serverResult = serverEnvSchema.safeParse(serverInput);
if (serverResult.success) {
  log(PASS, "Server env vars present and valid");
} else {
  hasFailure = true;
  for (const issue of serverResult.error.issues) {
    log(FAIL, `${issue.path.join(".")}: ${issue.message}`);
  }
}

// ── Phase 2: Cross-field consistency ────────────────────────────

console.log(`\n${bold("Phase 2: Cross-field consistency")}\n`);

const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
const nextPublicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

if (firebaseProjectId && nextPublicProjectId) {
  if (firebaseProjectId === nextPublicProjectId) {
    log(
      PASS,
      `FIREBASE_PROJECT_ID matches NEXT_PUBLIC_FIREBASE_PROJECT_ID ("${firebaseProjectId}")`,
    );
  } else {
    hasFailure = true;
    log(
      FAIL,
      `FIREBASE_PROJECT_ID ("${firebaseProjectId}") ≠ NEXT_PUBLIC_FIREBASE_PROJECT_ID ("${nextPublicProjectId}")`,
    );
  }
} else {
  log(WARN, "Cannot compare project IDs — one or both are missing");
}

// ── Phase 3: Self-reference URL detection ───────────────────────

console.log(`\n${bold("Phase 3: Self-reference URL detection")}\n`);

const chatbotUrl = process.env.CHATBOT_API_URL ?? "";
const scraperUrl = process.env.BRAND_SCRAPER_API_URL ?? "";
const selfDomains = ["dan-weinbeck.com", "dev.dan-weinbeck.com"];

// Also check if service URLs point to each other (both should be distinct)
function checkSelfRef(field: string, url: string): boolean {
  if (!url) return false;
  try {
    const hostname = new URL(url).hostname;
    for (const domain of selfDomains) {
      if (hostname.includes(domain)) {
        hasFailure = true;
        log(
          FAIL,
          `${field} ("${url}") points to the app's own domain. Must point to external service.`,
        );
        return true;
      }
    }
  } catch {
    // Invalid URL — caught by Zod in Phase 1
  }
  return false;
}

const chatbotSelfRef = checkSelfRef("CHATBOT_API_URL", chatbotUrl);
const scraperSelfRef = checkSelfRef("BRAND_SCRAPER_API_URL", scraperUrl);

if (!chatbotSelfRef && chatbotUrl) {
  log(PASS, `CHATBOT_API_URL points to external service`);
}
if (!scraperSelfRef && scraperUrl) {
  log(PASS, `BRAND_SCRAPER_API_URL points to external service`);
}

// Check the two URLs are distinct
if (chatbotUrl && scraperUrl) {
  try {
    const chatHost = new URL(chatbotUrl).hostname;
    const scraperHost = new URL(scraperUrl).hostname;
    if (chatHost === scraperHost) {
      log(
        WARN,
        `CHATBOT_API_URL and BRAND_SCRAPER_API_URL resolve to the same host ("${chatHost}")`,
      );
    } else {
      log(PASS, "Service URLs point to distinct hosts");
    }
  } catch {
    // Invalid URLs caught elsewhere
  }
}

// ── Phase 4: Secret format validation ───────────────────────────

console.log(`\n${bold("Phase 4: Secret format validation")}\n`);

const formatChecks: Array<{
  field: string;
  value: string | undefined;
  prefixes: string[];
  optional: boolean;
}> = [
  {
    field: "GITHUB_TOKEN",
    value: process.env.GITHUB_TOKEN,
    prefixes: ["ghp_", "github_pat_"],
    optional: true,
  },
  {
    field: "STRIPE_SECRET_KEY",
    value: process.env.STRIPE_SECRET_KEY,
    prefixes: ["sk_test_", "sk_live_"],
    optional: true,
  },
  {
    field: "STRIPE_WEBHOOK_SECRET",
    value: process.env.STRIPE_WEBHOOK_SECRET,
    prefixes: ["whsec_"],
    optional: true,
  },
  {
    field: "OPENAI_API_KEY",
    value: process.env.OPENAI_API_KEY,
    prefixes: ["sk-"],
    optional: true,
  },
];

for (const check of formatChecks) {
  if (!check.value) {
    if (check.optional) {
      log(SKIP, `${check.field} not set (optional)`);
    } else {
      hasFailure = true;
      log(FAIL, `${check.field} not set (required)`);
    }
    continue;
  }

  const hasValidPrefix = check.prefixes.some((p) => check.value?.startsWith(p));
  if (hasValidPrefix) {
    log(PASS, `${check.field} has valid prefix`);
  } else {
    hasFailure = true;
    log(
      FAIL,
      `${check.field} should start with ${check.prefixes.join(" or ")}`,
    );
  }
}

// ── Phase 4b: DATABASE_URL validation ────────────────────────────

console.log(`\n${bold("Phase 4b: Database URL validation")}\n`);

const databaseUrl = process.env.DATABASE_URL;
const hasCloudRunSecrets = !!(
  process.env.GITHUB_TOKEN ||
  process.env.STRIPE_SECRET_KEY ||
  process.env.CHATBOT_API_KEY
);

if (databaseUrl) {
  if (databaseUrl.startsWith("postgresql://")) {
    log(PASS, "DATABASE_URL present and has valid postgresql:// prefix");
  } else {
    hasFailure = true;
    log(FAIL, "DATABASE_URL must start with postgresql://");
  }
} else if (hasCloudRunSecrets) {
  hasFailure = true;
  log(
    FAIL,
    "DATABASE_URL not set but other Cloud Run secrets are present — required in production",
  );
} else {
  log(
    WARN,
    "DATABASE_URL not set (expected in local dev — required in Cloud Run)",
  );
}

// ── Phase 5: Service health probes ──────────────────────────────

console.log(`\n${bold("Phase 5: Service health probes")}\n`);

if (skipHealth) {
  log(SKIP, "Health probes skipped (--skip-health flag)");
} else {
  async function probe(
    name: string,
    url: string,
    options?: { headers?: Record<string, string> },
  ) {
    if (!url) {
      log(SKIP, `${name} — URL not configured`);
      return;
    }
    try {
      const res = await fetch(url, {
        headers: options?.headers,
        signal: AbortSignal.timeout(10_000),
      });
      if (res.status === 404) {
        hasFailure = true;
        log(
          FAIL,
          `${name} returned 404 — URL may be wrong or service not deployed`,
        );
      } else if (res.ok) {
        log(PASS, `${name} responded ${res.status}`);
      } else {
        log(
          WARN,
          `${name} responded ${res.status} (may be expected for unauthenticated requests)`,
        );
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      hasFailure = true;
      log(FAIL, `${name} unreachable — ${message}`);
    }
  }

  await Promise.all([
    probe("CHATBOT_API_URL", chatbotUrl),
    probe("BRAND_SCRAPER_API_URL", scraperUrl),
    process.env.GITHUB_TOKEN
      ? probe("GitHub API", "https://api.github.com/user", {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github.v3+json",
          },
        })
      : Promise.resolve(log(SKIP, "GitHub API — GITHUB_TOKEN not set")),
  ]);
}

// ── Summary ─────────────────────────────────────────────────────

console.log(`\n${bold("─".repeat(50))}`);
if (hasFailure) {
  console.log(
    red("\n  ✗ Validation failed. Fix issues above before deploying.\n"),
  );
  process.exit(1);
} else {
  console.log(green("\n  ✓ All checks passed.\n"));
}
