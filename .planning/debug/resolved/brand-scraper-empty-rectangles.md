---
status: resolved
trigger: "Brand scraper still shows empty/blank rectangles in the asset grid despite a previous fix (commit 50f9170)"
created: 2026-02-19T00:00:00Z
updated: 2026-02-19T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED - AssetGrid.tsx renders images without any error/tiny-image detection
test: n/a - root cause confirmed and fix applied
expecting: n/a
next_action: Archive session

## Symptoms

expected: No empty rectangles in the brand scraper asset grid. Either show real images or hide broken/empty ones entirely.
actual: Empty rectangles still appear in the asset grid when scraping websites (e.g., transparent.partners).
errors: No specific error messages reported.
reproduction: Go to dev.dan-weinbeck.com, use the brand scraper tool, scrape "transparent.partners", look at the asset grid — empty rectangles are visible.
started: The fix was deployed in commit 50f9170 but the issue persists. The fix targeted BrandCardLogos.tsx specifically with an onLoad handler for 1x1 pixel detection.

## Eliminated

## Evidence

- timestamp: 2026-02-19T00:00:30Z
  checked: Commit 50f9170 diff — which files were modified
  found: Only BrandCardLogos.tsx and BrandCardDownloads.tsx were changed. AssetGrid.tsx was NOT touched.
  implication: The fix never reached the asset grid view.

- timestamp: 2026-02-19T00:00:45Z
  checked: AssetGrid.tsx AssetCard component (lines 60-141) — image rendering logic
  found: The <img> tag at line 68-73 has NO onError handler and NO onLoad handler. It renders with a fixed `h-40` height and `bg-gray-50` background, creating a visible 160px tall gray box even when the image fails to load or is transparent/tiny.
  implication: This is the direct cause of empty rectangles on the assets page.

- timestamp: 2026-02-19T00:00:50Z
  checked: BrandCardLogos.tsx AssetImage component (lines 11-56) — the working fix
  found: Has useState(failed), onError={() => setFailed(true)}, onLoad handler that checks naturalWidth/naturalHeight <= 1, and returns null when failed. This is the pattern that needs to be applied to AssetGrid.tsx.
  implication: The fix pattern exists and works — it just needs to be applied to AssetGrid.tsx.

- timestamp: 2026-02-19T00:00:55Z
  checked: AssetManifestEntry type — what data is available for filtering
  found: Each asset has category, filename, content_type, size_bytes, gcs_object_path, and optional signed_url. The size_bytes field could be used for pre-filtering extremely small files.
  implication: Can add both client-side (onLoad/onError) and data-level (size_bytes) filtering.

- timestamp: 2026-02-19T00:01:30Z
  checked: Quality gates after fix
  found: Biome lint passes, build succeeds, all 211 tests pass.
  implication: Fix is clean and introduces no regressions.

## Resolution

root_cause: AssetGrid.tsx was never updated with the empty-image detection fix from commit 50f9170. The AssetCard component rendered images with a bare <img> tag that had no onError handler (for failed loads) and no onLoad handler (for tiny/invisible pixel detection). The fixed-height h-40 class created visible empty gray boxes when images failed to load or were transparent/tiny.

fix: Applied a two-layer defense to AssetGrid.tsx:
1. Data-level pre-filtering: Added MIN_ASSET_SIZE_BYTES (100 bytes) threshold to filter out image assets smaller than 100 bytes before rendering (tracking pixels, empty placeholders).
2. Client-side detection: Added useState(hidden) + onError handler (hides card on load failure) + onLoad handler (checks naturalWidth/naturalHeight <= 1 to detect invisible pixels) to AssetCard. When hidden, the entire card returns null.

verification: Biome lint clean, build succeeds, all 211 tests pass.
files_changed:
- src/components/tools/brand-scraper/AssetGrid.tsx
