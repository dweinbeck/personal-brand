---
phase: 20-brand-scraper-api-proxy
plan: 01
subsystem: api
tags: [zod, fetch, proxy, fastify, brand-scraper, firebase-admin, admin-auth]

# Dependency graph
requires:
  - phase: 13-assistant-api
    provides: verifyAdmin auth pattern, FastApiError client pattern, Zod schema validation
provides:
  - POST /api/admin/brand-scraper/scrape route with admin auth
  - GET /api/admin/brand-scraper/jobs/[id] route with admin auth
  - BrandScraperError typed error class
  - submitScrapeJob and getScrapeJobStatus typed client functions
  - Zod schemas for scrape request, job submission, and job status
affects: [21-brand-scraper-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Async job proxy: submit job + poll status via two separate API routes"
    - "Error body extraction: read JSON error field from non-200 external responses"

key-files:
  created:
    - src/lib/brand-scraper/types.ts
    - src/lib/brand-scraper/client.ts
    - src/app/api/admin/brand-scraper/scrape/route.ts
    - src/app/api/admin/brand-scraper/jobs/[id]/route.ts
  modified:
    - .env.local.example

key-decisions:
  - "z.string() for job status (not z.enum) -- exact values unconfirmed from Fastify service"
  - "z.unknown().optional() for result field -- BrandTaxonomy schema deferred to Phase 21"
  - ".passthrough() on jobStatusSchema -- tolerate unexpected extra fields from Fastify"
  - "30s timeout for submit, 10s for poll -- accounts for Cloud Run cold starts"
  - "site_url as POST body field name -- best guess per ARCHITECTURE.md"

patterns-established:
  - "Async job proxy: two routes (submit + poll) with admin auth on both"
  - "Error body extraction: attempt to read error message from non-200 response JSON"

# Metrics
duration: 3min
completed: 2026-02-08
---

# Phase 20 Plan 01: Brand Scraper API Proxy Summary

**Typed HTTP client and admin-authenticated API routes proxying to external Brand Scraper Fastify service with Zod response validation**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-09T05:56:19Z
- **Completed:** 2026-02-09T05:59:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Typed HTTP client with BrandScraperError class, 30s/10s timeouts, and error body extraction
- Zod schemas for all external API shapes with passthrough for forward compatibility
- Two admin-authenticated API routes (POST scrape, GET poll) mirroring chatbot proxy pattern
- BRAND_SCRAPER_API_URL documented in .env.local.example

## Task Commits

Each task was committed atomically:

1. **Task 1: Brand scraper Zod schemas and typed HTTP client** - `576edb3` (feat)
2. **Task 2: API route handlers and env var documentation** - `2f93507` (feat)

## Files Created/Modified
- `src/lib/brand-scraper/types.ts` - Zod schemas (scrapeRequestSchema, scrapeJobSubmissionSchema, jobStatusSchema) and TypeScript types
- `src/lib/brand-scraper/client.ts` - BrandScraperError class, submitScrapeJob (30s timeout), getScrapeJobStatus (10s timeout) with error body extraction
- `src/app/api/admin/brand-scraper/scrape/route.ts` - POST handler: verifyAdmin -> parse JSON -> validate with Zod -> proxy to Fastify
- `src/app/api/admin/brand-scraper/jobs/[id]/route.ts` - GET handler: verifyAdmin -> await async params -> proxy to Fastify
- `.env.local.example` - Added BRAND_SCRAPER_API_URL with descriptive comments

## Decisions Made
- Used `z.string()` for job status field (not `z.enum()`) because exact Fastify status values are unconfirmed
- Used `z.unknown().optional()` for the result field -- BrandTaxonomy Zod schema deferred to Phase 21 when the UI needs to parse it
- Applied `.passthrough()` on jobStatusSchema to tolerate unexpected extra fields from the Fastify service
- Set 30-second timeout for job submission (vs chatbot's 15s) to account for Cloud Run cold starts
- Set 10-second timeout for status polling (lightweight check)
- Used `site_url` as the POST body field name per ARCHITECTURE.md (may need adjustment when testing against live Fastify service)
- Improved on chatbot client pattern by extracting error messages from non-200 response bodies

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Biome import ordering**
- **Found during:** Task 2 (API route handlers)
- **Issue:** Biome requires alphabetically sorted named imports; `verifyAdmin, unauthorizedResponse` was not sorted
- **Fix:** Reordered to `unauthorizedResponse, verifyAdmin` in both route files and fixed type import ordering in client.ts
- **Files modified:** `src/app/api/admin/brand-scraper/scrape/route.ts`, `src/app/api/admin/brand-scraper/jobs/[id]/route.ts`, `src/lib/brand-scraper/client.ts`
- **Verification:** `npm run lint` passes cleanly
- **Committed in:** `2f93507` (part of Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Trivial import ordering fix. No scope creep.

## Issues Encountered
None

## User Setup Required
None for this phase -- BRAND_SCRAPER_API_URL must be configured in Cloud Build trigger before deploying brand scraper features (documented as existing blocker in STATE.md).

## Next Phase Readiness
- API proxy layer complete and ready for Phase 21 (Brand Scraper UI)
- Phase 21 can import `submitScrapeJob` and `getScrapeJobStatus` from `@/lib/brand-scraper/client`
- Phase 21 can import Zod schemas from `@/lib/brand-scraper/types` for client-side validation
- The `result` field and job status values will need tightening in Phase 21 after confirming actual Fastify response shapes

---
*Phase: 20-brand-scraper-api-proxy*
*Completed: 2026-02-08*
