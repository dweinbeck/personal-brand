# Phase 1: Brand Scraper Bug Fixes and UI Improvements

## Goal
Address 7 testing feedback items for the Brand Scraper — fix broken downloads, missing color labels, remove credits display, improve progress messaging, add white input backgrounds, and redesign history into brand profile cards.

## Items from Testing Feedback

| # | Type | Priority | Summary | Plan |
|---|------|----------|---------|------|
| 1 | UI | L | Progress panel: remove "polling" text, add explanation | P04 |
| 2 | Bug | H | Download buttons don't trigger real file downloads | P01 |
| 3 | Bug | H | Color roles not labeled (secondary, etc.) | P02 |
| 4 | Bug | H | 3M.com scraper didn't find red | OUT OF SCOPE (external scraper service) |
| 5 | UI | L | White input box backgrounds site-wide | P05 |
| 6 | UI | M | Brand profile cards instead of history list | P06 |
| 7 | UI | H | Remove credits info below Extract | P03 |

**Item 4 note:** The color extraction accuracy is handled by the external Brand Scraper service (`BRAND_SCRAPER_API_URL`). This codebase only displays results — it cannot fix scraper accuracy. If 3M.com returns fast with missing colors, the scraper may be blocked by robots.txt or failing to render JS-heavy pages. This should be filed as a bug against the scraper service.

---

## Wave 1 (parallel — no dependencies)

### P01: Fix download buttons (proxy through our API)
**Problem:** JSON download falls back to `window.open` (opens in new tab) because GCS signed URLs fail CORS fetch. ZIP download fails similarly.
**Root cause:** Cross-origin GCS signed URLs can't be fetched client-side, and the `download` attribute on `<a>` is ignored for cross-origin links.
**Solution:** Create server-side proxy routes that fetch from GCS and stream content back with `Content-Disposition: attachment` headers.

Files:
- CREATE `src/app/api/tools/brand-scraper/jobs/[id]/download/json/route.ts` — proxy JSON download
- MODIFY `src/app/api/tools/brand-scraper/jobs/[id]/assets/zip/route.ts` — stream ZIP content instead of returning URL
- MODIFY `src/components/tools/brand-scraper/BrandCardDownloads.tsx` — use proxy routes
- MODIFY `src/components/tools/brand-scraper/AssetsPage.tsx` — use proxy route for ZIP

### P02: Fix color role labels
**Problem:** Colors don't show their role (Primary, Secondary, etc.) when the scraper doesn't set the `role` field.
**Solution:** Infer roles from palette position (1st=Primary, 2nd=Secondary, 3rd=Accent, rest=unlabeled). Always show the label.

Files:
- MODIFY `src/components/tools/brand-scraper/BrandCardColors.tsx`

### P03: Remove credits display
**Problem:** Credits balance shown below page title — should only appear on billing page.
**Solution:** Remove the balance/cost info section from `UserBrandScraperPage`.

Files:
- MODIFY `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` — remove lines 209-222

### P04: Improve status text
**Problem:** "Polling..." shown during job status checking — not meaningful to users.
**Solution:** Replace with "Checking status..." and add brief explanation. Remove technical jargon.

Files:
- MODIFY `src/components/admin/brand-scraper/JobStatusIndicator.tsx`

---

## Wave 2 (parallel — no dependencies on Wave 1)

### P05: White input backgrounds site-wide
**Problem:** Input boxes don't have white background, inconsistent across site.
**Solution:** Add global CSS rule for inputs/textareas to use `bg-white`.

Files:
- MODIFY `src/app/globals.css` — add global input background rule

### P06: Brand profile cards (replaces history list)
**Problem:** History is a plain list. User wants visual card grid showing logo, colors, fonts.
**Solution:** Replace `ScrapeHistory` with `BrandProfileCards` component — 3-wide card grid using `Card` component. Each card fetches job details and shows brand summary. Gold HR divider + centered "Your Brand Profiles" heading.

Files:
- CREATE `src/components/tools/brand-scraper/BrandProfileCards.tsx` — new card grid component
- CREATE `src/components/tools/brand-scraper/BrandProfileCard.tsx` — individual card with lazy data loading
- MODIFY `src/components/tools/brand-scraper/UserBrandScraperPage.tsx` — use BrandProfileCards instead of ScrapeHistory
- DELETE (via non-import) `src/components/tools/brand-scraper/ScrapeHistory.tsx` — replaced

---

## Verification
- `npm run lint` passes
- `npm run build` passes
- `npm test` passes
- Downloads trigger real file saves (manual test)
- Color labels show Primary/Secondary/Accent
- No credits shown on brand scraper page
- Status shows "Checking status..." not "Polling..."
- Input boxes have white backgrounds
- History section shows card grid with brand summaries
