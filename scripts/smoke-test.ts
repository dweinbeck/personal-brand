#!/usr/bin/env tsx
// ── Post-Deploy Smoke Test ──────────────────────────────────
// Validates that deployed services are actually reachable and
// returning expected responses. Unlike validate-env.ts (which
// checks config syntax), this probes live service behavior.
//
// Usage:
//   npx tsx scripts/smoke-test.ts                    # test against env vars
//   npx tsx scripts/smoke-test.ts --url https://...  # override app URL

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

// ── Colors (ANSI) ───────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

const PASS = green("PASS");
const FAIL = red("FAIL");
const WARN = yellow("WARN");
const SKIP = dim("SKIP");

// ── State ───────────────────────────────────────────────────

let hasFailure = false;
let passCount = 0;
let failCount = 0;
let warnCount = 0;
let skipCount = 0;

function log(status: string, message: string) {
  if (status === PASS) passCount++;
  else if (status === FAIL) failCount++;
  else if (status === WARN) warnCount++;
  else if (status === SKIP) skipCount++;
  console.log(`  ${status}  ${message}`);
}

// ── Parse args ──────────────────────────────────────────────

const urlOverride = process.argv.find((a) => a.startsWith("--url="))?.slice(6);

// ── Main ────────────────────────────────────────────────────

