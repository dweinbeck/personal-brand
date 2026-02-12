# Phase 31: Help Tips - Research

**Researched:** 2026-02-11
**Domain:** Accessible tooltip/toggletip component, ARIA patterns, viewport-aware positioning
**Confidence:** HIGH

## Summary

Phase 31 adds contextual help tips (gold "?" icons) to the todoist app at `/Users/dweinbeck/Documents/todoist`. The todoist codebase is a Next.js 16 + React 19 + Tailwind CSS 4 app with Prisma/PostgreSQL, using the same navy/gold brand palette as the personal-brand site. It has a minimal dependency footprint (no UI library beyond Tailwind, using `clsx` for class merging) and all existing UI components are custom-built in `src/components/ui/`.

The correct accessibility pattern here is a **toggletip** (not a pure tooltip). Pure ARIA tooltips appear on hover/focus and use `aria-describedby` -- they are supplementary labels for controls that already have visible labels. What the requirements describe (a dedicated "?" icon button that reveals help text, with tap-to-toggle on mobile) is a toggletip: an interactive button that shows supplementary information on click/tap, with hover/focus as progressive enhancement on desktop. The toggletip pattern uses `role="status"` (live region) instead of `role="tooltip"` + `aria-describedby`, as recommended by Heydon Pickering's Inclusive Components. However, since the requirements explicitly specify "ARIA tooltip role," the implementation should use `role="tooltip"` with `aria-describedby` as specified, while still implementing toggletip interaction behavior (click/tap to toggle, hover/focus as additional triggers).

No new dependencies are needed. Viewport-aware positioning can be achieved with a lightweight custom hook that measures element position relative to the viewport and flips placement accordingly. CSS Anchor Positioning is NOT Baseline Widely Available yet (only "Newly Available" as of Jan 2026), so it should not be used. The Popover API IS Baseline Widely Available but adds complexity for what is a simple absolute-positioned bubble. A pure CSS/JS approach with manual viewport detection is the right fit for this codebase's zero-dependency UI philosophy.

**Primary recommendation:** Build a single `HelpTip` client component in `src/components/ui/help-tip.tsx` with a centralized tip catalog in `src/data/help-tips.ts`. Use `role="tooltip"` + `aria-describedby` per requirements, with click/tap toggle + hover/focus triggers. Position with a lightweight `useTooltipPosition` hook that flips placement when near viewport edges.

## Standard Stack

### Core (already in todoist)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 19.2.3 | Component framework | Already in project |
| Next.js | 16.1.6 | App Router, RSC | Already in project |
| Tailwind CSS | 4.x | Utility-first styling | Already in project |
| clsx | 2.1.1 | Conditional class merging (via `cn()` util) | Already in project |

### Supporting (no new dependencies needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| N/A | - | - | Zero new deps required |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom positioning | @floating-ui/react (~3kB) | Overkill for simple tooltips; adds a dependency to a zero-UI-lib codebase |
| Custom positioning | CSS Anchor Positioning | Not Baseline Widely Available yet (Jan 2026 newly available); Safari 26+ and Firefox 147+ only |
| Custom component | Radix UI Tooltip | Brings in entire Radix dependency for one component; violates codebase's custom-UI philosophy |
| Custom component | HTML Popover API | Baseline available, but more complex than needed; no built-in hover trigger; better for menus/dialogs |

## Architecture Patterns

### Recommended Project Structure
```
src/
  components/
    ui/
      help-tip.tsx         # HelpTip client component
  data/
    help-tips.ts           # Centralized tip catalog (TIPS-03)
  lib/
    hooks/
      use-tooltip-position.ts  # Viewport-aware positioning hook
```

### Pattern 1: Centralized Tip Catalog
**What:** All help tip text lives in a single TypeScript file as a typed record, keyed by a string identifier.
**When to use:** Always -- this is a hard requirement (TIPS-03).
**Example:**
```typescript
// src/data/help-tips.ts
export type HelpTipId =
  | "sidebar-workspaces"
  | "sidebar-quick-add"
  | "board-view-toggle"
  | "task-sections"
  | "task-tags"
  | "task-subtasks"
  | "search-tasks"
  | "filters-tags";

export const helpTips: Record<HelpTipId, string> = {
  "sidebar-workspaces":
    "Workspaces group your projects. Click + to create one.",
  "sidebar-quick-add":
    "Quickly add a task to any project without navigating away.",
  "board-view-toggle":
    "Switch between list and board (Kanban) views for your project.",
  "task-sections":
    "Sections organize tasks within a project. Drag tasks between sections.",
  "task-tags":
    "Tags let you categorize tasks across projects. Filter by tag to find related tasks.",
  "task-subtasks":
    "Break large tasks into smaller subtasks. Check them off independently.",
  "search-tasks":
    "Search across all tasks by name. Results update as you type.",
  "filters-tags":
    "Create and manage tags here. Click a tag to see all tasks with that tag.",
};
```

