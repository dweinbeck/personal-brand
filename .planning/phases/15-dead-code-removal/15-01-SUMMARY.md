---
phase: 15-dead-code-removal
plan: 01
subsystem: cleanup
tags: [dead-code, admin, api-routes, refactor]

# Dependency graph
requires:
  - phase: 13-fastapi-proxy
    provides: active chat proxy route at /api/assistant/chat
  - phase: 14-citation-confidence-ui
    provides: ChatMessage with structured citations and confidence metadata
provides:
  - "Relocated handoff.ts to src/lib/utils/ (safe from assistant/ bulk deletion)"
  - "Deleted all assistant admin pages (/control-center/assistant/)"
  - "Deleted assistant admin API routes (facts, feedback, prompt-versions, reindex)"
  - "Deleted 6 assistant-specific admin components"
affects: [15-02-dead-code-removal]

# Tech tracking
tech-stack:
  added: []
  patterns: []

key-files:
  created:
    - src/lib/utils/handoff.ts
  modified:
    - src/components/assistant/HumanHandoff.tsx

key-decisions:
  - "Move handoff.ts before deletion to prevent transient build failure"
  - "Delete assistant admin directory recursively rather than file-by-file"

patterns-established: []

# Metrics
duration: 3min
completed: 2026-02-08
---

# Phase 15 Plan 01: Admin Surface Removal Summary

**Relocated handoff.ts to src/lib/utils/ and deleted 12 assistant admin files (pages, API routes, components)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-08T23:34:13Z
- **Completed:** 2026-02-08T23:37:52Z
- **Tasks:** 2
- **Files modified:** 14 (2 created/modified, 12 deleted)

## Accomplishments
- Moved handoff.ts to src/lib/utils/ so HumanHandoff component survives the assistant/ directory cleanup in Plan 02
- Deleted the entire /control-center/assistant/ admin surface (dashboard page + facts editor page)
- Removed 4 assistant admin API routes (facts, feedback, prompt-versions, reindex)
- Removed 6 assistant-specific admin components (AssistantAnalytics, FactsEditor, PromptVersions, ReindexButton, TopQuestions, UnansweredQuestions)
- Preserved all active infrastructure: /api/assistant/chat, AdminGuard, RepoCard, TodoistBoard, TodoistProjectCard

## Task Commits

Each task was committed atomically:

1. **Task 1: Move handoff.ts and update import** - `3948729` (refactor)
2. **Task 2: Delete assistant admin pages, API routes, and components** - `c0efc8e` (feat)

## Files Created/Modified
- `src/lib/utils/handoff.ts` - Mailto link builder for HumanHandoff (moved from src/lib/assistant/handoff.ts)
- `src/components/assistant/HumanHandoff.tsx` - Updated import path to new handoff.ts location
- `src/app/control-center/assistant/page.tsx` - DELETED (assistant admin dashboard)
- `src/app/control-center/assistant/facts/page.tsx` - DELETED (facts editor page)
- `src/app/api/assistant/facts/route.ts` - DELETED (facts CRUD API)
- `src/app/api/assistant/feedback/route.ts` - DELETED (feedback API)
- `src/app/api/assistant/prompt-versions/route.ts` - DELETED (prompt versioning API)
- `src/app/api/assistant/reindex/route.ts` - DELETED (reindex trigger API)
- `src/components/admin/AssistantAnalytics.tsx` - DELETED
- `src/components/admin/FactsEditor.tsx` - DELETED
- `src/components/admin/PromptVersions.tsx` - DELETED
- `src/components/admin/ReindexButton.tsx` - DELETED
- `src/components/admin/TopQuestions.tsx` - DELETED
- `src/components/admin/UnansweredQuestions.tsx` - DELETED

## Decisions Made
- Moved handoff.ts first (Task 1) before bulk deletion (Task 2) to prevent any transient build breakage
- Used `rm -rf` for directory deletion of control-center/assistant/ and individual API route directories

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 can now safely delete remaining assistant library files in src/lib/assistant/ since all consumers of those files (admin pages, API routes, admin components) are gone
- The only remaining file in src/lib/assistant/ that has a live consumer is now relocated (handoff.ts -> src/lib/utils/handoff.ts)
- Active chat route (/api/assistant/chat) preserved and confirmed working via build

---
*Phase: 15-dead-code-removal*
*Completed: 2026-02-08*