async function main() {
  // ── Probe 1: Self-health ──────────────────────────────────

  console.log(`\n${bold("Probe 1: Application health")}\n`);

  const appUrl = urlOverride || process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      const res = await fetch(appUrl, {
        signal: AbortSignal.timeout(15_000),
        redirect: "follow",
      });
      if (res.ok) {
        const contentType = res.headers.get("content-type") ?? "";
        if (contentType.includes("text/html")) {
          log(PASS, `App responds ${res.status} with HTML at ${appUrl}`);
        } else {
          log(
            WARN,
            `App responds ${res.status} but content-type is "${contentType}" (expected HTML)`,
          );
        }
      } else {
        hasFailure = true;
        log(FAIL, `App returned ${res.status} at ${appUrl}`);
      }
    } catch (err) {
      hasFailure = true;
      const msg = err instanceof Error ? err.message : "Unknown error";
      log(FAIL, `App unreachable at ${appUrl} — ${msg}`);
    }
  } else {
    log(SKIP, "App URL not configured (set NEXT_PUBLIC_APP_URL or use --url=)");
  }

  // ── Probe 2: External services ────────────────────────────
  // Key check: response should be JSON, not HTML. If a service URL
  // accidentally points back to this app, it returns HTML at any path.

  console.log(`\n${bold("Probe 2: External service connectivity")}\n`);

  interface ServiceProbe {
    name: string;
    url: string | undefined;
  }

  const services: ServiceProbe[] = [
    {
      name: "Chatbot API (CHATBOT_API_URL)",
      url: process.env.CHATBOT_API_URL,
    },
    {
      name: "Brand Scraper API (BRAND_SCRAPER_API_URL)",
      url: process.env.BRAND_SCRAPER_API_URL,
    },
  ];

  for (const service of services) {
    if (!service.url) {
      log(SKIP, `${service.name} — URL not configured`);
      continue;
    }

    try {
      const res = await fetch(service.url, {
        signal: AbortSignal.timeout(15_000),
        redirect: "follow",
      });

      const contentType = res.headers.get("content-type") ?? "";
      const isJson = contentType.includes("application/json");
      const isHtml = contentType.includes("text/html");

      if (res.ok && isJson) {
        log(PASS, `${service.name} responds ${res.status} with JSON`);
      } else if (res.ok && isHtml) {
        // This is the self-reference smell: API service returning HTML
        hasFailure = true;
        log(
          FAIL,
          `${service.name} returned HTML instead of JSON — URL may point to the wrong service (${service.url})`,
        );
      } else if (res.ok) {
        log(
          WARN,
          `${service.name} responds ${res.status} with "${contentType}"`,
        );
      } else if (res.status === 404) {
        hasFailure = true;
        log(
          FAIL,
          `${service.name} returned 404 — service may not be deployed (${service.url})`,
        );
      } else {
        // Non-200 may be expected for unauthenticated root requests
        log(
          WARN,
          `${service.name} responds ${res.status} (may need auth). Content-type: "${contentType}"`,
        );
      }
    } catch (err) {
      hasFailure = true;
      const msg = err instanceof Error ? err.message : "Unknown error";
      log(FAIL, `${service.name} unreachable — ${msg} (${service.url})`);
    }
  }

  // ── Probe 3: Auth consistency ─────────────────────────────

  console.log(`\n${bold("Probe 3: Auth configuration consistency")}\n`);

  const firebaseProjectId = process.env.FIREBASE_PROJECT_ID;
  const nextPublicProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  if (firebaseProjectId && nextPublicProjectId) {
    if (firebaseProjectId === nextPublicProjectId) {
      log(PASS, `Project IDs match: "${firebaseProjectId}"`);
    } else {
      hasFailure = true;
      log(
        FAIL,
        `FIREBASE_PROJECT_ID ("${firebaseProjectId}") ≠ NEXT_PUBLIC_FIREBASE_PROJECT_ID ("${nextPublicProjectId}")`,
      );
    }
  } else {
    log(WARN, "Cannot verify project ID match — one or both are missing");
  }

  // Check if project ID looks numeric (GCP project number, not Firebase ID)
  if (firebaseProjectId && /^\d+$/.test(firebaseProjectId)) {
    hasFailure = true;
    log(
      FAIL,
      `FIREBASE_PROJECT_ID is purely numeric ("${firebaseProjectId}") — this is a GCP project number, not a Firebase project ID`,
    );
  }

  // ── Probe 4: Secret validation ────────────────────────────
  // Make lightweight API calls to verify keys are real, not placeholders
  // that happened to pass format checks.

  console.log(`\n${bold("Probe 4: Secret validation (live probes)")}\n`);

  interface SecretProbeConfig {
    name: string;
    envVar: string;
    probeUrl: string;
    headers: Record<string, string>;
    successCodes: number[];
  }

  const secretProbes: SecretProbeConfig[] = [
    {
      name: "OpenAI API Key",
      envVar: "OPENAI_API_KEY",
      probeUrl: "https://api.openai.com/v1/models",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY ?? ""}`,
      },
      successCodes: [200],
    },
    {
      name: "GitHub Token",
      envVar: "GITHUB_TOKEN",
      probeUrl: "https://api.github.com/user",
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN ?? ""}`,
        Accept: "application/vnd.github.v3+json",
      },
      successCodes: [200],
    },
    {
      name: "Google AI API Key",
      envVar: "GOOGLE_GENERATIVE_AI_API_KEY",
      probeUrl: `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? ""}`,
      headers: {},
      successCodes: [200],
    },
  ];

  for (const probe of secretProbes) {
    const value = process.env[probe.envVar];
    if (!value) {
      log(SKIP, `${probe.name} — ${probe.envVar} not set`);
      continue;
    }

    try {
      const res = await fetch(probe.probeUrl, {
        headers: probe.headers,
        signal: AbortSignal.timeout(10_000),
      });

      if (probe.successCodes.includes(res.status)) {
        log(PASS, `${probe.name} key is valid (${res.status})`);
      } else if (res.status === 401 || res.status === 403) {
        hasFailure = true;
        log(
          FAIL,
          `${probe.name} key rejected (${res.status}) — may be a placeholder or expired`,
        );
      } else {
        log(
          WARN,
          `${probe.name} returned ${res.status} — key may be valid but endpoint returned unexpected status`,
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      log(WARN, `${probe.name} probe failed — ${msg}`);
    }
  }

  // ── Probe 5: Service distinctness ─────────────────────────
  // Verify that external service URLs resolve to different hosts
  // (catches copy-paste errors where both URLs point to the same service)

  console.log(`\n${bold("Probe 5: Service distinctness")}\n`);

  const chatbotUrl = process.env.CHATBOT_API_URL;
  const scraperUrl = process.env.BRAND_SCRAPER_API_URL;

  if (chatbotUrl && scraperUrl) {
    try {
      const chatHost = new URL(chatbotUrl).hostname;
      const scraperHost = new URL(scraperUrl).hostname;

      if (chatHost === scraperHost) {
        log(
          WARN,
          `Chatbot and Scraper resolve to the same host ("${chatHost}") — verify this is intentional`,
        );
      } else {
        log(
          PASS,
          `Chatbot ("${chatHost}") and Scraper ("${scraperHost}") are distinct services`,
        );
      }
    } catch {
      log(WARN, "Cannot compare service hosts — one or both URLs are invalid");
    }
  } else {
    log(SKIP, "Cannot check distinctness — one or both service URLs missing");
  }

  // ── Summary ───────────────────────────────────────────────

  console.log(`\n${bold("─".repeat(50))}`);
  console.log(
    `\n  Results: ${green(`${passCount} passed`)}, ${failCount > 0 ? red(`${failCount} failed`) : dim("0 failed")}, ${warnCount > 0 ? yellow(`${warnCount} warnings`) : dim("0 warnings")}, ${dim(`${skipCount} skipped`)}\n`,
  );

  if (hasFailure) {
    console.log(
      red(
        "  ✗ Smoke test failed. Fix issues above before declaring deploy complete.\n",
      ),
    );
    process.exit(1);
  } else {
    console.log(green("  ✓ All smoke tests passed.\n"));
  }
}

main();