### Pattern 2: HelpTip Component (Toggletip with Tooltip ARIA)
**What:** A `"use client"` component that renders a gold "?" icon button. On click/tap it toggles a tooltip bubble. On desktop, hover/focus also show it. Escape dismisses it. Uses `role="tooltip"` and `aria-describedby` per requirements.
**When to use:** Place next to any UI element that needs contextual help.
**Example:**
```typescript
// src/components/ui/help-tip.tsx
"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { helpTips, type HelpTipId } from "@/data/help-tips";
import { cn } from "@/lib/utils";

interface HelpTipProps {
  tipId: HelpTipId;
  className?: string;
}

export function HelpTip({ tipId, className }: HelpTipProps) {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const text = helpTips[tipId];

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !triggerRef.current?.contains(target) &&
        !tooltipRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [open]);

  return (
    <span className={cn("relative inline-flex items-center", className)}>
      <button
        ref={triggerRef}
        type="button"
        aria-describedby={open ? tooltipId : undefined}
        onClick={() => setOpen((prev) => !prev)}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="w-5 h-5 rounded-full bg-gold/20 text-gold hover:bg-gold/30
                   flex items-center justify-center text-xs font-bold
                   transition-colors cursor-pointer focus:outline-none
                   focus:ring-2 focus:ring-gold/50"
      >
        ?
      </button>
      {open && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2
                     px-3 py-2 text-xs text-white bg-primary rounded-lg
                     shadow-lg max-w-[200px] w-max pointer-events-auto"
        >
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2
                          border-4 border-transparent border-t-primary" />
        </div>
      )}
    </span>
  );
}
```

### Pattern 3: Viewport-Aware Positioning Hook
**What:** A custom hook that checks the trigger element's position relative to the viewport and returns the optimal placement direction (top, bottom, left, right).
**When to use:** Inside the HelpTip component to prevent tooltips from being clipped by viewport edges.
**Example:**
```typescript
// src/lib/hooks/use-tooltip-position.ts
import { useCallback, useState } from "react";

type Placement = "top" | "bottom";

export function useTooltipPosition() {
  const [placement, setPlacement] = useState<Placement>("top");

  const updatePlacement = useCallback((triggerEl: HTMLElement | null) => {
    if (!triggerEl) return;
    const rect = triggerEl.getBoundingClientRect();
    // If less than 80px above trigger, flip to bottom
    setPlacement(rect.top < 80 ? "bottom" : "top");
  }, []);

  return { placement, updatePlacement };
}
```

### Pattern 4: Mobile Tap-to-Toggle
**What:** On mobile/touch devices, the tooltip toggles on tap rather than hover. The same `onClick` handler naturally covers this. Hover/focus handlers are progressive enhancement that only fire on desktop.
**When to use:** Built into the HelpTip component -- no separate mobile detection needed. The `onClick` toggle covers tap, and `onMouseEnter`/`onMouseLeave` only fire on pointer devices.

### Anti-Patterns to Avoid
- **Scattering tip text in components:** All text MUST live in `src/data/help-tips.ts`. Components only reference tip IDs.
- **Using `title` attribute as tooltip:** `title` is not reliably accessible, not styleable, and behaves inconsistently across browsers and screen readers.
- **Interactive content in tooltips:** Tooltips must NOT contain links, buttons, or form elements. If interactive content is needed, use a dialog/popover instead.
- **Tooltips on non-focusable elements:** The trigger MUST be a `<button>` element (not a `<span>` or `<div>`) so keyboard users can reach it.
- **Using `aria-describedby` without `role="tooltip"`:** Per the ARIA spec, these must be paired together.
- **Forgetting `pointer-events: auto` on tooltip bubble:** If the tooltip is inside a relatively-positioned container, ensure the bubble itself can receive mouse events (to stay open on hover-over).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Complex floating positioning | Full positioning engine with collision detection, scrollable containers, portals | Simple viewport boundary check | The todoist app has no complex scroll containers or deeply nested positioning contexts; a simple `getBoundingClientRect()` check is sufficient |
| Touch device detection | `navigator.userAgent` parsing or `window.matchMedia('(hover: none)')` | `onClick` toggle for all devices | Click/tap works on both mobile and desktop; hover is progressive enhancement. No detection needed. |
| Tooltip arrow positioning | Dynamic arrow rotation and offset calculation | CSS border trick with fixed positioning | A CSS triangle via `border` properties is simpler and sufficient for top/bottom placement |

