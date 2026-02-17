---
status: verifying
trigger: "Brand scraper API at dev.dan-weinbeck.com/api/tools/brand-scraper/scrape returns error when authenticated user tries to scrape https://transparent.partners"
created: 2026-02-16T12:00:00Z
updated: 2026-02-16T12:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - BRAND_SCRAPER_API_URL env var on deployed dev Cloud Run was wrong
test: Updated env var and verified new revision is healthy
expecting: User tests brand scraper and it works
next_action: User verification needed - test brand scraper on dev.dan-weinbeck.com

## Symptoms

expected: API should successfully scrape the URL and return brand analysis data
actual: API returns an error response when authenticated user scrapes https://transparent.partners
errors: With valid Firebase auth token, error still occurs. Without token, 401 as expected.
reproduction: POST to /api/tools/brand-scraper/scrape with valid Firebase auth token and body {"url":"https://transparent.partners"}
started: Current issue, user reporting now

## Eliminated

- hypothesis: Auth token verification failure
  evidence: User confirmed 401 only happens without token; with token, auth passes but later error occurs
  timestamp: 2026-02-16T12:00:30Z

- hypothesis: Missing X-Idempotency-Key header (for browser usage)
  evidence: Frontend (UserBrandScraperPage.tsx line 124-131) correctly sends X-Idempotency-Key via crypto.randomUUID()
  timestamp: 2026-02-16T12:00:35Z

- hypothesis: Billing/credits issue
  evidence: Error occurs at the submitScrapeJob step; billing issues would return 402 with "Insufficient credits" message
  timestamp: 2026-02-16T12:00:40Z

- hypothesis: Code bug in scrape route handler
  evidence: Code is correct; the error is in infrastructure config (wrong env var pointing to wrong URL)
  timestamp: 2026-02-16T12:01:00Z

## Evidence

- timestamp: 2026-02-16T12:00:45Z
  checked: Cloud Run env vars on deployed personal-brand service (dev project, revision 00039)
  found: BRAND_SCRAPER_API_URL=https://dev.dan-weinbeck.com/brand-scraper
  implication: The Next.js app was calling ITSELF at the same domain with a /brand-scraper path prefix

- timestamp: 2026-02-16T12:00:50Z
  checked: URL map routing (dev-lb-https-url-map) in project personal-brand-dev-487114
  found: Brand scraper is mapped to subdomain scraper.dev.dan-weinbeck.com, NOT a /brand-scraper path on dev.dan-weinbeck.com
  implication: The path /brand-scraper on dev.dan-weinbeck.com hits the Next.js app, which has no such route -> 404

- timestamp: 2026-02-16T12:00:55Z
  checked: curl https://dev.dan-weinbeck.com/brand-scraper/scrape (the URL the deployed app was calling)
  found: Returns Next.js 404 page (HTML response, not JSON)
  implication: submitScrapeJob() receives HTML 404 response, extractErrorMessage() fails to parse JSON body, falls back to "Brand scraper returned 404", throws BrandScraperError(404) which is returned as 502 to the client

- timestamp: 2026-02-16T12:01:00Z
  checked: curl https://scraper.dev.dan-weinbeck.com/scrape (correct subdomain)
  found: Returns 403 (Cloud Run IAM auth required) -- confirms service is running and reachable at subdomain
  implication: Brand scraper service is healthy; issue was purely in the URL configuration

- timestamp: 2026-02-16T12:01:05Z
  checked: Cloud Run revision history for personal-brand service
  found: Revisions 36,38,39 all had wrong URL (https://dev.dan-weinbeck.com/brand-scraper). Revision 37 had https://scraper.dev.dan-weinbeck.com (from trigger), but subsequent revisions reverted.
  implication: The wrong URL was persistently configured; the trigger was updated to subdomain but deployments kept overwriting

- timestamp: 2026-02-16T12:01:10Z
  checked: Cloud Build trigger substitution for personal-brand-deploy-dev
  found: _BRAND_SCRAPER_API_URL=https://scraper.dev.dan-weinbeck.com (subdomain URL)
  implication: Trigger has subdomain URL, but should use direct Cloud Run URL for proper IAM auth audience matching

- timestamp: 2026-02-16T12:02:00Z
  checked: Brand scraper Cloud Run service IAM policy
  found: Only cloudrun-site@personal-brand-dev-487114 has run.invoker role; ingress is internal-and-cloud-load-balancing
  implication: Identity token audience must match Cloud Run service URL for proper IAM auth

- timestamp: 2026-02-16T12:03:00Z
  checked: Production BRAND_SCRAPER_API_URL config
  found: https://brand-scraper-api-pcyrow43pa-uc.a.run.app (direct Cloud Run URL, working correctly)
  implication: Production uses direct URL pattern; dev should follow the same pattern

## Resolution

root_cause: BRAND_SCRAPER_API_URL env var on the deployed dev Cloud Run service was set to https://dev.dan-weinbeck.com/brand-scraper. This URL points back to the Next.js app itself (the load balancer routes dev.dan-weinbeck.com to the personal-brand service). When the Next.js API route called submitScrapeJob(), it was making a POST to its own domain at a path that doesn't exist (/brand-scraper/scrape), receiving a Next.js 404 HTML page in response, which the client.ts code surfaced as a "Brand scraper returned 404" error (status 502 to the user).

fix: Updated BRAND_SCRAPER_API_URL on deployed dev Cloud Run service to https://brand-scraper-api-opujwjqlsa-uc.a.run.app (direct Cloud Run URL for the brand-scraper-api service). This matches the production pattern. New revision personal-brand-00040-jmt is healthy and serving 100% traffic.

verification: New revision deployed and healthy. API endpoint returns proper 401 JSON for unauthenticated requests (confirming the route handler is functional). User verification needed for authenticated scrape request.

files_changed: []
infra_changed:
  - Cloud Run env var BRAND_SCRAPER_API_URL on personal-brand service (dev project)
    from: https://dev.dan-weinbeck.com/brand-scraper
    to: https://brand-scraper-api-opujwjqlsa-uc.a.run.app
follow_up:
  - Update Cloud Build trigger substitution _BRAND_SCRAPER_API_URL from https://scraper.dev.dan-weinbeck.com to https://brand-scraper-api-opujwjqlsa-uc.a.run.app via Cloud Console (gcloud CLI update failed with INVALID_ARGUMENT)
