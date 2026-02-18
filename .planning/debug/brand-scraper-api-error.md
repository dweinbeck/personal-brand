---
status: investigating
trigger: "Brand scraper API at dev.dan-weinbeck.com/api/tools/brand-scraper/scrape returns error when authenticated user tries to scrape https://transparent.partners"
created: 2026-02-16T12:00:00Z
updated: 2026-02-17T23:00:00Z
---

## Current Focus

hypothesis: CONFIRMED - Phantom ci-deployer automation overwrites correct Cloud Build env vars after every deployment
test: Fixed env var on revision 00067. Need user to (1) test brand scraper (2) identify ci-deployer source
expecting: Brand scraper works now; but will break again on next push to dev branch unless ci-deployer is fixed
next_action: CHECKPOINT - User must identify and fix the ci-deployer automation source

## Symptoms

expected: API should successfully scrape the URL and return brand analysis data
actual: API returns 502 error when authenticated user scrapes https://transparent.partners
errors: HTTP 404 from brand scraper service (actually calling itself), manifesting as 502 to the client
reproduction: POST to /api/tools/brand-scraper/scrape with valid Firebase auth token and body {"url":"https://transparent.partners"}
started: Persistent issue. Previous debug session fixed env var manually but it was reverted by automated deployment.

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

- hypothesis: Previous manual env var fix wasn't applied correctly
  evidence: Fix WAS applied correctly (revision 00040). Overwritten by ci-deployer on next deploy cycle.
  timestamp: 2026-02-17T22:10:00Z