**Key insight:** This is a simple help-tip overlay on a straightforward layout. The todoist app has no complex scrollable containers, nested overflow contexts, or portals that would require a full positioning library. A lightweight custom solution is both simpler and more aligned with the codebase's zero-dependency UI approach.

## Common Pitfalls

### Pitfall 1: Hover/Focus Conflicts with Click Toggle on Desktop
**What goes wrong:** User hovers to open, then clicks to "lock" it open, then moves mouse away -- `onMouseLeave` closes it even though user clicked to keep it open.
**Why it happens:** Competing open/close triggers without distinguishing interaction mode.
**How to avoid:** Track whether the tooltip was opened via click (pinned) vs hover. If pinned, ignore `onMouseLeave`. Only close on Escape, outside click, or another click on the trigger.
**Warning signs:** Tooltip flickers or unexpectedly closes on desktop after clicking the "?" icon.

### Pitfall 2: Tooltip Clipped by Viewport on Mobile
**What goes wrong:** Tooltip positioned above the trigger near the top of the screen gets clipped or hidden.
**Why it happens:** Fixed "top" placement without checking available space.
**How to avoid:** Use the `useTooltipPosition` hook to flip placement. Also apply `max-width` constraint and ensure `left`/`right` don't overflow horizontally.
**Warning signs:** Tooltip appears partially or fully off-screen.

### Pitfall 3: Screen Reader Not Announcing Tooltip Content
**What goes wrong:** Screen reader skips the tooltip entirely or reads it at the wrong time.
**Why it happens:** Missing `aria-describedby` linkage, or tooltip element not in DOM when `aria-describedby` references it.
**How to avoid:** Only set `aria-describedby` when the tooltip is open AND the tooltip element is rendered. The tooltip `id` must match exactly.
**Warning signs:** VoiceOver/NVDA testing reveals no announcement when tip opens.

### Pitfall 4: Multiple Tooltips Open Simultaneously
**What goes wrong:** User opens one help tip, then hovers over another -- both stay open, cluttering the UI.
**Why it happens:** Each HelpTip manages its own state independently.
**How to avoid:** Use a shared context or a simple document-level event that closes all other open tips when a new one opens. Alternatively, the outside-click handler naturally handles this since opening a new tip is an "outside click" for the previous one.
**Warning signs:** Two or more tooltip bubbles visible at the same time.

