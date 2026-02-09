# Roadmap: dan-weinbeck.com

## Milestones

- ✅ **v1.0 MVP** - Phases 1-6 (shipped 2026-02-03)
- ✅ **v1.1 Page Buildout & Polish** - Phases 7-10.1 (shipped 2026-02-05)
- ✅ **v1.2 Content & Data Integration** - Phases 11-12 (shipped 2026-02-07)
- ✅ **v1.3 Assistant Backend Integration** - Phases 13-16 (shipped 2026-02-08)
- ✅ **v1.4 Control Center: Content Editor & Brand Scraper** - Phases 17-21 (shipped 2026-02-09)
- 🚧 **v1.5 Billing & Credits System** - Phases 22-25 (in progress)

## Phases

<details>
<summary>✅ v1.0 through v1.4 (Phases 1-21) - SHIPPED</summary>

See .planning/MILESTONES.md for full history.

Archived roadmaps:
- .planning/milestones/v1.0-ROADMAP.md
- .planning/milestones/v1.1-ROADMAP.md
- .planning/milestones/v1.2-ROADMAP.md
- .planning/milestones/v1.3-ROADMAP.md
- .planning/milestones/v1.4-ROADMAP.md

</details>

### 🚧 v1.5 Billing & Credits System (In Progress)

**Milestone Goal:** Validate, configure infrastructure for, and deploy the existing billing/credits system with Stripe payments, Firebase Auth for end users, brand-scraper v1.1 integration, and admin billing management. This is a validation and deployment milestone -- the code already exists (~3K LOC, 30+ files).

- [ ] **Phase 22: Code Validation & Commit** - Verify existing billing code compiles, lints, tests, and commit to master
- [ ] **Phase 23: Infrastructure Configuration** - Configure all GCP, Firebase, Stripe, and Firestore prerequisites
- [ ] **Phase 24: Deploy & Smoke Test** - Deploy to Cloud Run and validate all user flows with Stripe test mode
- [ ] **Phase 25: Go Live** - Switch to Stripe live keys and verify real payment processing

## Phase Details

### Phase 22: Code Validation & Commit
**Goal**: Existing billing code passes all quality gates and is committed to master, establishing a clean baseline for deployment
**Depends on**: Nothing (first phase of v1.5)
**Requirements**: VAL-01, VAL-02, VAL-03, VAL-04
**Success Criteria** (what must be TRUE):
  1. `npm run build` completes with zero TypeScript errors across all billing files
  2. `npm run lint` completes with zero Biome errors across all billing files
  3. `npm test` passes all 26 existing test cases
  4. All ~3K LOC of billing, auth, and tool integration code is committed to master in a single coherent commit
**Plans:** 1 plan

Plans:
- [ ] 22-01-PLAN.md -- Fix gitignore, correct planning docs, run quality gates, and commit all billing code to master

### Phase 23: Infrastructure Configuration
**Goal**: All external services (GCP Secret Manager, Stripe, Firebase Auth, Firestore) are configured and ready to receive a deployment
**Depends on**: Phase 22
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, INFRA-08, INFRA-09
**Success Criteria** (what must be TRUE):
  1. Stripe test-mode secrets exist in GCP Secret Manager and the Cloud Run service account can access them
  2. Stripe webhook endpoint is registered in Stripe Dashboard pointing to the production URL and listening for checkout.session.completed
  3. Google Sign-In works on dan-weinbeck.com (Firebase Auth domains configured, provider enabled, auth domain env var set)
  4. Firestore composite indexes exist for billing queries and tool pricing seed data is populated with brand_scraper active at 50 credits
  5. Firestore security rules deny client-side access to all billing collections
**Plans**: TBD

Plans:
- [ ] 23-01: TBD

### Phase 24: Deploy & Smoke Test
**Goal**: Billing-enabled site is live on Cloud Run and every user flow works end-to-end with Stripe test payments
**Depends on**: Phase 23
**Requirements**: INFRA-10, INFRA-11, BSINT-01, BSINT-02, E2E-01, E2E-02, E2E-03, E2E-04, E2E-05, E2E-06, E2E-07, E2E-08, E2E-09
**Success Criteria** (what must be TRUE):
  1. User can sign in with Google on dan-weinbeck.com and receives 100 free credits on first sign-in
  2. User can purchase 500 credits for $5 via Stripe Checkout (test card 4242...) and credits appear in their balance after webhook fires
  3. User can submit a brand scrape that debits 50 credits, and a failed scrape auto-refunds the credits
  4. Brand scraper results display GCS signed URL download buttons for brand JSON and assets ZIP
  5. Admin can view billing users with balances, adjust credits, refund usage, and edit tool pricing from the admin panel
**Plans**: TBD

Plans:
- [ ] 24-01: TBD

### Phase 25: Go Live
**Goal**: Billing system accepts real payments with live Stripe keys
**Depends on**: Phase 24
**Requirements**: E2E-10
**Success Criteria** (what must be TRUE):
  1. Stripe secrets in GCP Secret Manager contain live keys (sk_live_*, whsec_* for live endpoint)
  2. A real $5 purchase completes end-to-end: Checkout page loads, payment succeeds, webhook fires, 500 credits are granted
**Plans**: TBD

Plans:
- [ ] 25-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 22 → 23 → 24 → 25

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 22. Code Validation & Commit | v1.5 | 0/1 | Planned | - |
| 23. Infrastructure Configuration | v1.5 | 0/? | Not started | - |
| 24. Deploy & Smoke Test | v1.5 | 0/? | Not started | - |
| 25. Go Live | v1.5 | 0/? | Not started | - |
