---
phase: 16-dependency-and-environment-cleanup
plan: 01
subsystem: infra
tags: [npm, cloud-run, cloud-build, fastapi, cleanup]

# Dependency graph
requires:
  - phase: 15-dead-code-removal
    provides: All code references to @ai-sdk/google removed; safe to uninstall
  - phase: 13-proxy-integration
    provides: FastAPI proxy route using CHATBOT_API_URL env var
provides:
  - Clean package.json without orphaned @ai-sdk/google dependency
  - Cloud Build config deploying CHATBOT_API_URL to Cloud Run
  - Accurate documentation reflecting FastAPI proxy architecture
affects: []

# Tech tracking
tech-stack:
  added: []
  removed: ["@ai-sdk/google"]
  patterns: []

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - cloudbuild.yaml
    - scripts/setup-cicd.sh
    - .env.local.example
    - docs/DEPLOYMENT.md
    - docs/TECHNICAL_DESIGN.md
    - docs/FRD.md

key-decisions:
  - "Retained ai and @ai-sdk/react packages -- actively used by FastAPI proxy route and ChatInterface"
  - "CHATBOT_API_URL passed as plain env var (not secret) since it is a URL, not a credential"

patterns-established: []

# Metrics
duration: 5min
completed: 2026-02-08
---

# Phase 16 Plan 01: Dependency and Environment Cleanup Summary

**Removed orphaned @ai-sdk/google package, updated Cloud Build to deploy CHATBOT_API_URL and drop google-ai-api-key secret, updated all docs to reflect FastAPI proxy architecture**

## Performance

- **Duration:** 5 min
- **Started:** 2026-02-09T00:15:03Z
- **Completed:** 2026-02-09T00:19:46Z
- **Tasks:** 3/3
- **Files modified:** 8

## Accomplishments
- Uninstalled @ai-sdk/google -- zero orphaned Gemini SDK dependencies remain
- Cloud Build config now deploys CHATBOT_API_URL to Cloud Run and no longer references the google-ai-api-key secret
- All three documentation files (DEPLOYMENT.md, TECHNICAL_DESIGN.md, FRD.md) updated to reflect FastAPI proxy architecture
- Zero stale references to GOOGLE_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, @ai-sdk/google, or google-ai-api-key outside of planning docs

## Task Commits

Each task was committed atomically:

1. **Task 1: Uninstall @ai-sdk/google and verify build** - `d0b56f5` (chore)
2. **Task 2: Update CI/CD configuration files** - `5c53adc` (feat)
3. **Task 3: Update documentation to reflect FastAPI proxy architecture** - `9d1543a` (docs)

## Files Created/Modified
- `package.json` - Removed @ai-sdk/google from dependencies
- `package-lock.json` - Updated lockfile after uninstall
- `cloudbuild.yaml` - Added CHATBOT_API_URL to --set-env-vars and substitutions; removed google-ai-api-key from --update-secrets
- `scripts/setup-cicd.sh` - Removed google-ai-api-key secret creation and IAM binding
- `.env.local.example` - Updated AI Assistant section to reference FastAPI proxy with accurate URL placeholder
- `docs/DEPLOYMENT.md` - Replaced all GOOGLE_API_KEY references with CHATBOT_API_URL
- `docs/TECHNICAL_DESIGN.md` - Updated architecture diagram, data flow, integration section, error handling, and ADRs from Gemini direct to FastAPI RAG proxy
- `docs/FRD.md` - Updated ASST-02, ASST-03, ASST-19 to reference FastAPI backend

## Decisions Made
- Retained `ai` and `@ai-sdk/react` packages -- actively used by the FastAPI proxy route handler and ChatInterface component
- CHATBOT_API_URL passed as a plain environment variable (not a secret) since it is a service URL, not a credential

## Deviations from Plan

None -- plan executed exactly as written.

## User Setup Required

**External services require manual configuration.** See [16-USER-SETUP.md](./16-USER-SETUP.md) for:
- Adding `_CHATBOT_API_URL` substitution variable to Cloud Build trigger
- Deleting orphaned `google-ai-api-key` secret from Secret Manager
- Optionally revoking the Gemini API key in Google AI Studio

## Next Phase Readiness
- v1.3 migration is complete -- all code, config, and documentation now reflect the FastAPI proxy architecture
- Ready for production deployment (push to master triggers Cloud Build)
- User must configure `_CHATBOT_API_URL` in Cloud Build trigger before deploying

---
*Phase: 16-dependency-and-environment-cleanup*
*Completed: 2026-02-08*
