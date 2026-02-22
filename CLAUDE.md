# Project Instructions

> Inherits from `~/.claude/CLAUDE.md` — only project-specific overrides below.

---

## Quick Reference

```bash
npm test && npm run lint && npm run build   # Quality gates
npm run dev                                  # Local dev server (port 3000)
```

---

## Project-Specific Zones

### Safe Zones
- `src/components/` — React components (organized by feature)
- `src/app/` — Next.js App Router pages and API routes
- `src/lib/` — Utilities, actions, Firebase config
- `src/data/` — AI assistant knowledge base (JSON/MD files)
- `docs/` — FRD, Technical Design, Deployment docs

### Caution Zones
- `src/lib/firebase.ts` — Firebase Admin SDK singleton (credential handling)
- `src/lib/assistant/safety.ts` — AI safety pipeline (security-critical)
- `src/app/api/` — Server routes (auth checks required)

---

## Git Workflow Override

This project uses **trunk-based development**:
- Commit directly to `master` for most changes
- Push to `master` after each completed phase
- Feature branches only for experimental/risky changes

### Deployment Order (MANDATORY)

**NEVER push directly to `master` for deployment.** Always deploy to staging first:

1. **Push `dev` to `origin/dev`** → triggers Cloud Build on `personal-brand-dev-487114` (staging)
2. **Wait for staging build to succeed** and user to verify at `dev.dan-weinbeck.com`
3. **Only after user approves staging** → merge `dev` into `master` and push to `origin/master` (production)

Pushing to `master` without first deploying and testing on `dev` is **forbidden**. No exceptions.

---

## Documentation Triggers (Project-Specific)

| Document | Location | Trigger |
|----------|----------|---------|
| README | `README.md` | Tech stack change, new major feature |
| FRD | `docs/FRD.md` | New scenario, requirement status change |
| Technical Design | `docs/TECHNICAL_DESIGN.md` | API change, new integration, ADR |
| Deployment | `docs/DEPLOYMENT.md` | Build/deploy process change, new env var |

---

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| Cloud | GCP Cloud Run |
| Frontend | Next.js 16, React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes (RSC) |
| Database | Firebase Firestore |
| AI/LLM | Gemini 2.0 Flash (Vercel AI SDK) |
| Auth | Firebase Auth (Google Sign-In) |
| Linting | Biome v2.3 |

---

## Key Patterns (Reference)

- **Components:** Server components by default; `"use client"` only for forms, chat, auth
- **Shared UI:** `Button` and `Card` in `src/components/ui/`
- **Rate limiting:** In-memory Map pattern (see `src/lib/actions/contact.ts`)
- **Admin guard:** Client-side email check via `AdminGuard` component
- **AI safety:** Multi-layer pipeline runs BEFORE LLM call (sanitize → detect → refuse)

---

## Multi-Service Architecture

### Service URL Sanity Rule

> **MUST: Every service URL MUST be a distinct external service — never a path on this app.** Self-referencing URLs are the #1 recurring config bug. Validate with `npm run validate-env` before every commit that touches service URLs.

### Service Map

This app coordinates with external services.

| Service | Env Var | What It Is | What It Is NOT |
|---------|---------|-----------|---------------|
| Chatbot (FastAPI) | `CHATBOT_API_URL` | Separate Cloud Run service | NOT a path on this app |
| Brand Scraper | `BRAND_SCRAPER_API_URL` | Separate Cloud Run service | NOT `dan-weinbeck.com/...` |

> **Note:** Tasks is integrated within this app at `/apps/tasks` -- it is not an external service.

### Proven Configuration Mistakes (From Real Bugs)

| # | Mistake | Symptom | Prevention |
|---|---------|---------|------------|
| 1 | Service URL points back to this app | 404 or HTML where JSON expected | `npm run validate-env` |
| 2 | URL uses path routing instead of subdomain | Wrong service handles request | Check hostname is distinct |
| 3 | `FIREBASE_PROJECT_ID` is GCP project, not Firebase | All auth fails | Must equal `NEXT_PUBLIC_FIREBASE_PROJECT_ID` |
| 4 | Secret Manager has placeholder value | API errors silently caught | `npm run validate-env` |
| 5 | Firebase Auth domain not added | `auth/unauthorized-domain` | Manual: Firebase Console |
| 6 | Firestore indexes not deployed to target env | 500 "requires an index" | `npm run verify-indexes` |
| 7 | Database not created for service | Connection refused | Run migrations BEFORE deploy |
| 8 | Cookie auth across subdomains | Blank page, auth mismatch | Cookie domain: `.dan-weinbeck.com` |
| 9 | Env var in code but missing from `cloudbuild.yaml` | `undefined` at runtime, feature silently broken | `grep VAR_NAME cloudbuild.yaml` |
| 10 | Secret in `cloudbuild.yaml` but not created in Secret Manager | Deploy fails or var is empty | `gcloud secrets describe NAME --project=<id>` |
| 11 | Secret exists in prod but not dev (or vice versa) | Works in one env, breaks in other | Check BOTH projects before deploy |

