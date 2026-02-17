// ── Next.js Instrumentation Hook ────────────────────────────────
// Auto-discovered by Next.js 16. The register() function runs once
// at server startup. Validates environment variables and logs clear
// error messages when configuration is wrong.
//
// Behavior by environment:
//   Cloud Run (K_SERVICE set): validation failure → process.exit(1)
//     Cloud Run marks the revision unhealthy and won't route traffic.
//   Local dev (K_SERVICE absent): validation failure → console warnings
//     Developers may intentionally omit secrets they're not testing.

export async function register() {
  // Only validate on the Node.js runtime (skip build phase and edge)
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { validateServerEnv } = await import("@/lib/env");
  const result = validateServerEnv();

  const isCloudRun = Boolean(process.env.K_SERVICE);
  const prefix = "[env-validation]";

  if (!result.success) {
    console.error(`${prefix} Environment validation failed:`);
    for (const error of result.errors) {
      console.error(`  ✗ ${error}`);
    }

    if (isCloudRun) {
      console.error(
        `${prefix} Exiting — Cloud Run will mark this revision as unhealthy.`,
      );
      process.exit(1);
    }

    console.warn(
      `${prefix} Continuing in local dev mode despite validation errors.`,
    );
  } else {
    console.info(`${prefix} All environment variables validated successfully.`);
  }

  // Log warnings even on success (e.g., self-reference URLs)
  for (const warning of result.warnings) {
    console.warn(`${prefix} ⚠ ${warning.field}: ${warning.message}`);
  }
}
