# Service Registry

> Single source of truth for all service URLs, project IDs, and infrastructure state across environments.

Last updated: 2026-02-17

---

## Service URL Matrix

| Env Var | Prod | Dev | Local |
|---------|------|-----|-------|
| `CHATBOT_API_URL` | Cloud Run URL (set in Cloud Build trigger) | Cloud Run URL (set in Cloud Build trigger) | `http://localhost:8000` |
| `BRAND_SCRAPER_API_URL` | Cloud Run URL (set in Cloud Build trigger) | Cloud Run URL (set in Cloud Build trigger) | `http://localhost:8001` |
| `NEXT_PUBLIC_TASKS_APP_URL` | `https://tasks.dan-weinbeck.com` | `https://tasks.dev.dan-weinbeck.com` | `http://localhost:3001` |

**Key rule:** Every service URL must point to a **distinct external service**, never back to this app. See [CONFIGURATION-RESILIENCE.md](./CONFIGURATION-RESILIENCE.md) for why.

---

## Project ID Reference

| Identifier | Value | Where It's Used |
|------------|-------|----------------|
| Firebase Project ID | `personal-brand-486314` | `FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| GCP Project (Prod) | *(set in Cloud Build trigger)* | `gcloud` CLI, Cloud Run, Secret Manager |
| GCP Project (Dev) | `personal-brand-dev-487114` | `gcloud` CLI, Cloud Run, Secret Manager |

### Firebase vs GCP Project ID

These are **different things** and this is a common source of bugs:

| | Firebase Project ID | GCP Project Number |
|---|---|---|
| Format | `personal-brand-486314` (string with hyphens) | `123456789012` (pure numeric) |
| Where to find | Firebase Console -> Project Settings | GCP Console -> Dashboard |
| Used for | Auth token verification, Firestore access | Billing, IAM, API enablement |
| In env vars | `FIREBASE_PROJECT_ID` | Never in this app's env vars |

**Rule:** `FIREBASE_PROJECT_ID` must **always** equal `NEXT_PUBLIC_FIREBASE_PROJECT_ID`. Both must be the Firebase string ID, never a numeric GCP project number.

---

## Firebase Auth Domains

These must be manually added in Firebase Console (Authentication -> Settings -> Authorized domains):

| Environment | Domains to Add |
|-------------|---------------|
| Production | `dan-weinbeck.com` |
| Development | `dev.dan-weinbeck.com` |
| Cloud Run (direct) | `personal-brand-pcyrow43pa-uc.a.run.app` |
| Local | `localhost` (added by default) |

**Symptom of missing domain:** `auth/unauthorized-domain` error in browser console. This is a client-side error with no server-side fix — the domain must be added in the Firebase Console.

---

## Per-Environment Infrastructure Checklist

Use this when setting up a new environment or verifying an existing one.

### Prod Environment

- [ ] Cloud Run service deployed and accessible
- [ ] Cloud Build trigger configured with all `_SUBSTITUTION` variables
- [ ] `FIREBASE_PROJECT_ID` = `personal-brand-486314` (not GCP project number)
- [ ] Firebase Auth domain `dan-weinbeck.com` added in Console
- [ ] Firestore indexes deployed: `npm run verify-indexes -- --project personal-brand-486314`
- [ ] Secret Manager secrets have real values (not placeholders)
- [ ] Service account has `roles/datastore.user` for Firestore
- [ ] CHATBOT_API_URL points to chatbot Cloud Run service (not this app)
- [ ] BRAND_SCRAPER_API_URL points to scraper Cloud Run service (not this app)

### Dev Environment

- [ ] Cloud Run service deployed and accessible
- [ ] Cloud Build trigger configured with all `_SUBSTITUTION` variables
- [ ] `FIREBASE_PROJECT_ID` = `personal-brand-486314` (shared Firebase project)
- [ ] Firebase Auth domain `dev.dan-weinbeck.com` added in Console
- [ ] Firestore indexes deployed: `npm run verify-indexes -- --project personal-brand-486314`
- [ ] Secret Manager secrets have real values in dev GCP project
- [ ] Service account has `roles/datastore.user` for Firestore
- [ ] CHATBOT_API_URL points to dev chatbot Cloud Run service
- [ ] BRAND_SCRAPER_API_URL points to dev scraper Cloud Run service
- [ ] Tasks database created in dev project (if applicable)

### Local Environment

- [ ] `.env.local` created from `.env.local.example` with real values
- [ ] `FIREBASE_PROJECT_ID` matches `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- [ ] External service URLs point to running local services or deployed dev services
- [ ] `npm run validate-env` passes

---

## Service Architecture Diagram

```
                    ┌─────────────────────┐
                    │   dan-weinbeck.com   │
                    │   (personal-brand)   │
                    │   Next.js on Cloud   │
                    │        Run           │
                    └──┬───────┬───────┬───┘
                       │       │       │
          CHATBOT_API  │       │       │  BRAND_SCRAPER_API
            _URL       │       │       │    _URL
                       ▼       │       ▼
              ┌────────────┐   │   ┌────────────────┐
              │  Chatbot   │   │   │ Brand Scraper   │
              │  (FastAPI) │   │   │   (Fastify)     │
              │  Cloud Run │   │   │   Cloud Run     │
              └────────────┘   │   └────────────────┘
                               │
                   NEXT_PUBLIC  │
                  _TASKS_APP   │
                    _URL       │
                               ▼
                      ┌────────────────┐
                      │   Tasks App    │
                      │   (separate)   │
                      │ tasks.dan-     │
                      │ weinbeck.com   │
                      └────────────────┘
```

Each box is a **separate Cloud Run service** with its own URL. Arrows represent env var references. If any arrow points back to the source box, that's a misconfiguration.
