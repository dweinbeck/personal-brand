# Phase 16: Dependency and Environment Cleanup - Research

**Researched:** 2026-02-08
**Domain:** npm dependency management, GCP Cloud Run environment variables, CI/CD configuration
**Confidence:** HIGH

## Summary

This phase completes the v1.3 migration by removing the last vestiges of the old direct-Gemini assistant architecture: the orphaned `@ai-sdk/google` npm package, the obsolete `GOOGLE_GENERATIVE_AI_API_KEY` secret from Cloud Run configuration, and documentation that still references the old stack. The codebase has already been cleaned of all code references (Phase 15 deleted all importers), so this phase is purely mechanical: uninstall a package, update config files, and update documentation.

The research reveals a tight, well-defined scope. `@ai-sdk/google` has zero imports in `src/` (verified by grep), `GOOGLE_GENERATIVE_AI_API_KEY` has zero references in application code (only in `cloudbuild.yaml`, `scripts/setup-cicd.sh`, and docs), and `CHATBOT_API_URL` is already used in the codebase and partially documented in `.env.local.example` but missing from `cloudbuild.yaml`. The documentation (`TECHNICAL_DESIGN.md`, `DEPLOYMENT.md`, `FRD.md`) contains multiple stale references to the old Gemini-direct architecture that need updating.

**Primary recommendation:** Execute in a single plan with 3 tasks: (1) uninstall `@ai-sdk/google` and verify build, (2) update `cloudbuild.yaml` and `scripts/setup-cicd.sh` to remove old secret and add `CHATBOT_API_URL`, (3) update documentation to reflect the FastAPI proxy architecture.

## Standard Stack

This phase does not introduce any new libraries. It removes one:

### Removal
| Library | Version | Status | Reason for Removal |
|---------|---------|--------|-------------------|
| `@ai-sdk/google` | `^3.0.21` | Zero imports in `src/` | Was only imported by `gemini.ts` (deleted in Phase 15). No transitive dependency requires it. |

### Retained (Verified Still In Use)
| Library | Version | Used By | Confirmed |
|---------|---------|---------|-----------|
| `ai` | `^6.0.71` | `src/app/api/assistant/chat/route.ts`, `src/components/assistant/ChatInterface.tsx` | `createUIMessageStream`, `createUIMessageStreamResponse`, `UIMessage`, `DefaultChatTransport` |
| `@ai-sdk/react` | `^3.0.73` | `src/components/assistant/ChatInterface.tsx` | `useChat` hook |
| `zod` | `^4.3.6` | 4 files in `src/` | Schema validation for FastAPI response, contact form, assistant schemas |

### Not Removing (Active Use Confirmed)
All other `package.json` dependencies were verified as actively used:
- `@mdx-js/*`, `@next/mdx` -- `next.config.ts` MDX pipeline
- `@tailwindcss/typography` -- `src/app/globals.css` plugin
- `clsx` -- 4 component files
- `firebase`, `firebase-admin` -- auth and Firestore
- `react-markdown`, `remark-gfm` -- `ReadmeRenderer.tsx`
- `rehype-pretty-code`, `rehype-slug` -- `next.config.ts` MDX plugins
- `schema-dts` -- `src/app/page.tsx` structured data
- `sharp` -- Next.js image optimization (implicit)
- `shiki` -- syntax highlighting (via rehype-pretty-code)

**Uninstall command:**
```bash
npm uninstall @ai-sdk/google
```

## Architecture Patterns

### Pattern 1: Environment Variable Lifecycle
**What:** When a feature is migrated to an external service, its env vars must be removed from all configuration surfaces: `.env.local`, `.env.local.example`, `cloudbuild.yaml`, `scripts/setup-cicd.sh`, documentation, and GCP Secret Manager.
**When to use:** Whenever removing a dependency that had associated secrets/config.

Current env var surfaces in this project:

```
Configuration surfaces:
├── .env.local              # Local dev (gitignored)
├── .env.local.example      # Template (committed)
├── cloudbuild.yaml         # --update-secrets and --set-env-vars
├── scripts/setup-cicd.sh   # Secret Manager creation
├── docs/DEPLOYMENT.md      # Human documentation
└── docs/TECHNICAL_DESIGN.md # Architecture documentation
```

### Pattern 2: Config File Surgery Order
**What:** When modifying `cloudbuild.yaml` and CI/CD scripts, changes should be made and tested in a specific order.
**When to use:** Any CI/CD configuration change.

