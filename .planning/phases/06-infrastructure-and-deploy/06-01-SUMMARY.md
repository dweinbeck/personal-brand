# Phase 06 Plan 01: Docker and Standalone Config Summary

**One-liner:** Multi-stage Dockerfile on node:20-alpine with standalone Next.js output and dual-mode Firebase ADC credentials

## What Was Built

Created all Docker infrastructure and configuration for production-ready Next.js deployment on GCP Cloud Run:

1. **Standalone output mode** -- next.config.ts now produces a self-contained server.js with all dependencies bundled
2. **Dual-mode Firebase credentials** -- firebase.ts uses Application Default Credentials (ADC) on Cloud Run (detected via K_SERVICE env var) and falls back to explicit cert() credentials for local development
3. **Sharp dependency** -- Added for next/image optimization in standalone Alpine containers
4. **Three-stage Dockerfile** -- deps (npm ci), builder (next build), runner (non-root nextjs user on Alpine)
5. **.dockerignore** -- Excludes .git, node_modules, .next, .env*, .planning, and other non-essential files from build context

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Standalone config, firebase.ts ADC refactor, and sharp dependency | 14ac002 | Done |
| 2 | Dockerfile, .dockerignore, and image build verification | bc9183f | Done |

## Files Modified

### Created
- `Dockerfile` -- Three-stage multi-stage build (deps -> builder -> runner) on node:20-alpine
- `.dockerignore` -- Excludes build-irrelevant files from Docker context

### Modified
- `next.config.ts` -- Added `output: "standalone"` as first config property
- `src/lib/firebase.ts` -- Refactored to getCredential() with K_SERVICE detection for ADC
- `package.json` -- Added sharp ^0.34.3 to dependencies
- `package-lock.json` -- Updated lockfile

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| ADC detection via K_SERVICE env var | Cloud Run automatically sets K_SERVICE; no custom env var needed |
| getCredential() helper function | Clean separation of credential logic; three paths: Cloud Run ADC, local cert(), fallback undefined |
| sharp ^0.34.3 | Required for next/image in standalone mode on Alpine; npm resolved to 0.34.5 |

## Deviations from Plan

### Docker Build Verification Skipped

**Task 2** called for building and running the Docker image to verify size (<150MB) and HTTP 200 response. Docker is not installed on this machine, so the build/size/runtime verification could not be performed. The Dockerfile follows the official Next.js Docker example and is structurally correct. Docker build verification should be performed when Docker is available.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` produces standalone output | PASS -- .next/standalone/server.js exists |
| `grep "standalone" next.config.ts` | PASS |
| `grep "K_SERVICE" src/lib/firebase.ts` | PASS |
| `grep "applicationDefault" src/lib/firebase.ts` | PASS |
| `grep "sharp" package.json` | PASS |
| `npm list sharp` | PASS -- sharp@0.34.5 |
| `npx biome check .` | PASS -- no errors |
| Docker image builds | SKIPPED -- Docker not installed |
| Docker image under 150MB | SKIPPED -- Docker not installed |
| Container responds HTTP 200 | SKIPPED -- Docker not installed |
| Container runs as non-root | SKIPPED -- Docker not installed (Dockerfile specifies USER nextjs) |

## Duration

~2 minutes
