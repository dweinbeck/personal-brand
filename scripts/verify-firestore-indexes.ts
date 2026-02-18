#!/usr/bin/env tsx
// ── Firestore Index Verification ────────────────────────────────
// Reads firestore.indexes.json and checks each composite index
// against the live Firebase project using the Firestore Admin
// REST API (via Application Default Credentials).
//
// Usage:
//   npx tsx scripts/verify-firestore-indexes.ts --project personal-brand-486314

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// ── Colors ──────────────────────────────────────────────────────

const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ── Parse args ──────────────────────────────────────────────────

const projectFlagIdx = process.argv.indexOf("--project");
const projectId =
  projectFlagIdx !== -1 ? process.argv[projectFlagIdx + 1] : undefined;

if (!projectId) {
  console.error(
    red("Error: --project flag is required.\n") +
      dim(
        "Usage: npx tsx scripts/verify-firestore-indexes.ts --project <firebase-project-id>",
      ),
  );
  process.exit(1);
}

// ── Load local index definitions ────────────────────────────────

interface LocalField {
  fieldPath: string;
  order?: string;
  arrayConfig?: string;
}

interface LocalIndex {
  collectionGroup: string;
  queryScope: string;
  fields: LocalField[];
}

const indexesPath = resolve(process.cwd(), "firestore.indexes.json");
let localIndexes: LocalIndex[];

try {
  const raw = JSON.parse(readFileSync(indexesPath, "utf-8"));
  localIndexes = raw.indexes;
  console.log(
    `\n${bold("Firestore Index Verification")} — ${localIndexes.length} indexes defined in firestore.indexes.json\n`,
  );
} catch (err) {
  console.error(
    red(
      `Error reading ${indexesPath}: ${err instanceof Error ? err.message : String(err)}`,
    ),
  );
  process.exit(1);
}

// ── Get access token via ADC (gcloud) ───────────────────────────

async function getAccessToken(): Promise<string> {
  const { execSync } = await import("node:child_process");
  try {
    return execSync("gcloud auth print-access-token", {
      encoding: "utf-8",
    }).trim();
  } catch {
    console.error(
      red("Error: Could not get access token. Run 'gcloud auth login' first."),
    );
    process.exit(1);
  }
}

// ── Fetch live indexes from Firestore API ───────────────────────

interface ApiField {
  fieldPath: string;
  order?: string;
  arrayConfig?: string;
}

interface ApiIndex {
  name: string;
  queryScope: string;
  fields: ApiField[];
  state: string;
}

async function fetchLiveIndexes(token: string): Promise<ApiIndex[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/collectionGroups/-/indexes`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(red(`Firestore API error (${res.status}): ${body}`));
    process.exit(1);
  }

  const data = await res.json();
  return (data.indexes ?? []) as ApiIndex[];
}

// ── Match local indexes against live ────────────────────────────

function normalizeOrder(order?: string): string {
  return (order ?? "ASCENDING").toUpperCase();
}

function fieldsMatch(local: LocalField[], remote: ApiField[]): boolean {
  // Remote indexes may include a __name__ field auto-appended by Firestore
  const remoteFiltered = remote.filter((f) => f.fieldPath !== "__name__");

  if (local.length !== remoteFiltered.length) return false;

  return local.every((lf, i) => {
    const rf = remoteFiltered[i];
    if (lf.fieldPath !== rf.fieldPath) return false;
    if (lf.arrayConfig || rf.arrayConfig) {
      return (lf.arrayConfig ?? "") === (rf.arrayConfig ?? "");
    }
    return normalizeOrder(lf.order) === normalizeOrder(rf.order);
  });
}

function extractCollection(apiName: string): string {
  // Format: projects/X/databases/(default)/collectionGroups/Y/indexes/Z
  const parts = apiName.split("/");
  const cgIdx = parts.indexOf("collectionGroups");
  return cgIdx !== -1 ? parts[cgIdx + 1] : "unknown";
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
const token = await getAccessToken();
const liveIndexes = await fetchLiveIndexes(token);

let allReady = true;

// Table header
console.log(
  `  ${"Collection".padEnd(28)} ${"Fields".padEnd(40)} ${"Status".padEnd(10)}`,
);
console.log(`  ${"─".repeat(28)} ${"─".repeat(40)} ${"─".repeat(10)}`);

for (const local of localIndexes) {
  const fieldsDesc = local.fields
    .map(
      (f) => `${f.fieldPath} ${(f.order ?? f.arrayConfig ?? "").toLowerCase()}`,
    )
    .join(", ");

  // Find matching live index
  const match = liveIndexes.find((live) => {
    const collection = extractCollection(live.name);
    if (collection !== local.collectionGroup) return false;
    return fieldsMatch(local.fields, live.fields);
  });

  let status: string;
  if (!match) {
    status = red("MISSING");
    allReady = false;
  } else if (match.state === "READY") {
    status = green("READY");
  } else if (match.state === "CREATING") {
    status = yellow("CREATING");
    allReady = false;
  } else {
    status = yellow(match.state);
    allReady = false;
  }

  console.log(
    `  ${local.collectionGroup.padEnd(28)} ${fieldsDesc.padEnd(40)} ${status}`,
  );
}

// Summary
console.log(`\n${bold("─".repeat(50))}`);
if (allReady) {
  console.log(green("\n  ✓ All indexes are READY.\n"));
} else {
  console.log(
    yellow(
      "\n  ⚠ Some indexes are not ready. Deploy with:\n" +
        `    firebase deploy --only firestore:indexes --project=${projectId}\n`,
    ),
  );
  process.exit(1);
}
}

main();