### Pitfall 5: Z-index Stacking Issues
**What goes wrong:** Tooltip renders behind modals, cards, or other elevated elements.
**Why it happens:** Tooltip `z-index` is too low or not set, or stacking context from parent `position: relative` elements interferes.
**How to avoid:** Set `z-50` on the tooltip (Tailwind's 50). The existing codebase uses `shadow-card-hover` and no extreme z-index values, so `z-50` should be sufficient.
**Warning signs:** Tooltip partially or fully obscured by adjacent UI elements.

### Pitfall 6: Biome Linter a11y Rules
**What goes wrong:** Biome's `a11y` rules flag missing attributes or patterns.
**Why it happens:** The todoist biome.json has `noSvgWithoutTitle: "off"` and `noAutofocus: "off"` but otherwise uses recommended a11y rules.
**How to avoid:** Ensure the `<button>` trigger has an accessible label (via the visible "?" text content or `aria-label`), and the tooltip has proper `role` and `id` attributes.
**Warning signs:** `npm run lint` fails with a11y errors.

## Code Examples

### Example 1: HelpTip Usage in a Component
```typescript
// In sidebar.tsx, next to "Workspaces" heading
import { HelpTip } from "@/components/ui/help-tip";

// Inside JSX:
<span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
  Workspaces
</span>
<HelpTip tipId="sidebar-workspaces" />
```

### Example 2: Tooltip Styling Aligned with Brand
```typescript
// Gold "?" icon button with navy tooltip bubble
// Uses existing CSS variables from globals.css:
// --color-gold: #c8a55a
// --color-gold-light: rgba(200, 165, 90, 0.12)
// --color-primary: #063970 (navy, used for tooltip background)

// Button: bg-gold/20 text-gold (subtle gold circle)
// Bubble: bg-primary text-white (navy background, white text)
// Arrow: border-t-primary (navy triangle pointing down)
```

### Example 3: Keyboard Navigation Test Pattern
```typescript
// In __tests__/help-tip.test.ts
import { describe, expect, it } from "vitest";

describe("HelpTip catalog", () => {
  it("every tip ID has non-empty text", () => {
    const { helpTips } = require("@/data/help-tips");
    for (const [id, text] of Object.entries(helpTips)) {
      expect(text).toBeTruthy();
      expect(typeof text).toBe("string");
      expect((text as string).length).toBeGreaterThan(0);
    }
  });
});
```

### Example 4: Viewport-Aware Placement CSS
```typescript
// Dynamic placement classes based on position hook
const placementClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
};

const arrowClasses = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-primary border-transparent",
  bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-primary border-transparent",
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Popper.js for positioning | Floating UI or CSS Anchor Positioning | 2022+ (Floating UI), 2025+ (CSS Anchor) | Floating UI is lighter; CSS Anchor is native but not yet widely available |
| `title` attribute for tooltips | ARIA `role="tooltip"` + `aria-describedby` | WAI-ARIA 1.1+ | `title` is unreliable for accessibility; ARIA pattern is standard |
| hover-only tooltips | Toggletip pattern (click + hover) | 2019+ (Inclusive Components) | Mobile-friendly; works for touch, keyboard, mouse |
| Inline tip text in components | Centralized content catalog | Best practice | Maintainability, consistency, easy translation |
| JavaScript tooltip libraries | Native Popover API + CSS Anchor | 2025-2026 | Zero-JS tooltip possible but browser support still limited |

**Deprecated/outdated:**
- **Popper.js:** Replaced by Floating UI. Popper.js is no longer maintained.
- **`title` attribute for tooltips:** Unreliable across screen readers; not styleable; not mobile-friendly.
- **`aria-haspopup` for tooltips:** Not appropriate for tooltips per ARIA spec; use `aria-describedby` instead.

## Open Questions

1. **Which specific UI elements should have help tips?**
   - What we know: The requirements say "key UI elements" but don't enumerate them specifically.
   - What's clear: The sidebar (workspaces, quick add), board/list view toggle, sections concept, tags/filters, and subtasks are the main concepts a new user would need explained.
   - Recommendation: Start with 6-8 help tips covering the most conceptually unfamiliar elements. The catalog is easily expandable. Suggested initial set: sidebar workspaces, quick add button, board/list toggle, sections, tags, subtasks, search, filters & tags page.

2. **Should tips persist after dismissal (e.g., "don't show again")?**
   - What we know: Requirements don't mention persistence or dismissal memory.
   - Recommendation: Do NOT implement persistence. Keep it simple -- tips always appear when triggered. This avoids needing localStorage or user preferences storage.

3. **Hover delay for desktop?**
   - What we know: WAI-ARIA suggests 1-5 second delay for hover-triggered tooltips.
   - Recommendation: Use a short delay (~300ms) for hover-open and a short delay (~150ms) for hover-close to prevent flicker. Click/tap should open immediately.

## Sources

### Primary (HIGH confidence)
- [W3C WAI-ARIA Tooltip Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) - ARIA attributes, keyboard interaction spec
- [MDN ARIA: tooltip role](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles/tooltip_role) - Role semantics and requirements
- [Inclusive Components: Tooltips & Toggletips](https://inclusive-components.design/tooltips-toggletips/) - Toggletip pattern, `role="status"`, click-to-toggle
- Todoist codebase at `/Users/dweinbeck/Documents/todoist` - Direct file inspection

### Secondary (MEDIUM confidence)
- [CSS Anchor Positioning - Can I Use](https://caniuse.com/css-anchor-positioning) - Browser support status (NOT Baseline Widely Available)
- [Popover API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) - Baseline Widely Available as of April 2025
- [Frontend Masters: Popover API for Tooltips](https://frontendmasters.com/blog/using-the-popover-api-for-html-tooltips/) - Implementation patterns with Floating UI
- [Floating UI](https://floating-ui.com/) - Lightweight positioning library (~3kB), successor to Popper.js

### Tertiary (LOW confidence)
- [TPGi: Standalone Toggletip Pattern](https://www.tpgi.com/simple-standalone-toggletip-widget-pattern/) - Alternative toggletip implementation
- [Sarah Higley: Tooltips in WCAG 2.1](https://sarahmhigley.com/writing/tooltips-in-wcag-21/) - WCAG compliance considerations

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Direct codebase inspection, zero new deps needed
- Architecture: HIGH - Well-established ARIA patterns, clear codebase structure to follow
- Pitfalls: HIGH - Known accessibility gotchas documented by W3C and accessibility experts
- Positioning: MEDIUM - Custom viewport detection is simpler but less battle-tested than Floating UI; acceptable for this use case

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable domain; ARIA patterns rarely change)
