---
phase: 21
plan: 01
subsystem: brand-scraper-ui
tags: [swr, polling, zod, brand-taxonomy, ui-components]
dependency-graph:
  requires: [20-01]
  provides: [useJobStatus-hook, brand-taxonomy-schema, url-submit-form, job-status-indicator, confidence-badge]
  affects: [21-02]
tech-stack:
  added: []
  patterns: [swr-polling, dynamic-refresh-interval, bearer-token-fetcher]
key-files:
  created:
    - src/lib/brand-scraper/hooks.ts
    - src/components/admin/brand-scraper/BrandConfidenceBadge.tsx
    - src/components/admin/brand-scraper/UrlSubmitForm.tsx
    - src/components/admin/brand-scraper/JobStatusIndicator.tsx
  modified:
    - src/lib/brand-scraper/types.ts
decisions:
  - id: "21-01-D1"
    description: "BrandTaxonomy schema uses .passthrough() and all-optional sections for API tolerance"
    rationale: "Exact scraper output shape is LOW confidence -- permissive validation avoids breaking on unexpected fields"
  - id: "21-01-D2"
    description: "BrandConfidenceBadge recreates pill styles instead of importing existing ConfidenceBadge"
    rationale: "Existing badge shows text labels, this one shows numeric percentages -- keeping both independent"
  - id: "21-01-D3"
    description: "SWR already installed (from prior phases), no package.json change needed"
    rationale: "swr@^2.4.0 already in dependencies"
metrics:
  duration: "4m 7s"
  completed: "2026-02-09"
---

# Phase 21 Plan 01: SWR and Polling Infrastructure Summary

**One-liner:** BrandTaxonomy Zod schema with typed job results, SWR polling hook with auto-stop, and form/status/confidence UI components.

## What Was Built

### BrandTaxonomy Schema (`src/lib/brand-scraper/types.ts`)
Extended the Phase 20 types file with a `brandTaxonomySchema` Zod object covering five optional sections:
- **colors**: hex, rgb, name, role, confidence, needs_review
- **fonts**: family, weights, usage, source, confidence, needs_review
- **logos**: url, format, dimensions, confidence, needs_review
- **assets**: url, type, format, confidence
- **identity**: tagline, industry

The `jobStatusSchema.result` field was upgraded from `z.unknown()` to `brandTaxonomySchema`, giving the `JobStatus` type full type safety on brand data. All schemas use `.passthrough()` for forward compatibility.

### useJobStatus Hook (`src/lib/brand-scraper/hooks.ts`)
SWR-based polling hook with dynamic refresh interval:
- Polls every 3 seconds via `refreshInterval`
- Stops automatically on terminal statuses: `succeeded`, `partial`, `failed`
- Timeout protection after 100 polls (~5 minutes)
- Bearer token included in every request (admin endpoint)
- Returns `{ data, error, isLoading, isPolling, isTerminal, isTimedOut, reset }`
- Conditional fetching: null key when no jobId or token (SWR skips request)

### BrandConfidenceBadge (`src/components/admin/brand-scraper/BrandConfidenceBadge.tsx`)
Maps a numeric 0-1 confidence score to a colored percentage pill badge:
- >= 85%: emerald (high confidence)
- >= 60%: amber (medium confidence)
- < 60%: red (low confidence)

Uses the same visual pattern as the assistant ConfidenceBadge (emerald/amber/red pill with dot) but displays numeric percentage instead of text labels.

### UrlSubmitForm (`src/components/admin/brand-scraper/UrlSubmitForm.tsx`)
URL input form following TutorialEditor patterns:
- Uses `useAuth()` for Firebase token
- POSTs to `/api/admin/brand-scraper/scrape` with Bearer authorization
- Calls `onJobSubmitted(job)` callback on success
- Shows error messages on failure
- Responsive: stacked on mobile, flex row on sm+

### JobStatusIndicator (`src/components/admin/brand-scraper/JobStatusIndicator.tsx`)
Visual status display with five known states:
- **queued**: neutral color, pulsing dot
- **processing**: amber, pulsing dot
- **succeeded**: emerald, static dot
- **partial**: amber, static dot
- **failed**: red, static dot
- Unknown statuses: raw string with neutral styling
- Shows "Polling..." indicator during active polling
- Shows timeout warning when max polls reached

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | `05f894f` | BrandTaxonomy schema and typed result |
| 2 | `dab3176` | useJobStatus SWR hook with dynamic polling |
| 3 | `e1ae0bc` | Brand scraper UI components (badge, form, status) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] SWR already installed**
- **Found during:** Task 1
- **Issue:** `npm install swr` returned "up to date" -- SWR was already in package.json from a prior phase
- **Fix:** No action needed; verified `swr@^2.4.0` in dependencies
- **Impact:** No package.json change in Task 1 commit

**2. [Rule 1 - Bug] Biome formatting violations**
- **Found during:** Task 3 verification
- **Issue:** Biome flagged formatting in hooks.ts (multiline Boolean expression) and UrlSubmitForm.tsx (Button props)
- **Fix:** Collapsed to single-line expressions matching Biome expectations
- **Files modified:** hooks.ts, UrlSubmitForm.tsx
- **Commit:** Included in `e1ae0bc`

## Quality Gates

| Gate | Status |
|------|--------|
| TypeScript (`tsc --noEmit`) | Pass |
| Lint (`biome check`) | Pass |
| Build (`next build`) | Pass |

## Next Phase Readiness

Plan 21-02 can proceed immediately. It will:
- Import `useJobStatus` from `hooks.ts`
- Import all three components from `components/admin/brand-scraper/`
- Build gallery sub-components (ColorCard, FontCard, LogoCard, AssetCard)
- Create the page orchestrator wiring everything together
