#!/usr/bin/env tsx
// ── Env Var Deploy Audit ────────────────────────────────────────
// Cross-references process.env.* references in src/ against
// cloudbuild.yaml to catch vars that exist locally but will be
// undefined on Cloud Run.
//
// Usage:
//   npx tsx scripts/audit-env-deploy.ts
//   npm run audit-env-deploy

import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";

// ── ANSI Colors ─────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

const PASS = green("PASS");
const FAIL = red("FAIL");
const WARN = yellow("WARN");
const SKIP = dim("SKIP");

// ── Allowlists ──────────────────────────────────────────────────

/** Vars provided by the runtime (Node.js, Cloud Run, Next.js) — never in cloudbuild. */
const RUNTIME_PROVIDED = new Set([
  "NODE_ENV",
  "K_SERVICE",
  "NEXT_RUNTIME",
  "PORT",
  "HOSTNAME",
  "NEXT_TELEMETRY_DISABLED",
]);

/** Vars only needed locally — Cloud Run uses ADC (Application Default Credentials). */
const LOCAL_ONLY = new Set(["FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"]);

/** Vars with safe fallback values in code — warn but don't fail. */
const HAS_FALLBACK = new Set(["BILLING_URL"]);

// ── Step 1: Scan src/ for process.env.VAR_NAME ─────────────────

interface EnvReference {
  varName: string;
  file: string;
  line: number;
}

function scanDir(dir: string, refs: EnvReference[]): void {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      // Skip generated code, node_modules, test files
      if (
        entry.name === "node_modules" ||
        entry.name === "generated" ||
        entry.name === "__tests__"
      ) {
        continue;
      }
      scanDir(fullPath, refs);
    } else if (/\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      const content = readFileSync(fullPath, "utf-8");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        // Match process.env.VAR_NAME (uppercase with underscores)
        const matches = lines[i].matchAll(/process\.env\.([A-Z][A-Z0-9_]*)/g);
        for (const match of matches) {
          refs.push({
            varName: match[1],
            file: fullPath,
            line: i + 1,
          });
        }
      }
    }
  }
}

const srcDir = join(process.cwd(), "src");
const envRefs: EnvReference[] = [];
scanDir(srcDir, envRefs);

// Deduplicate to unique var names, keeping first reference for reporting
const varMap = new Map<string, EnvReference>();
for (const ref of envRefs) {
  if (!varMap.has(ref.varName)) {
    varMap.set(ref.varName, ref);
  }
}

// ── Step 2: Parse cloudbuild.yaml ───────────────────────────────

const cloudbuildPath = join(process.cwd(), "cloudbuild.yaml");
let cloudbuildContent: string;
try {
  cloudbuildContent = readFileSync(cloudbuildPath, "utf-8");
} catch {
  console.error(red("\nError: cloudbuild.yaml not found in project root.\n"));
  process.exit(1);
}

const deployedVars = new Set<string>();

// Parse --build-arg=VAR_NAME=${_VAR_NAME}
for (const match of cloudbuildContent.matchAll(
  /--build-arg=([A-Z][A-Z0-9_]*)=/g,
)) {
  deployedVars.add(match[1]);
}

// Parse --set-env-vars=KEY=VALUE,KEY=VALUE,...
const envVarsMatch = cloudbuildContent.match(/--set-env-vars=([^\s]+)/);
if (envVarsMatch) {
  for (const pair of envVarsMatch[1].split(",")) {
    const key = pair.split("=")[0];
    if (key && /^[A-Z]/.test(key)) {
      deployedVars.add(key);
    }
  }
}

// Parse --set-secrets=KEY=secret-name:latest,KEY=secret-name:latest,...
const secretsMatch = cloudbuildContent.match(/--set-secrets=([^\s]+)/);
if (secretsMatch) {
  for (const pair of secretsMatch[1].split(",")) {
    const key = pair.split("=")[0];
    if (key && /^[A-Z]/.test(key)) {
      deployedVars.add(key);
    }
  }
}

