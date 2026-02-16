# Quick Task 008: Fix strange characters on Envelopes card

## Problem

The Envelopes app card (and potentially other long-description cards) shows faint artifact characters below the `line-clamp-3` truncation. This is caused by the `flex-1` class on the description `<p>` element fighting with `line-clamp-3` — flex-grow expands the element beyond the clamped height, allowing text to leak through.

## Tasks

### Task 1: Fix AppCard description overflow

**File:** `src/components/apps/AppCard.tsx`

**Change:** On line 31, remove `flex-1` from the description paragraph and add `overflow-hidden` to ensure text cannot leak past the line clamp. Move the `flex-1` behavior to a wrapper or rely on the card's flex layout differently.

The fix: Change the description `<p>` from:
```
className="mt-3 flex-1 text-sm text-text-secondary leading-relaxed line-clamp-3"
```
to:
```
className="mt-3 text-sm text-text-secondary leading-relaxed line-clamp-3 overflow-hidden"
```

And wrap the tech stack + button section in a `mt-auto` container to push them to the bottom (replacing the flex-1 push-down behavior).

## Verification

- Check all 4 app cards on the home page render cleanly with no character artifacts
- Cards should still be equal height with content pushed to bottom
- Truncation ellipsis should display correctly
