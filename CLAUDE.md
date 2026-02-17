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

### Service Map

This app coordinates with external services. Every service URL must point to a DISTINCT external service, never back to this app.

| Service | Env Var | What It Is | What It Is NOT |
|---------|---------|-----------|---------------|
| Chatbot (FastAPI) | `CHATBOT_API_URL` | Separate Cloud Run service | NOT a path on this app |
| Brand Scraper | `BRAND_SCRAPER_API_URL` | Separate Cloud Run service | NOT `dan-weinbeck.com/...` |
| Tasks App | `NEXT_PUBLIC_TASKS_APP_URL` | Separate app on tasks subdomain | NOT `dan-weinbeck.com/tasks` |

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

### Infrastructure Validation Protocol

Before every deploy, run in order:
1. `npm test && npm run lint && npm run build` (code quality)
2. `npm run validate-env` (config syntax + semantics)
3. `npm run verify-indexes -- --project <id>` (Firestore indexes)
4. After deploy: `npm run smoke-test` (service connectivity)

When adding a new external service, follow `docs/NEW-SERVICE-CHECKLIST.md`.

---

## AI SDK Gotchas (Vercel AI SDK v5+)

Avoid these common mistakes:

| Wrong | Right |
|-------|-------|
| `useChat` returns `input`, `handleSubmit` | Returns `messages`, `sendMessage`, `status` |
| `message.content` | `message.parts.filter(p => p.type === "text")` |
| `streamText({ maxTokens })` | `streamText({ maxOutputTokens })` |
| `result.toDataStreamResponse()` | `result.toUIMessageStreamResponse()` |