### Env Var Safety System (Automated)

The project has automated tooling to prevent the #1 recurring deployment failure: env vars in code but missing from `cloudbuild.yaml`.

| Tool | Command | Purpose |
|------|---------|---------|
| Deploy audit | `npm run audit-env-deploy` | Cross-references `process.env.*` in src/ against cloudbuild.yaml |
| Add env var | `/add-env-var VAR_NAME` | Walks through all 6 provisioning steps automatically |

**Rules:**
- **Never add `process.env.*` without running `/add-env-var`** — it ensures .env.local.example, env.ts, validate-env.ts, and cloudbuild.yaml are all updated.
- **Run `npm run audit-env-deploy` before every deploy** — it's integrated into `/pre-deploy` and `/deploy`.
- The audit exits non-zero if any required var is missing from cloudbuild.yaml.
- Allowlisted vars (runtime-provided like `NODE_ENV`, `K_SERVICE`; local-only like `FIREBASE_CLIENT_EMAIL`) are auto-skipped.
- Vars with code fallbacks (like `BILLING_URL`) show as WARN, not FAIL.

### New Env Var Provisioning Checklist (MANDATORY)

When ANY code change introduces a new `process.env.*` reference, ALL of these must happen before the change is considered complete. **`validate-env` passing locally does NOT mean the var will work in Cloud Run.**

| # | Step | Who | Verification |
|---|------|-----|-------------|
| 1 | Add to `.env.local.example` with description | Claude | `grep VAR_NAME .env.local.example` |
| 2 | Add to `src/lib/env.ts` Zod schema (if validated) | Claude | Build passes |
| 3 | Add to `scripts/validate-env.ts` (if format-checked) | Claude | Script includes var |
| 4 | Add to `cloudbuild.yaml` `--set-secrets` or `--set-env-vars` | Claude | `grep VAR_NAME cloudbuild.yaml` |
| 5 | Create secret in GCP Secret Manager for **dev** (`personal-brand-dev-487114`) | **User** | `gcloud secrets describe SECRET_NAME --project=personal-brand-dev-487114` |
| 6 | Create secret in GCP Secret Manager for **prod** (`personal-brand-486314`) | **User** | `gcloud secrets describe SECRET_NAME --project=personal-brand-486314` |

**Step 4 is the #1 missed step.** The var exists locally and in `.env.local.example`, but Cloud Run never receives it because `cloudbuild.yaml` wasn't updated.

**Steps 5-6 require user action.** Claude MUST surface these as explicit action items with the exact `gcloud` commands. Never assume secrets exist — always tell the user to verify.

Example user action item format:
```
ACTION REQUIRED: Create these secrets in GCP Secret Manager:

# Dev environment
gcloud secrets create my-new-secret --project=personal-brand-dev-487114
echo -n "actual-value" | gcloud secrets versions add my-new-secret --data-file=- --project=personal-brand-dev-487114

# Prod environment
gcloud secrets create my-new-secret --project=personal-brand-486314
echo -n "actual-value" | gcloud secrets versions add my-new-secret --data-file=- --project=personal-brand-486314
```

### cloudbuild.yaml ↔ Code Audit

Before any deploy, cross-reference these two sources. Every `process.env.*` used at runtime must appear in one of:
- `cloudbuild.yaml --set-env-vars` (for non-secret config)
- `cloudbuild.yaml --set-secrets` (for secrets from Secret Manager)
- Built into the Docker image via `--build-arg` (for `NEXT_PUBLIC_*` vars)

If a var is in code but NOT in `cloudbuild.yaml`, Cloud Run will receive `undefined` — even if `validate-env` passes locally.

### Infrastructure Validation Protocol

Before every deploy, run in order:
1. `npm test && npm run lint && npm run build` (code quality)
2. `npm run audit-env-deploy` (code ↔ cloudbuild.yaml cross-reference)
3. `npm run validate-env` (config syntax + semantics — local only)
4. `npm run verify-indexes -- --project <id>` (Firestore indexes)
5. After deploy: `npm run smoke-test` (service connectivity)

When adding a new external service, follow `docs/NEW-SERVICE-CHECKLIST.md`.

### Mandatory `validate-env` Gate

Run `npm run validate-env` before any PR/commit that touches:
- `src/app/api/**` (server routes)
- `src/lib/firebase.ts` (Firebase config)
- Any file referencing `process.env`
- Any service URL usage

**Remember:** `validate-env` only validates your local `.env.local`. It cannot verify that secrets exist in GCP Secret Manager or that `cloudbuild.yaml` includes them.

---

## AI SDK Gotchas (Vercel AI SDK v5+)

Avoid these common mistakes:

| Wrong | Right |
|-------|-------|
| `useChat` returns `input`, `handleSubmit` | Returns `messages`, `sendMessage`, `status` |
| `message.content` | `message.parts.filter(p => p.type === "text")` |
| `streamText({ maxTokens })` | `streamText({ maxOutputTokens })` |
| `result.toDataStreamResponse()` | `result.toUIMessageStreamResponse()` |