The order is:
1. Remove from code first (already done in Phase 15)
2. Update `cloudbuild.yaml` (remove old, add new)
3. Update `scripts/setup-cicd.sh` (remove old secret creation)
4. Update `.env.local.example` (already has CHATBOT_API_URL, remove old comment)
5. Update documentation
6. Deploy and verify

### Anti-Patterns to Avoid
- **Removing Cloud Run secrets before deploying updated code:** The deployed service still expects the old env vars until the new image is deployed. Since Phase 15 code is already deployed (or will be), this is safe to do simultaneously.
- **Editing `.env.local` directly:** This is a secret file. Only document what should change; the user handles their own `.env.local`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Package removal | Manual editing of `package.json` | `npm uninstall @ai-sdk/google` | Automatically updates both `package.json` and `package-lock.json` |
| Finding orphaned deps | Manual grep | `npm ls [package]` to verify zero dependents | npm handles transitive dependency analysis |

**Key insight:** This phase is entirely configuration surgery -- no code to write, only files to edit and a package to uninstall.

## Common Pitfalls

### Pitfall 1: Forgetting package-lock.json
**What goes wrong:** Manually removing `@ai-sdk/google` from `package.json` but not regenerating `package-lock.json`.
**Why it happens:** Developers edit `package.json` directly instead of using `npm uninstall`.
**How to avoid:** Use `npm uninstall @ai-sdk/google` which updates both files atomically.
**Warning signs:** `npm ci` fails in Docker build because lockfile is inconsistent.

### Pitfall 2: Stale Documentation Creates Confusion
**What goes wrong:** Documentation still references `@ai-sdk/google`, `GOOGLE_GENERATIVE_AI_API_KEY`, `GOOGLE_API_KEY`, Gemini direct calls, safety pipeline, and knowledge base -- all of which no longer exist.
**Why it happens:** Docs were written for the old architecture and never updated during Phases 13-15.
**How to avoid:** Update all three docs (`TECHNICAL_DESIGN.md`, `DEPLOYMENT.md`, `FRD.md`) in this phase.
**Warning signs:** Any reference to `@ai-sdk/google`, `gemini.ts`, `streamText()` for assistant, safety pipeline, `GOOGLE_GENERATIVE_AI_API_KEY`, or `GOOGLE_API_KEY` in docs.

### Pitfall 3: DEPLOYMENT.md Uses Wrong Env Var Name
**What goes wrong:** `DEPLOYMENT.md` references `GOOGLE_API_KEY` in 4 places, but `cloudbuild.yaml` uses `GOOGLE_GENERATIVE_AI_API_KEY`. Neither is correct anymore since the app no longer calls Gemini directly.
**Why it happens:** Documentation was written with a different env var name than what was actually configured.
**How to avoid:** Remove both names from docs. Replace with `CHATBOT_API_URL` documentation.
**Warning signs:** Any mention of `GOOGLE_API_KEY` or `GOOGLE_GENERATIVE_AI_API_KEY` in documentation.

### Pitfall 4: Missing CHATBOT_API_URL in cloudbuild.yaml
**What goes wrong:** The FastAPI proxy needs `CHATBOT_API_URL` at runtime on Cloud Run, but it is currently NOT configured in `cloudbuild.yaml` `--set-env-vars`.
**Why it happens:** Phase 13 added the code that reads `CHATBOT_API_URL` but did not update `cloudbuild.yaml`.
**How to avoid:** Add `CHATBOT_API_URL` to the `--set-env-vars` line in `cloudbuild.yaml`.
**Warning signs:** Assistant chat returns 503 "CHATBOT_API_URL not configured" in production.

### Pitfall 5: Orphaning the Secret Manager Secret
**What goes wrong:** `google-ai-api-key` secret still exists in GCP Secret Manager and in the `--update-secrets` line of `cloudbuild.yaml`. Cloud Build will fail if the secret is deleted from Secret Manager but still referenced in the YAML.
**Why it happens:** The secret removal from `cloudbuild.yaml` and from Secret Manager must happen together.
**How to avoid:** Remove from `cloudbuild.yaml` first (in code). Then document that the user should delete the Secret Manager secret manually (this is a GCP console/CLI operation, not a code change).
**Warning signs:** Cloud Build failure referencing a missing secret.

### Pitfall 6: .env.local.example Has Stale Comment
**What goes wrong:** Line 19 of `.env.local.example` says `# --- AI Assistant (Gemini via Vercel AI SDK) ---` which is incorrect -- the assistant now uses FastAPI, not Gemini directly.
**Why it happens:** Comment was written for the old architecture.
**How to avoid:** Update the comment to reference FastAPI proxy architecture.

