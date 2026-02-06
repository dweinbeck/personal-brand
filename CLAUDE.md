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

## AI SDK Gotchas (Vercel AI SDK v5+)

Avoid these common mistakes:

| Wrong | Right |
|-------|-------|
| `useChat` returns `input`, `handleSubmit` | Returns `messages`, `sendMessage`, `status` |
| `message.content` | `message.parts.filter(p => p.type === "text")` |
| `streamText({ maxTokens })` | `streamText({ maxOutputTokens })` |
| `result.toDataStreamResponse()` | `result.toUIMessageStreamResponse()` |
