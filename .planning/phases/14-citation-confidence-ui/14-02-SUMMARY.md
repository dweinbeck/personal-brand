---
phase: 14-citation-confidence-ui
plan: 02
subsystem: ui
tags: [react, citations, confidence-badge, details-summary, parts-array, zod, tailwind]

# Dependency graph
requires:
  - phase: 14-citation-confidence-ui
    provides: Structured source-url chunks and messageMetadata confidence from route handler
provides:
  - CitationList component with collapsible GitHub permalink links
  - ConfidenceBadge component with color-coded high/medium/low indicators
  - ChatMessage accepting parts array and metadata instead of content string
  - ChatInterface wired with messageMetadataSchema for type-safe confidence
  - RAG-aware suggested prompts and updated privacy disclosure
affects: [15-dead-code-removal (ChatMessage API changed), 16-dependency-cleanup]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "ChatMessage parts-based rendering: filter by type for text and source-url"
    - "useChat generic parameterization: UIMessage<ChatMetadata> for typed metadata"
    - "HTML details/summary for collapsible UI without JavaScript"

key-files:
  created:
    - src/components/assistant/CitationList.tsx
    - src/components/assistant/ConfidenceBadge.tsx
  modified:
    - src/components/assistant/ChatMessage.tsx
    - src/components/assistant/ChatInterface.tsx
    - src/components/assistant/SuggestedPrompts.tsx
    - src/components/assistant/PrivacyDisclosure.tsx

key-decisions:
  - "useChat<UIMessage<ChatMetadata>> generic for type-safe metadata (messageMetadataSchema alone does not infer types)"
  - "HTML details/summary for collapsible citations (no JS, no state, accessible)"
  - "CitationList returns null for empty citations (no empty Sources (0) section)"

patterns-established:
  - "Parts-based message rendering: ChatMessage accepts parts[] not content string"
  - "Metadata typing: define ChatMetadata type + pass as UIMessage generic to useChat"
  - "Collapsible UI pattern: native details/summary with Tailwind styling"

# Metrics
duration: 12min
completed: 2026-02-08
---

# Phase 14 Plan 02: Frontend Citation/Confidence UI Summary

**CitationList and ConfidenceBadge components with parts-based ChatMessage rendering and zod-typed metadata schema**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-08T22:33:00Z
- **Completed:** 2026-02-08T22:45:00Z
- **Tasks:** 2 (+ 1 human-verify checkpoint, approved)
- **Files modified:** 6

## Accomplishments
- Created CitationList component with collapsible details/summary section and GitHub permalink links
- Created ConfidenceBadge component with three color-coded variants (green/amber/red)
- Refactored ChatMessage from content-string to parts-array rendering with citation and confidence support
- Wired ChatInterface with zod messageMetadataSchema and UIMessage generic for type-safe metadata
- Updated SuggestedPrompts with RAG-aware questions and PrivacyDisclosure with external service mention

## Task Commits

Each task was committed atomically:

1. **Task 1: Create CitationList and ConfidenceBadge components, update ChatMessage** - `760d74b` (feat)
2. **Task 2: Wire ChatInterface, update SuggestedPrompts and PrivacyDisclosure** - `ac845a3` (feat)

## Files Created/Modified
- `src/components/assistant/CitationList.tsx` - Collapsible source list with document icons and GitHub permalink links
- `src/components/assistant/ConfidenceBadge.tsx` - Color-coded inline badge (high/medium/low) with dot indicator
- `src/components/assistant/ChatMessage.tsx` - Refactored to accept parts[] and metadata, renders citations and confidence
- `src/components/assistant/ChatInterface.tsx` - Added zod metadataSchema, UIMessage generic, passes parts/metadata to ChatMessage
- `src/components/assistant/SuggestedPrompts.tsx` - RAG-aware prompts replacing generic ones
- `src/components/assistant/PrivacyDisclosure.tsx` - Updated text mentioning external AI service

## Decisions Made
- Used `useChat<UIMessage<ChatMetadata>>` explicit generic because `messageMetadataSchema` alone does not infer TypeScript types from zod at the useChat call site
- Used native HTML `<details>/<summary>` for collapsible citations -- zero JavaScript, accessible by default, progressive enhancement
- CitationList returns `null` for empty citations array to avoid rendering empty "Sources (0)" UI

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Updated ChatInterface ChatMessage props in Task 1**
- **Found during:** Task 1 (tsc --noEmit verification)
- **Issue:** ChatMessage's props changed from `content: string` to `parts: Array<...>`, but ChatInterface still passed `content={...}`, causing TypeScript compilation error
- **Fix:** Updated ChatInterface's ChatMessage usage to pass `parts={message.parts}` and `metadata={message.metadata}` in Task 1 (with temporary type cast), then replaced cast with proper zod schema + generic in Task 2
- **Files modified:** src/components/assistant/ChatInterface.tsx
- **Verification:** `npx tsc --noEmit` passes after fix
- **Committed in:** `760d74b` (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to pass Task 1 type checking. The cast was properly replaced with schema-based typing in Task 2. No scope creep.

## Issues Encountered
- `messageMetadataSchema` does not automatically infer TypeScript types for `message.metadata` -- the `useChat` hook defaults `UI_MESSAGE` to `UIMessage` (with `metadata: unknown`) unless an explicit generic is provided. Solved by defining `ChatMetadata` type and passing `useChat<UIMessage<ChatMetadata>>`.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 14 complete: citation and confidence UI fully functional
- ASST-04 requirement delivered
- Ready for Phase 15 (Dead Code Removal) -- ChatMessage API has changed from content string to parts array, downstream consumers should be aware
- No blockers

---
*Phase: 14-citation-confidence-ui*
*Completed: 2026-02-08*
