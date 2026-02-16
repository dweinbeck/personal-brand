# Quick Task 008 Summary: Fix strange characters on Envelopes card

## Problem
The Envelopes app card on the home page displayed faint artifact characters below the 3-line truncated description text. This was a recurring issue.

## Root Cause
The `flex-1` class on the description `<p>` element conflicted with `line-clamp-3`. `flex-1` (which sets `flex: 1 1 0%`) expanded the paragraph to fill available vertical space, overriding the implicit height constraint that `line-clamp-3` relies on. This allowed partially-rendered glyphs from the 4th line of text to "leak" through visually.

## Fix
**File:** `src/components/apps/AppCard.tsx`

1. Removed `flex-1` from the description paragraph
2. Added `overflow-hidden` to the description paragraph for explicit overflow clipping
3. Wrapped the tech stack badges and "Enter App" button in a `mt-auto` container to maintain bottom-alignment without relying on the description to push content down

## Verification
- All 4 app cards (Brands, Tasks, Envelopes, Research) render cleanly with no character artifacts
- Cards maintain equal-height layout with content properly bottom-aligned
- Text truncation with ellipsis works correctly on all cards
- Build and lint pass with zero errors
