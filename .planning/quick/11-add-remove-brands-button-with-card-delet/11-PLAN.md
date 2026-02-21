---
phase: quick
plan: 11
type: execute
wave: 1
depends_on: []
files_modified:
  - src/lib/brand-scraper/history.ts
  - src/app/api/tools/brand-scraper/history/route.ts
  - src/components/tools/brand-scraper/BrandProfileCards.tsx
  - src/components/tools/brand-scraper/BrandProfileCard.tsx
autonomous: true
requirements: [QUICK-11]
must_haves:
  truths:
    - "User sees a 'Remove Brands' button next to the 'Your Brand Profiles' heading"
    - "Clicking 'Remove Brands' toggles removal mode showing X overlays on each card"
    - "Clicking X on a card deletes it from Firestore and removes it from the UI immediately"
    - "Profile cards prefer PNG/SVG logos (transparent-background) over other formats"
  artifacts:
    - path: "src/lib/brand-scraper/history.ts"
      provides: "deleteHistoryEntry function"
      exports: ["deleteHistoryEntry"]
    - path: "src/app/api/tools/brand-scraper/history/route.ts"
      provides: "DELETE method for history entries"
      exports: ["GET", "DELETE"]
    - path: "src/components/tools/brand-scraper/BrandProfileCards.tsx"
      provides: "Remove Brands toggle button and removal mode state"
    - path: "src/components/tools/brand-scraper/BrandProfileCard.tsx"
      provides: "X delete overlay and transparent-background logo preference"
  key_links:
    - from: "src/components/tools/brand-scraper/BrandProfileCard.tsx"
      to: "/api/tools/brand-scraper/history"
      via: "fetch DELETE with jobId in request body"
      pattern: "fetch.*history.*DELETE"
    - from: "src/app/api/tools/brand-scraper/history/route.ts"
      to: "src/lib/brand-scraper/history.ts"
      via: "deleteHistoryEntry(uid, jobId)"
      pattern: "deleteHistoryEntry"
    - from: "src/components/tools/brand-scraper/BrandProfileCards.tsx"
      to: "src/components/tools/brand-scraper/BrandProfileCard.tsx"
      via: "removingMode and onDelete props"
      pattern: "removingMode|onDelete"
---

<objective>
Add a "Remove Brands" button to the brand profile cards section that toggles a removal mode with X overlays on each card, enabling deletion of individual brand profiles from Firestore history. Also improve logo selection to prefer PNG/SVG formats (transparent backgrounds) for profile card display images.

Purpose: Users currently cannot remove old or unwanted brand profiles from their history. This adds that capability with a clean toggle UX. The logo improvement ensures cards display the best available logo variant.
Output: Working delete flow (button -> X overlay -> API delete -> UI update) and smarter logo selection.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/lib/brand-scraper/history.ts
@src/app/api/tools/brand-scraper/history/route.ts
@src/components/tools/brand-scraper/BrandProfileCards.tsx
@src/components/tools/brand-scraper/BrandProfileCard.tsx
@src/lib/brand-scraper/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add delete history backend (Firestore + API route)</name>
  <files>src/lib/brand-scraper/history.ts, src/app/api/tools/brand-scraper/history/route.ts</files>
  <action>
In `src/lib/brand-scraper/history.ts`, add a `deleteHistoryEntry` function:
- Accept `{ uid, jobId }` params
- Build document ID as `${uid}_${jobId}` (matches existing convention from `addHistoryEntry`)
- Verify the document exists and that the `uid` field matches the provided uid (ownership check)
- If not found or uid mismatch, throw an error with message "History entry not found."
- Delete the document using `ref.delete()`
- Export the function

In `src/app/api/tools/brand-scraper/history/route.ts`, add a `DELETE` handler:
- Follow the existing pattern: `verifyUser` + `unauthorizedResponse` auth guard (same as GET)
- Parse request body as JSON to get `{ jobId }` — validate jobId is a non-empty string
- Call `deleteHistoryEntry({ uid: auth.uid, jobId })`
- Return `Response.json({ success: true })` on success
- Catch errors: if message is "History entry not found." return 404, otherwise return 500
- Import `deleteHistoryEntry` from `@/lib/brand-scraper/history`
  </action>
  <verify>Run `npm run lint && npm run build` — both pass with no errors in modified files.</verify>
  <done>DELETE /api/tools/brand-scraper/history accepts `{ jobId }` with auth token, deletes the Firestore doc, returns 200 on success / 404 if not found / 401 if unauthorized.</done>
</task>

<task type="auto">
  <name>Task 2: Add Remove Brands toggle, X overlay delete UX, and prefer transparent logos</name>
  <files>src/components/tools/brand-scraper/BrandProfileCards.tsx, src/components/tools/brand-scraper/BrandProfileCard.tsx</files>
  <action>
**BrandProfileCards.tsx changes:**

