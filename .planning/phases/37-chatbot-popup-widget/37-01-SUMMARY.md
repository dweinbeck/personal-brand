---
phase: 37-chatbot-popup-widget
plan: 01
subsystem: ui
tags: [react-context, popup-widget, chatbot, navbar, floating-panel]

# Dependency graph
requires:
  - phase: 36-tools-page-and-nav-restructure
    provides: "navbar with Ask My Assistant link for popup conversion"
provides:
  - "ChatWidgetContext for popup open/close state management"
  - "ChatPopupWidget floating panel shell"
  - "ChatInterface popup mode with compact layout"
  - "NavLinks Ask My Assistant toggle button"
affects: [37-02-chatbot-popup-widget, assistant-page]

# Tech tracking
tech-stack:
  added: []
  patterns: ["React context for cross-component widget state", "mode prop pattern for component layout variants"]

key-files:
  created:
    - src/context/ChatWidgetContext.tsx
    - src/components/assistant/ChatPopupWidget.tsx
  modified:
    - src/app/layout.tsx
    - src/components/assistant/ChatInterface.tsx
    - src/components/assistant/ChatInput.tsx
    - src/components/layout/NavLinks.tsx

key-decisions:
  - "ChatWidgetProvider wraps inside AuthProvider so popup can access auth if needed"
  - "Ask My Assistant converted from Link to button, no longer navigates to /assistant"
  - "Popup mode hides ChatHeader, ExitRamps, PrivacyDisclosure for space efficiency"

patterns-established:
  - "Mode prop pattern: components accept mode='page'|'popup' for layout variants"
  - "Widget context pattern: ChatWidgetContext provides isOpen/toggle/open/close"

# Metrics
duration: 10min
completed: 2026-02-15
---

# Phase 37 Plan 01: Chatbot Popup Widget Summary

**Persistent floating chatbot popup triggered from navbar toggle, with React context state and compact ChatInterface mode**

## Performance

- **Duration:** 10 min
- **Started:** 2026-02-15T22:44:56Z
- **Completed:** 2026-02-15T22:55:36Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Created ChatWidgetContext managing popup open/closed state with toggle/open/close actions
- Built ChatPopupWidget as a fixed-position floating panel (400x600px desktop, full-width mobile) with DW avatar header and close button
- Adapted ChatInterface with mode="popup" for compact layout: smaller icon, no description, 2-row input, hidden ExitRamps/PrivacyDisclosure
- Converted NavLinks "Ask My Assistant" from Link to toggle button with active state styling
- Wired ChatWidgetProvider and ChatPopupWidget into root layout for cross-navigation persistence

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ChatWidgetContext and ChatPopupWidget shell** - `440e25f` (feat)
2. **Task 2: Wire popup into layout, adapt ChatInterface, convert NavLinks toggle** - `a750322` (feat)

## Files Created/Modified
- `src/context/ChatWidgetContext.tsx` - React context managing popup widget open/closed state
- `src/components/assistant/ChatPopupWidget.tsx` - Floating popup shell with header, close button, ChatInterface
- `src/components/assistant/ChatInterface.tsx` - Added mode prop for page/popup layout variants
- `src/components/assistant/ChatInput.tsx` - Added configurable rows prop
- `src/components/layout/NavLinks.tsx` - Converted Ask My Assistant from Link to toggle button
- `src/app/layout.tsx` - Added ChatWidgetProvider and ChatPopupWidget to root layout

## Decisions Made
- ChatWidgetProvider placed inside AuthProvider so the popup can access auth context if needed
- Ask My Assistant is now a button (not a Link) -- no longer navigates to /assistant route
- Popup mode hides ExitRamps and PrivacyDisclosure to maximize chat space, keeps HumanHandoff visible
- Used useCallback for context actions to prevent unnecessary re-renders

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added mode prop to ChatInterface early in Task 1**
- **Found during:** Task 1 (ChatPopupWidget renders `<ChatInterface mode="popup" />`)
- **Issue:** Plan specified mode prop would be added in Task 2, but ChatPopupWidget imports it in Task 1
- **Fix:** Added minimal mode prop acceptance in Task 1 to allow build to pass
- **Files modified:** src/components/assistant/ChatInterface.tsx
- **Verification:** Build passes with both new files
- **Committed in:** 440e25f (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary to maintain build-per-task requirement. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Popup widget is fully functional and persists across navigation
- Ready for Phase 37 Plan 02 (polish, animations, or additional popup features if planned)
- The /assistant page still exists and works independently of the popup

## Self-Check: PASSED

All 6 files verified present. Both task commits (440e25f, a750322) verified in git log.

---
*Phase: 37-chatbot-popup-widget*
*Completed: 2026-02-15*
