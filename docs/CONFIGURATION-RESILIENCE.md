# Configuration Resilience

> Why 90% of cloud bugs are configuration bugs — and what to do about it.

This document explains the failure patterns that dominate multi-service architectures. It's based on real data: over a 24-hour development sprint, 9 of 10 bugs were infrastructure/configuration issues, not code bugs.

---

## The 90/10 Rule of Cloud Bugs

In multi-service architectures, approximately 90% of production bugs are configuration, not code. The industry trains developers to fear code bugs — linters, type checkers, 156 unit tests — but configuration is the largest failure surface.

**Why?** Code is validated by three independent systems (compiler, linter, test suite). Configuration is validated by nothing until it fails in production. A misspelled URL passes every check until a user clicks a button and gets a 404.

This project's 24-hour data (9 infra / 1 code) is not an anomaly. It's the expected distribution when:
- Code quality tooling is mature (Biome, TypeScript strict, Vitest)
- Configuration quality tooling is absent or minimal
- The architecture spans multiple services and environments

---

## Environment Parity Drift

Dev and prod are separate universes. There is no "copy environment" button. Each environment needs ALL of the following configured independently:

| Resource | Why It's Per-Environment |
|----------|--------------------------|
| Cloud Run service URLs | Unique per project/service |
| Firebase project IDs | Different project = different Firestore, Auth, etc. |
| Secret Manager secrets | Per-project, per-secret, with real values |
| Firestore indexes | Deployed separately per project |
| Firebase Auth domains | Manual console entry per domain |
| IAM roles & service accounts | Per-project permissions |

**Missing any one** produces a silent failure. The billing API was broken for weeks because the wrong project ID passed Zod validation (it was a valid string) but pointed to a project without the billing collection.

### The Drift Pattern

```
Day 1: Set up prod carefully, test everything ✓
Day 30: Create dev environment, copy from prod, miss 2 things ✗
Day 60: Add new service, configure prod, forget dev ✗
Day 90: "Works in prod" — deploy to dev — broken ✗
```

Every new service multiplies the drift surface. Every environment adds a dimension.

---

## The N x (N-1) URL Problem

With 4 services (personal-brand, brand-scraper, chatbot, tasks), there are **12 potential URL configurations** (each service can reference 3 others). Each must be correct, in every environment, simultaneously.

| From \ To | Brand Scraper | Chatbot | Tasks | Personal Brand |
|-----------|---------------|---------|-------|----------------|
| Personal Brand | `BRAND_SCRAPER_API_URL` | `CHATBOT_API_URL` | `NEXT_PUBLIC_TASKS_APP_URL` | (self) |
| Brand Scraper | (self) | - | - | `CALLBACK_URL` |
| Chatbot | - | (self) | - | - |
| Tasks | - | - | (self) | `MAIN_APP_URL` |

A self-referencing URL (service A's env var pointing back to service A) often returns HTTP 200 — just from the wrong service. The personal-brand app serves HTML at any path, so `CHATBOT_API_URL=https://dan-weinbeck.com/api/chat` returns 200 with HTML content instead of the expected JSON from the FastAPI chatbot.

---

## Silent Failures Are the Default

Configuration bugs produce:
- **HTTP 200 with wrong data**: Self-referencing URLs return HTML where JSON was expected
- **Missing features nobody notices**: Brand scraper silently fails, page renders without scores
- **Errors caught and swallowed**: Try/catch around API calls returns defaults instead of errors

The billing API returned `undefined` for weeks. The UI showed "—" for billing amounts. Nobody noticed because `undefined` is a valid "no data yet" state.

### The Fix Isn't "Don't Catch Errors"

Error boundaries and fallbacks are correct for user experience. The fix is:

1. **Validate config at startup, not at point of use** — `src/lib/env.ts` runs Zod validation when the app boots
2. **Probe services after deploy** — `npm run smoke-test` verifies connectivity before declaring success
3. **Check response types** — If you expect JSON and get HTML, something is misconfigured

---

## "Works in Prod" Is Not Validation

Prod was set up carefully months ago. Dev was copied quickly from prod. The implicit assumption "I already did this once" is where drift enters.

**Concrete examples from this project:**

| What Happened | Root Cause | Time to Debug |
|---------------|-----------|---------------|
| Brand scraper returns 404 | URL pointed to main app, not scraper service | 15 min |
| Chatbot returns HTML | URL used path routing (`/api/chat`) instead of subdomain | 30 min |
| All auth fails in dev | `FIREBASE_PROJECT_ID` was GCP numeric ID, not Firebase string ID | 20 min |
| Tasks page blank | Database never created in dev project | 25 min |
| OpenAI calls fail silently | Secret Manager had literal `YOUR_OPENAI_KEY` | 10 min |

**Total: ~2 hours of debugging for zero code bugs.**

---

## Prevention Strategy

See these companion documents for the practical prevention layer:

| Document | What It Provides |
|----------|-----------------|
| [SERVICE-REGISTRY.md](./SERVICE-REGISTRY.md) | Single source of truth for all URLs and project IDs |
| [NEW-SERVICE-CHECKLIST.md](./NEW-SERVICE-CHECKLIST.md) | Step-by-step checklist when adding a new service |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deploy process with validation gates |

### Validation Pipeline

```
Code Quality     →  npm test && npm run lint && npm run build
Config Syntax    →  npm run validate-env
Firestore State  →  npm run verify-indexes -- --project <id>
Post-Deploy      →  npm run smoke-test
```

Each layer catches a different class of bug. Skipping any layer leaves a gap.
