# New Service Checklist

> Step-by-step checklist for adding a new external service to the architecture. Every item traces to a real bug that occurred when a step was skipped.

---

## Before You Start

1. Choose a name for the env var (e.g., `NEW_SERVICE_API_URL`)
2. Identify the service's health endpoint (e.g., `/health`, `/`, `/docs`)
3. Determine if the service needs authentication from this app

---

## Configuration

- [ ] **Add URL env var to `src/lib/env.ts`** with `z.string().url()` validation
  - *Bug avoided: uncaught typos in URLs*

- [ ] **Add to `.env.local.example`** with documentation comment explaining what the service is
  - *Bug avoided: developers missing required config on setup*

- [ ] **Add to `cloudbuild.yaml` substitutions** (`_NEW_SERVICE_API_URL: ''`) and `--set-env-vars`
  - *Bug avoided: var present locally but missing in Cloud Run*

- [ ] **Add hostname to self-reference detection** in `src/lib/env.ts` (`detectSelfReferenceUrls`)
  - *Bug avoided: URL accidentally pointing back to this app (Bug #1, #3)*

- [ ] **Add health probe to `scripts/smoke-test.ts`**
  - *Bug avoided: URL passes syntax check but service is unreachable*

---

## Infrastructure (Per Environment)

For **each** environment (prod, dev, local):

- [ ] **Create Secret Manager secrets with REAL values** — not placeholders
  - *Bug avoided: literal "YOUR_API_KEY" in Secret Manager (Bug #6)*
  - Verify: `gcloud secrets versions access latest --secret=NEW_SECRET --project=PROJECT_ID`

- [ ] **Grant service account IAM roles** if the new service needs to call back
  - *Bug avoided: 403 errors on service-to-service calls*

- [ ] **Create database** (if needed) and run migrations BEFORE first deploy
  - *Bug avoided: "database not found" errors after deploy (Bug #7)*

- [ ] **Add Firebase Auth domain** if the service serves authenticated pages
  - *Bug avoided: `auth/unauthorized-domain` on login (Bug #5)*
  - Location: Firebase Console -> Authentication -> Settings -> Authorized domains

- [ ] **Deploy Firestore indexes** if the service uses Firestore with composite queries
  - *Bug avoided: "requires an index" 500 errors (Bug #10)*
  - Command: `npm run verify-indexes -- --project PROJECT_ID`

---

## Cross-Domain Considerations

- [ ] **Cookie domain config** — if the service is on a subdomain (e.g., `new.dan-weinbeck.com`), ensure cookies use `.dan-weinbeck.com` (dot prefix) for cross-subdomain auth
  - *Bug avoided: blank page or auth mismatch across subdomains (Bug #8)*

- [ ] **CORS configuration** — if this app makes client-side requests to the new service, add CORS headers on the service side

---

## Documentation

- [ ] **Update `docs/SERVICE-REGISTRY.md`** with URLs for all environments
- [ ] **Update `docs/DEPLOYMENT.md`** if deploy process changes
- [ ] **Update `docs/TECHNICAL_DESIGN.md`** if this adds a new integration
- [ ] **Update project `CLAUDE.md`** Service Map table with the new service

---

## Verification

Run in order:

```bash
# 1. Code quality
npm test && npm run lint && npm run build

# 2. Config validation (syntax + semantics)
npm run validate-env

# 3. Firestore indexes (if applicable)
npm run verify-indexes -- --project <PROJECT_ID>

# 4. Post-deploy connectivity
npm run smoke-test
```

---

## Bug Trace Reference

Each checkbox traces to a specific bug from the 24-hour analysis:

| Bug # | What Happened | Checklist Item That Prevents It |
|-------|--------------|-------------------------------|
| 1 | Scraper URL pointed to main app | Self-reference detection |
| 3 | Chatbot URL used path routing | Self-reference detection |
| 4 | Cross-domain auth failed | Cookie domain config |
| 5 | Firebase Auth domain missing | Firebase Auth domain |
| 6 | Placeholder secrets in Secret Manager | Real secret values |
| 7 | Database never created in dev | Create database before deploy |
| 8 | Cookie auth across subdomains | Cookie domain config |
| 10 | Firestore indexes missing | Deploy indexes |
