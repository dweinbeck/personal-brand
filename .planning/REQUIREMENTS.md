# Requirements: dan-weinbeck.com

**Defined:** 2026-02-09
**Core Value:** Visitors can understand who Dan is and see proof of his work within 60 seconds

## v1.5 Requirements

Requirements for Billing & Credits System — validate, configure, deploy.

### Code Validation

- [x] **VAL-01**: Billing code passes `npm run build` with zero TypeScript errors
- [x] **VAL-02**: Billing code passes `npm run lint` with zero Biome errors
- [x] **VAL-03**: Billing tests pass via `npm test` (all 26 existing test cases)
- [x] **VAL-04**: All billing code committed to master (~3K LOC across 30+ files)

### Infrastructure — Stripe

- [x] **INFRA-01**: Stripe secrets (stripe-secret-key, stripe-webhook-secret) created in GCP Secret Manager
- [x] **INFRA-02**: Stripe webhook endpoint registered in Stripe Dashboard pointing to `https://dan-weinbeck.com/api/billing/webhook` listening for `checkout.session.completed`
- [x] **INFRA-03**: Cloud Run service account has `secretmanager.secretAccessor` on both Stripe secrets

### Infrastructure — Firebase Auth

- [x] **INFRA-04**: `dan-weinbeck.com` and Cloud Run `.run.app` domain added to Firebase Auth authorized domains
- [x] **INFRA-05**: Google Sign-In provider enabled in Firebase Console
- [x] **INFRA-06**: `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` correctly set in Cloud Build trigger substitutions

### Infrastructure — Firestore

- [x] **INFRA-07**: Composite indexes created for billing queries (`billing_tool_usage` uid+createdAt, uid+externalJobId; `billing_purchases` uid+createdAt)
- [x] **INFRA-08**: Tool pricing seed data populated in production Firestore (`brand_scraper` active at 50 credits, 3 inactive placeholders)
- [x] **INFRA-09**: Firestore security rules deny client-side access to all billing collections

### Infrastructure — Deploy

- [ ] **INFRA-10**: Billing-enabled build deployed to Cloud Run via Cloud Build
- [ ] **INFRA-11**: All Cloud Build trigger substitution variables verified (Firebase, Stripe, Brand Scraper URL)

### Brand Scraper v1.1 Integration

- [ ] **BSINT-01**: `BRAND_SCRAPER_API_URL` updated to real Cloud Run URL when brand-scraper v1.1 is deployed
- [ ] **BSINT-02**: GCS signed URL passthrough verified end-to-end (brand_json_url and assets_zip_url render as download buttons)

### End-to-End Validation

- [ ] **E2E-01**: User can sign in with Google on production domain
- [ ] **E2E-02**: New user receives 100 free credits on first sign-in (signup grant)
- [ ] **E2E-03**: User can purchase 500 credits for $5 via Stripe Checkout (test mode)
- [ ] **E2E-04**: Stripe webhook fires and credits are granted after purchase
- [ ] **E2E-05**: User can submit a brand scrape and credits are debited (50 credits)
- [ ] **E2E-06**: Failed scrape job auto-refunds credits to user
- [ ] **E2E-07**: Admin can view all billing users with balance and margin data
- [ ] **E2E-08**: Admin can adjust credits and refund usage from user detail page
- [ ] **E2E-09**: Admin can edit tool pricing from pricing tab
- [ ] **E2E-10**: Live mode verified — real $5 purchase completes and credits are granted

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Billing Enhancements

- **BILL-01**: Multiple credit pack tiers (100/$1, 500/$5, 2000/$15)
- **BILL-02**: User-facing usage history page with past scrapes and download links
- **BILL-03**: Balance warning notifications when credits run low
- **BILL-04**: Stripe Customer Portal for self-service purchase history
- **BILL-05**: Revenue dashboard / analytics for admin
- **BILL-06**: Rate limiting on billing API routes
- **BILL-07**: Automated E2E tests with Stripe test mode (Playwright)

### Brand Scraper Enhancements

- **BSUP-01**: Signed URL expiration handling with refresh mechanism
- **BSUP-02**: Re-scrape button for existing results
- **BSUP-03**: Side-by-side brand comparison

### Additional Tools

- **TOOL-01**: 60-Second Lesson tool (pricing entry exists, tool inactive)
- **TOOL-02**: Bus Text tool (pricing entry exists, tool inactive)
- **TOOL-03**: Dave Ramsey App tool (pricing entry exists, tool inactive)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Subscription / recurring billing | Pre-paid credits model is intentional; subscriptions add massive complexity |
| Custom Stripe payment page (Elements) | Checkout redirect is PCI-compliant out of the box |
| Webhook retry queue / dead letter queue | Stripe retries automatically for 3 days; idempotency handles duplicates |
| Credit expiration | Adds complexity with no business justification |
| Multi-currency support | USD only; Stripe handles international cards natively |
| Client-side balance caching | Server-side fetch is correct; stale balances in billing context is worse than loading |
| Stripe monetary refunds from admin panel | Handle via Stripe Dashboard; admin panel does credit refunds only |
| Automated E2E test suite | Manual E2E sufficient for initial deployment; automate after patterns stabilize |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VAL-01 | Phase 22 | Complete |
| VAL-02 | Phase 22 | Complete |
| VAL-03 | Phase 22 | Complete |
| VAL-04 | Phase 22 | Complete |
| INFRA-01 | Phase 23 | Complete |
| INFRA-02 | Phase 23 | Complete |
| INFRA-03 | Phase 23 | Complete |
| INFRA-04 | Phase 23 | Complete |
| INFRA-05 | Phase 23 | Complete |
| INFRA-06 | Phase 23 | Complete |
| INFRA-07 | Phase 23 | Complete |
| INFRA-08 | Phase 23 | Complete |
| INFRA-09 | Phase 23 | Complete |
| INFRA-10 | Phase 24 | Pending |
| INFRA-11 | Phase 24 | Pending |
| BSINT-01 | Phase 24 | Pending |
| BSINT-02 | Phase 24 | Pending |
| E2E-01 | Phase 24 | Pending |
| E2E-02 | Phase 24 | Pending |
| E2E-03 | Phase 24 | Pending |
| E2E-04 | Phase 24 | Pending |
| E2E-05 | Phase 24 | Pending |
| E2E-06 | Phase 24 | Pending |
| E2E-07 | Phase 24 | Pending |
| E2E-08 | Phase 24 | Pending |
| E2E-09 | Phase 24 | Pending |
| E2E-10 | Phase 25 | Pending |

**Coverage:**
- v1.5 requirements: 27 total
- Mapped to phases: 27
- Unmapped: 0

---
*Requirements defined: 2026-02-09*
*Last updated: 2026-02-09 after roadmap creation*