// ── Step 3: Cross-reference ─────────────────────────────────────

console.log(`\n${bold("Env Var Deploy Audit")}\n`);
console.log(`  Found ${bold(String(varMap.size))} unique env vars in src/`);
console.log(
  `  Found ${bold(String(deployedVars.size))} vars provisioned in cloudbuild.yaml\n`,
);

type AuditStatus = "PASS" | "FAIL" | "WARN" | "SKIP";

interface AuditResult {
  varName: string;
  status: AuditStatus;
  reason: string;
  file: string;
  line: number;
}

const results: AuditResult[] = [];

for (const [varName, ref] of varMap) {
  const relFile = relative(process.cwd(), ref.file);

  if (RUNTIME_PROVIDED.has(varName)) {
    results.push({
      varName,
      status: "SKIP",
      reason: "Runtime-provided",
      file: relFile,
      line: ref.line,
    });
  } else if (LOCAL_ONLY.has(varName)) {
    results.push({
      varName,
      status: "SKIP",
      reason: "Local-only (ADC on Cloud Run)",
      file: relFile,
      line: ref.line,
    });
  } else if (HAS_FALLBACK.has(varName)) {
    if (deployedVars.has(varName)) {
      results.push({
        varName,
        status: "PASS",
        reason: "In cloudbuild (has fallback)",
        file: relFile,
        line: ref.line,
      });
    } else {
      results.push({
        varName,
        status: "WARN",
        reason: "Not in cloudbuild — has code fallback",
        file: relFile,
        line: ref.line,
      });
    }
  } else if (deployedVars.has(varName)) {
    results.push({
      varName,
      status: "PASS",
      reason: "In cloudbuild",
      file: relFile,
      line: ref.line,
    });
  } else {
    results.push({
      varName,
      status: "FAIL",
      reason: "NOT in cloudbuild — will be undefined on Cloud Run",
      file: relFile,
      line: ref.line,
    });
  }
}

// Sort: FAILs first, then WARNs, then PASSes, then SKIPs
const statusOrder: Record<AuditStatus, number> = {
  FAIL: 0,
  WARN: 1,
  PASS: 2,
  SKIP: 3,
};
results.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

// ── Step 4: Report ──────────────────────────────────────────────

const statusLabels: Record<AuditStatus, string> = {
  PASS,
  FAIL,
  WARN,
  SKIP,
};

// Find max widths for alignment
const maxVarLen = Math.max(...results.map((r) => r.varName.length));
const maxReasonLen = Math.max(...results.map((r) => r.reason.length));

for (const r of results) {
  const varPad = r.varName.padEnd(maxVarLen);
  const reasonPad = r.reason.padEnd(maxReasonLen);
  const location = dim(`${r.file}:${r.line}`);
  console.log(
    `  ${statusLabels[r.status]}  ${varPad}  ${reasonPad}  ${location}`,
  );
}

// ── Summary ─────────────────────────────────────────────────────

const failCount = results.filter((r) => r.status === "FAIL").length;
const warnCount = results.filter((r) => r.status === "WARN").length;
const passCount = results.filter((r) => r.status === "PASS").length;
const skipCount = results.filter((r) => r.status === "SKIP").length;

console.log(`\n${bold("─".repeat(50))}`);
console.log(
  `  ${green(String(passCount))} pass  ${yellow(String(warnCount))} warn  ${red(String(failCount))} fail  ${dim(String(skipCount))} skip`,
);

if (failCount > 0) {
  console.log(
    red(`\n  ✗ ${failCount} env var(s) missing from cloudbuild.yaml`),
  );
  console.log(dim("  Run /add-env-var <VAR_NAME> to add missing vars.\n"));
  process.exit(1);
} else if (warnCount > 0) {
  console.log(
    yellow(
      `\n  ⚠ All required vars present. ${warnCount} warning(s) — vars with code fallbacks not in cloudbuild.\n`,
    ),
  );
} else {
  console.log(green("\n  ✓ All env vars are provisioned for Cloud Run.\n"));
}
