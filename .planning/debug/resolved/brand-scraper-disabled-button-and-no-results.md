---
status: resolved
trigger: "Brand Scraper tool has two issues: (1) The submit button stays disabled after entering a URL, preventing users from running a scrape, and (2) historically the scraper never returned results even when the button was clickable."
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:02:00Z
---

## Current Focus

hypothesis: CONFIRMED and FIXED
test: lint, build, and test all pass
expecting: n/a
next_action: archive session

## Symptoms

expected: When a user types a URL into the Brand Scraper input field, the submit/run button should become enabled and clicking it should run the scraper (costs 50 credits) and return brand analysis results.
actual: The button stays disabled after entering a URL — user cannot click it at all. Additionally, in the past when the button was clickable, the scraper never returned any results.
errors: No visible errors on the page or in the browser console.
reproduction: Navigate to Brand Scraper page, enter a URL in the input field, observe that the submit button remains disabled.
started: Button issue is recent (was working before). No-results issue has been persistent since feature was built.

## Eliminated

- hypothesis: Button component has its own disabled logic
  evidence: Button.tsx simply passes disabled prop through to native button element. No extra logic.
  timestamp: 2026-02-16T00:00:30Z

- hypothesis: Auth flow prevents billing from loading
  evidence: AuthGuard only renders children when user is authenticated. fetchBilling runs in useEffect on user change. The user would see "Sign in" if not auth'd.
  timestamp: 2026-02-16T00:00:40Z

- hypothesis: Phase 39 getIdToken callback refactor broke button state
  evidence: The callback refactor only affects job polling and download auth, not the button disabled prop. Button disabled condition is independent.
  timestamp: 2026-02-16T00:00:50Z

## Evidence

- timestamp: 2026-02-16T00:00:20Z
  checked: Button disabled condition in UserBrandScraperPage.tsx line 242
  found: disabled={submitting || !hasEnough || !isValidUrl} — three conditions, any one keeps button disabled
  implication: Need to check each condition independently

- timestamp: 2026-02-16T00:00:25Z
  checked: git log for recent changes (commit eb9d4d6)
  found: Phase 39 commit "fix(39-01): add URL validity check to Scrape button disabled state" ADDED the !isValidUrl condition. Before this, button only checked submitting || !hasEnough.
  implication: This is the regression point — adding isValidUrl broke previously working flow

- timestamp: 2026-02-16T00:00:30Z
  checked: URL validation logic (lines 86-94) — new URL(url.trim()) with protocol check
  found: Requires full URL with http:// or https:// protocol. "example.com" without protocol throws and returns false.
  implication: Users typing URLs without protocol prefix get a silently disabled button with no feedback

- timestamp: 2026-02-16T00:00:35Z
  checked: Billing flow — fetchBilling silently swallows errors (catch block does nothing)
  found: If billing API returns non-200, billing stays null, hasEnough stays false. No "Insufficient credits" warning shows because it requires billing to be non-null.
  implication: Billing failure also results in permanently disabled button with zero user feedback

- timestamp: 2026-02-16T00:00:40Z
  checked: BRAND_SCRAPER_API_URL in .env.local
  found: Not set (grep returns 0 matches). client.ts throws BrandScraperError("BRAND_SCRAPER_API_URL not configured", 503) immediately.
  implication: Even if button were enabled, scrape submission would fail. This explains issue #2 (no results ever returned).

- timestamp: 2026-02-16T00:00:45Z
  checked: UI feedback for disabled state
  found: NO validation message for invalid URL. NO error shown when billing fails to load. NO explanation of why button is disabled.
  implication: Core UX gap — user has no way to know what to fix

- timestamp: 2026-02-16T00:02:00Z
  checked: Quality gates after fix applied
  found: Lint passes (0 errors), build succeeds, all 156 tests pass
  implication: Fix is clean and safe to deploy

## Resolution

root_cause: |
  Issue 1 (disabled button): Phase 39 added isValidUrl check (commit eb9d4d6) which requires URLs to have http/https protocol prefix. Users entering "example.com" without protocol get isValidUrl=false. Combined with silent billing loading failures (hasEnough stays false when billing API errors), the button stays permanently disabled with zero user feedback.

  Issue 2 (no results): BRAND_SCRAPER_API_URL env var is not configured. This is a deployment/config issue for the external FastAPI brand scraper service. The client.ts code correctly throws 503 when the env var is missing. This requires a separate infrastructure fix (setting the env var on Cloud Run).

fix: |
  In UserBrandScraperPage.tsx:
  1. Added normalizeUrl() helper that auto-prepends https:// when user omits protocol
  2. Added isUrlValid() helper that validates the normalized URL
  3. Changed input type from "url" to "text" with inputMode="url" (removes browser enforcement of protocol requirement)
  4. Updated placeholder from "https://example.com" to "example.com" (matches new behavior)
  5. Added inline validation hint below input when URL is non-empty but invalid
  6. Added billingError state to track billing API failures
  7. Added billing error banner that displays when billing API fails (previously silently swallowed)
  8. Added billingLoading to button disabled condition so button shows "Loading..." during billing fetch
  9. Updated handleSubmit to send normalizeUrl(url) instead of raw url

verification: |
  - npm run lint: 0 errors (Biome check, 249 files)
  - npm run build: successful production build with TypeScript type checking
  - npm test: 156/156 tests pass
  - Code review: all changes are in UserBrandScraperPage.tsx only, minimal and targeted

files_changed:
  - src/components/tools/brand-scraper/UserBrandScraperPage.tsx