- hypothesis: Cloud Build trigger has wrong _BRAND_SCRAPER_API_URL
  evidence: Trigger has correct value (https://brand-scraper-api-opujwjqlsa-uc.a.run.app). Cloud Build revisions (00064, 00065) have correct env vars. Problem is ci-deployer overwrites them.
  timestamp: 2026-02-17T22:15:00Z

- hypothesis: GitHub Actions workflow in personal-brand repo
  evidence: Zero workflows and zero GHA runs in personal-brand repo (checked both dev and master branches via API)
  timestamp: 2026-02-17T22:45:00Z

- hypothesis: Terraform managing Cloud Run services
  evidence: Terraform state only has networking/LB resources (NEGs, backend services, URL maps). No google_cloud_run_service resources. No local-exec provisioners.
  timestamp: 2026-02-17T22:35:00Z

- hypothesis: Cloud Functions, Eventarc, or Cloud Deploy triggering deploy
  evidence: Cloud Functions API disabled. Eventarc API disabled. Cloud Deploy API disabled.
  timestamp: 2026-02-17T22:40:00Z

## Evidence

- timestamp: 2026-02-16T12:00:45Z
  checked: Cloud Run env vars on deployed personal-brand service (dev project, revision 00039)
  found: BRAND_SCRAPER_API_URL=https://dev.dan-weinbeck.com/brand-scraper
  implication: The Next.js app was calling ITSELF at the same domain with a /brand-scraper path prefix

- timestamp: 2026-02-16T12:00:50Z
  checked: URL map routing (dev-lb-https-url-map) in project personal-brand-dev-487114
  found: Brand scraper is mapped to subdomain scraper.dev.dan-weinbeck.com, NOT a /brand-scraper path on dev.dan-weinbeck.com
  implication: The path /brand-scraper on dev.dan-weinbeck.com hits the Next.js app, which has no such route -> 404

- timestamp: 2026-02-17T22:05:00Z
  checked: Current revision (00066) env vars after previous fix
  found: BRAND_SCRAPER_API_URL=https://dev.dan-weinbeck.com/brand-scraper (WRONG - reverted)
  implication: Previous manual fix was overwritten by a subsequent deployment

- timestamp: 2026-02-17T22:10:00Z
  checked: Revision 00065 (Cloud Build) vs 00066 (ci-deployer) comparison
  found: |
    Rev 00065 (Cloud Build, 1091009802247-compute SA, 03:10:15):
      BRAND_SCRAPER_API_URL=https://brand-scraper-api-opujwjqlsa-uc.a.run.app (CORRECT)
      CHATBOT_API_URL=https://chat.dev.dan-weinbeck.com (correct)
      FIREBASE_PROJECT_ID=personal-brand-486314 (WRONG - prod Firebase)
    Rev 00066 (ci-deployer SA, 03:11:14, 45 sec later):
      BRAND_SCRAPER_API_URL=https://dev.dan-weinbeck.com/brand-scraper (WRONG)
      CHATBOT_API_URL=https://dev.dan-weinbeck.com/assistant-api (WRONG)
      FIREBASE_PROJECT_ID=personal-brand-dev-487114 (correct for dev)
  implication: TWO competing deploy mechanisms. ci-deployer always wins by deploying last.

- timestamp: 2026-02-17T22:15:00Z
  checked: Cloud Run audit logs for deploy window (03:05-03:12 on 2026-02-18)
  found: |
    ci-deployer user agent: "gcloud/556.0.0 command/gcloud.run.deploy environment/GCE"
    ci-deployer IP: 34.10.166.48
    Runs on GCE (GitHub Actions runner infrastructure)
    Authenticates via WIF (Workload Identity Federation) pool "github" -> ci-deployer SA
  implication: ci-deployer is definitely triggered by a GitHub Actions workflow using WIF

- timestamp: 2026-02-17T22:20:00Z
  checked: All revision creators across recent deployments (00058-00066)
  found: |
    Pattern: Cloud Build creates odd-numbered revision, ci-deployer creates even-numbered revision
    EVERY deployment results in 2 revisions, with ci-deployer's (wrong values) always serving
  implication: This is systematic, not a one-time issue. Happens on every push to dev.

- timestamp: 2026-02-17T22:25:00Z
  checked: WIF configuration in personal-brand-dev-487114 project
  found: |
    Pool: "github" (GitHub Actions)
    Provider: github-provider (OIDC from token.actions.githubusercontent.com)
    Attribute condition: assertion.repository_owner == 'dweinbeck'
    ci-deployer SA bound to principalSet for all dweinbeck repos
  implication: ANY dweinbeck GitHub repo's Actions workflow can authenticate as ci-deployer

- timestamp: 2026-02-17T22:30:00Z
  checked: GitHub Actions workflows across ALL dweinbeck repos
  found: |
    personal-brand: ZERO workflows, ZERO runs (checked API, both branches)
    chatbot-assistant: ci-cd.yml (deploys chatbot-assistant service only, confirmed)
    prompt-os: deploy.yml (deploys to AWS, irrelevant)
    All other repos: no workflows
  implication: Cannot find the workflow source that deploys personal-brand via ci-deployer

- timestamp: 2026-02-17T22:35:00Z
  checked: All non-workflow automation sources
  found: |
    - No GitHub Actions in personal-brand repo (zero workflows, zero runs)
    - No Terraform managing Cloud Run services (only LB resources)
    - No Cloud Functions, Eventarc, Cloud Deploy (APIs disabled)
    - No Compute Engine VMs (GCE in user agent is from GHA runner)
    - ci-deployer has no user-managed keys (only Google-provided)
    - ci-deployer only accessible via WIF (GitHub OIDC)
  implication: Source of ci-deployer deployment is a mystery - possibly a deleted workflow, or a third-party CI system using GitHub OIDC

- timestamp: 2026-02-17T22:50:00Z
  checked: Applied immediate fix - updated BRAND_SCRAPER_API_URL on Cloud Run service
  found: |
    gcloud run services update -> revision personal-brand-00067-n2d created and serving 100%
    BRAND_SCRAPER_API_URL now correctly set to https://brand-scraper-api-opujwjqlsa-uc.a.run.app
    Unauthenticated test returns 401 (route handler working)
  implication: Brand scraper should work now. But will revert on next push to dev.

## Resolution

root_cause: |
  TWO-LAYER ROOT CAUSE:

  Layer 1 (direct cause): BRAND_SCRAPER_API_URL env var on the dev Cloud Run service is set to
  https://dev.dan-weinbeck.com/brand-scraper (self-referencing). This URL hits the Next.js app
  itself (no /brand-scraper route exists), returning a 404 HTML page that surfaces as a 502 error.

  Layer 2 (why it keeps reverting): A phantom deployment automation using the ci-deployer SA
  (via GitHub Actions WIF) runs after EVERY Cloud Build deployment (~45 sec later) and overwrites
  the correct env vars with stale/wrong values. This includes:
  - BRAND_SCRAPER_API_URL: https://dev.dan-weinbeck.com/brand-scraper (WRONG)
  - CHATBOT_API_URL: https://dev.dan-weinbeck.com/assistant-api (WRONG)
  Both use path-based routing on the main domain, but neither path exists.

  The ci-deployer authenticates via WIF from GitHub Actions (attribute condition:
  assertion.repository_owner == 'dweinbeck'), but the triggering workflow cannot be found in
  any current dweinbeck GitHub repo.

fix: |
  IMMEDIATE (applied): Updated BRAND_SCRAPER_API_URL on Cloud Run revision 00067.

  PERMANENT (requires user action):
  1. Identify and fix/disable the ci-deployer automation that creates the overwriting deployment
  2. Alternatively, update the ci-deployer config to use correct service URLs:
     - BRAND_SCRAPER_API_URL=https://brand-scraper-api-opujwjqlsa-uc.a.run.app
     - CHATBOT_API_URL=https://chat.dev.dan-weinbeck.com (or direct Cloud Run URL)

verification: |
  Revision 00067 deployed with correct BRAND_SCRAPER_API_URL.
  Unauthenticated test returns 401 (confirms route handler is functional).
  User needs to test authenticated scrape request.
  CRITICAL: This fix will revert on next push to dev branch.

files_changed: []
infra_changed:
  - Cloud Run env var BRAND_SCRAPER_API_URL on personal-brand service (dev project)
    from: https://dev.dan-weinbeck.com/brand-scraper
    to: https://brand-scraper-api-opujwjqlsa-uc.a.run.app
    revision: personal-brand-00067-n2d