1. Add `removingMode` boolean state (default false).
2. In the section header area, change the `<h2>` to be inside a flex container with `items-center justify-between`. Keep heading on the left. Add a button on the right:
   - When NOT in removing mode: show "Remove Brands" text button styled subtly (text-sm, text-text-tertiary, hover:text-red-500 transition)
   - When IN removing mode: show "Done" text button styled the same way but with text-gold color
   - onClick toggles `removingMode`
3. Pass two new props to each `BrandProfileCard`: `removingMode={removingMode}` and `onDelete` callback.
4. The `onDelete` callback should:
   - Accept `jobId: string`
   - Call `fetch("/api/tools/brand-scraper/history", { method: "DELETE", headers: { Authorization: "Bearer " + (await getIdToken()), "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) })`
   - On success (res.ok), call SWR's `mutate()` to revalidate the history list. Destructure `mutate` from the existing `useSWR` call.
5. When removing mode is active and entries become empty after deletion, auto-exit removing mode (set removingMode to false).

**BrandProfileCard.tsx changes:**

1. Add `removingMode?: boolean` and `onDelete?: (jobId: string) => void` to `BrandProfileCardProps`.
2. When `removingMode` is true, render an X button overlay in the top-right corner of the card:
   - Positioned absolute within the card (card needs `relative` class)
   - Small circle: `w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center`
   - Use an X character (or SVG X icon): `<span class="text-sm font-bold leading-none">&times;</span>`
   - Offset slightly outside the card corner: `-top-2 -right-2` with `z-10`
   - onClick: call `e.stopPropagation()` (prevent card click/navigation), then call `onDelete?.(jobId)`
   - Add hover state: `hover:bg-red-600` transition
3. When `removingMode` is true, add a subtle visual indicator to the card: `ring-1 ring-red-300` class
4. When `removingMode` is true, disable the card click (don't call `onViewResults`) — wrap the existing onClick in a guard: `onClick={() => !removingMode && onViewResults(jobId)}`

**Transparent-background logo preference (BrandProfileCard.tsx):**

5. Replace the current logo selection logic (lines 103-105):
   ```
   const favicon = result?.assets?.favicons?.[0]?.value?.url;
   const logo = result?.assets?.logos?.[0]?.value?.url;
   const displayImage = logo || favicon;
   ```
   With a smarter selection that prefers transparent-background formats:
   - Get all logos: `const logos = result?.assets?.logos ?? []`
   - Find a transparent-friendly logo: look for entries where `entry.value.format` is "png" or "svg", OR where `entry.value.url` ends with `.png` or `.svg` (case-insensitive)
   - Use the first transparent-friendly logo if found, otherwise fall back to the first logo, then the first favicon
   - Implementation:
     ```typescript
     const logos = result?.assets?.logos ?? [];
     const favicons = result?.assets?.favicons ?? [];
     const isTransparentFormat = (entry: { value: { format?: string; url: string } }) => {
       const fmt = entry.value.format?.toLowerCase() ?? "";
       const url = entry.value.url.toLowerCase();
       return fmt === "png" || fmt === "svg" || url.endsWith(".png") || url.endsWith(".svg");
     };
     const transparentLogo = logos.find(isTransparentFormat);
     const displayImage = transparentLogo?.value?.url ?? logos[0]?.value?.url ?? favicons[0]?.value?.url;
     ```
  </action>
  <verify>Run `npm run lint && npm run build` — both pass. Visually verify by running `npm run dev` and checking the brand scraper page: "Remove Brands" button appears next to heading, clicking it shows X overlays on cards, clicking X removes a card, cards show PNG/SVG logos when available.</verify>
  <done>"Remove Brands" button toggles removal mode. X overlays appear on cards in removal mode. Clicking X calls DELETE API, mutates SWR cache, card disappears. Profile cards prefer PNG/SVG logos for display. "Done" button exits removal mode. Card click is disabled during removal mode.</done>
</task>

</tasks>

<verification>
1. `npm run lint` passes with zero errors
2. `npm run build` passes with zero errors
3. `npm test` passes (if brand-scraper tests exist)
4. Manual verification: navigate to brand scraper page with saved profiles, confirm Remove Brands button visible, toggle mode shows X overlays, delete works, logo selection improved
</verification>

<success_criteria>
- DELETE endpoint at /api/tools/brand-scraper/history works with auth and jobId
- "Remove Brands" / "Done" toggle button appears right-aligned in the profile cards section header
- X overlay appears on each card in removal mode, clicking it deletes the entry
- SWR cache updates after deletion (no page refresh needed)
- Profile cards display PNG/SVG logos when available over other formats
- All quality gates pass (lint, build, test)
</success_criteria>

<output>
After completion, create `.planning/quick/11-add-remove-brands-button-with-card-delet/11-SUMMARY.md`
</output>
