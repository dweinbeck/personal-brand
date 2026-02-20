---
phase: 03-llm-router-destination-handlers
plan: 03
status: complete
---

## One-liner
Created Tasks destination handler and admin query helpers for Builder Inbox (Phase 4).

## What Changed
| File | Change |
|------|--------|
| src/lib/gsd/destinations/tasks.ts | New file — routeToTask creates tasks via direct service layer import with effort scoring |
| src/lib/gsd/capture.ts | Added getAllCaptures (paginated, filterable) and getCaptureCounts (Firestore count aggregation) |
| src/lib/env.ts | Added GSD_TASKS_USER_ID and GSD_TASKS_PROJECT_ID env vars (optional) |

## Key Decisions
- Direct service layer import (no HTTP round-trip) — Tasks lives in same app
- Effort score mapped from routing priority (high=3, medium=2, low=1)
- getAllCaptures supports status filtering for admin inbox tabs
- getCaptureCounts uses Firestore count() aggregation (no full doc reads)

## Verification
- npm run lint: 0 errors
- npm run build: 0 errors
- npm test: 227 passed