## Code Examples

### Removing @ai-sdk/google
```bash
# Verify zero imports first
grep -r "@ai-sdk/google" src/
# Should return no results

# Uninstall
npm uninstall @ai-sdk/google

# Verify build still passes
npm run build
```

### Updated cloudbuild.yaml --set-env-vars line
```yaml
# BEFORE (current):
- '--set-env-vars=FIREBASE_PROJECT_ID=${PROJECT_ID},NEXT_PUBLIC_FIREBASE_API_KEY=${_NEXT_PUBLIC_FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${_NEXT_PUBLIC_FIREBASE_PROJECT_ID}'
- '--update-secrets=GOOGLE_GENERATIVE_AI_API_KEY=google-ai-api-key:latest,GITHUB_TOKEN=github-token:latest,TODOIST_API_TOKEN=todoist-api-token:latest'

# AFTER:
- '--set-env-vars=FIREBASE_PROJECT_ID=${PROJECT_ID},NEXT_PUBLIC_FIREBASE_API_KEY=${_NEXT_PUBLIC_FIREBASE_API_KEY},NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN},NEXT_PUBLIC_FIREBASE_PROJECT_ID=${_NEXT_PUBLIC_FIREBASE_PROJECT_ID},CHATBOT_API_URL=${_CHATBOT_API_URL}'
- '--update-secrets=GITHUB_TOKEN=github-token:latest,TODOIST_API_TOKEN=todoist-api-token:latest'
```

Note: `CHATBOT_API_URL` is a regular env var (not a secret -- it is a URL, not a credential). It should go in `--set-env-vars` and use a substitution variable `_CHATBOT_API_URL` for configuration flexibility.

### Updated .env.local.example section
```bash
# --- AI Assistant (FastAPI Proxy) ---
# URL for the external FastAPI RAG backend
# Local dev: point to your local FastAPI instance or deployed Cloud Run service
# Production: set to the Cloud Run FastAPI service URL (e.g., https://chatbot-assistant-XXXXX-uc.a.run.app)
CHATBOT_API_URL=https://your-fastapi-service-url.run.app
```

### Updated scripts/setup-cicd.sh -- Remove google-ai-api-key
```bash
# REMOVE these lines from setup-cicd.sh:
echo "${GOOGLE_GENERATIVE_AI_API_KEY:-}" | gcloud secrets create google-ai-api-key --data-file=- 2>/dev/null \
  || echo "${GOOGLE_GENERATIVE_AI_API_KEY:-}" | gcloud secrets versions add google-ai-api-key --data-file=-

# REMOVE google-ai-api-key from the secrets loop:
for SECRET in github-token todoist-api-token; do  # was: google-ai-api-key github-token todoist-api-token
```

## Inventory of All Changes Required

### Files to Modify

| File | Change | Type |
|------|--------|------|
| `package.json` | Remove `@ai-sdk/google` | `npm uninstall` |
| `package-lock.json` | Auto-updated by `npm uninstall` | Auto |
| `cloudbuild.yaml` | Remove `GOOGLE_GENERATIVE_AI_API_KEY` from `--update-secrets`, add `CHATBOT_API_URL` to `--set-env-vars`, add `_CHATBOT_API_URL` substitution | Edit |
| `scripts/setup-cicd.sh` | Remove `google-ai-api-key` secret creation and from loop | Edit |
| `.env.local.example` | Update comment on line 19, update `CHATBOT_API_URL` value/docs | Edit |
| `docs/DEPLOYMENT.md` | Replace `GOOGLE_API_KEY` with `CHATBOT_API_URL`, update troubleshooting | Edit |
| `docs/TECHNICAL_DESIGN.md` | Update "Google AI (Gemini)" section to "FastAPI RAG Backend", update ADRs 33-35 | Edit |
| `docs/FRD.md` | Update ASST-02, ASST-03, ASST-19 descriptions to reflect FastAPI architecture | Edit |

### Env Var Changes Summary

| Env Var | Current State | Target State |
|---------|--------------|--------------|
| `GOOGLE_GENERATIVE_AI_API_KEY` | In `cloudbuild.yaml` `--update-secrets`, in `scripts/setup-cicd.sh` | Remove from both files |
| `GOOGLE_API_KEY` | Referenced in `docs/DEPLOYMENT.md` (4 places) | Remove all references |
| `CHATBOT_API_URL` | In `src/lib/assistant/fastapi-client.ts`, in `.env.local.example`, in `.env.local` | Add to `cloudbuild.yaml` `--set-env-vars` |

### Manual User Actions (Not Automatable)

| Action | Why Manual |
|--------|-----------|
| Delete `google-ai-api-key` from GCP Secret Manager | Requires GCP console/CLI access with appropriate permissions |
| Update Cloud Build trigger substitutions to add `_CHATBOT_API_URL` | GCP console or CLI; value is environment-specific |
| Remove `GOOGLE_GENERATIVE_AI_API_KEY` from `.env.local` | Already done (verified absent), but should be documented |
| Revoke the Gemini API key in Google AI Studio | Security hygiene -- key is no longer needed |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct Gemini calls via `@ai-sdk/google` | FastAPI proxy via `CHATBOT_API_URL` | Phase 13 (2026-02-08) | No Gemini dependency in Next.js |
| `GOOGLE_GENERATIVE_AI_API_KEY` in Cloud Run | `CHATBOT_API_URL` (non-secret URL) | This phase (16) | Simpler config, one fewer secret |
| Safety pipeline in Next.js | Safety handled by FastAPI backend | Phase 13 (2026-02-08) | Less code, centralized safety |

**Deprecated/outdated:**
- `@ai-sdk/google`: No longer needed; LLM calls moved to FastAPI backend
- `GOOGLE_GENERATIVE_AI_API_KEY`: Orphaned secret; Gemini key now managed by FastAPI service
- `GOOGLE_API_KEY`: Never existed in code; was a documentation error for `GOOGLE_GENERATIVE_AI_API_KEY`

## Open Questions

1. **What is the actual CHATBOT_API_URL value for production?**
   - What we know: It points to a Cloud Run FastAPI service (e.g., `https://chatbot-assistant-XXXXX-uc.a.run.app`)
   - What's unclear: The exact URL -- the user needs to provide this for the `_CHATBOT_API_URL` substitution variable
   - Recommendation: Add `_CHATBOT_API_URL: ''` as a substitution in `cloudbuild.yaml` and document that it must be set in the Cloud Build trigger configuration

2. **Should the `google-ai-api-key` secret be deleted from GCP Secret Manager?**
   - What we know: It will no longer be referenced after this phase. Leaving it incurs no cost but is security debt.
   - What's unclear: Whether the key is used by any other service
   - Recommendation: Document as a manual step; advise user to revoke the key in Google AI Studio and delete the secret from Secret Manager

3. **How much documentation updating is appropriate?**
   - What we know: `TECHNICAL_DESIGN.md`, `DEPLOYMENT.md`, and `FRD.md` all have stale Gemini references
   - What's unclear: Whether full documentation rewrite is in scope or just targeted fixes
   - Recommendation: Targeted fixes only -- update the specific sections that reference removed components. Do not rewrite entire documents.

## Sources

### Primary (HIGH confidence)
- **Codebase grep for `@ai-sdk/google` in `src/`**: Zero results -- confirmed no imports
- **`npm ls @ai-sdk/google`**: Direct dependency only, no transitive dependents
- **`package.json`**: Line 13 lists `@ai-sdk/google` at `^3.0.21`
- **`cloudbuild.yaml`**: Lines 38-39 show current env var and secret configuration
- **`scripts/setup-cicd.sh`**: Lines 39-40 create `google-ai-api-key` secret
- **`.env.local.example`**: Line 22 has `CHATBOT_API_URL=/api/assistant/chat` (stale default value)
- **`.env.local`**: Verified `GOOGLE_GENERATIVE_AI_API_KEY` absent, `CHATBOT_API_URL` present
- **`docs/DEPLOYMENT.md`**: References `GOOGLE_API_KEY` (wrong name) in 4 places
- **`docs/TECHNICAL_DESIGN.md`**: Lines 382-390 describe old Gemini architecture

### Secondary (MEDIUM confidence)
- **Phase 15 summaries**: Confirm all old assistant files deleted, zero stale imports remain

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Direct grep verification of all imports, `npm ls` for dependency tree
- Architecture: HIGH - All configuration files read and cross-referenced
- Pitfalls: HIGH - Based on actual file contents, not hypothetical scenarios
- Documentation scope: HIGH - All three docs files grepped for stale references

**Research date:** 2026-02-08
**Valid until:** 2026-03-08 (stable -- no external dependencies changing)
