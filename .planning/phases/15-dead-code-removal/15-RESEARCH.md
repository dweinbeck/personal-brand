# Phase 15: Dead Code Removal - Research

**Researched:** 2026-02-08
**Domain:** Code deletion, dependency cleanup, Next.js App Router file-based routing
**Confidence:** HIGH

## Summary

This phase involves surgically removing all old assistant backend code that was replaced by the FastAPI proxy architecture in earlier phases. The codebase has a clean separation: new code (FastAPI client, Zod schemas, citation utils, route handler) is already in place and working, while old code (safety pipeline, knowledge base, Gemini integration, admin panel, rate limiting, logging) is entirely dead -- no longer imported by any active code path.

The primary risk is accidentally deleting files that are still in use (notably `projects.json` and `accomplishments.json` which are used by non-assistant code) or breaking the `HumanHandoff` component (which depends on `handoff.ts`, currently inside the assistant directory). The control center parent layout, page, and non-assistant routes (todoist) must be preserved.

**Primary recommendation:** Move `handoff.ts` to `src/lib/utils/` first, update its one import in `HumanHandoff.tsx`, then bulk-delete all old assistant files, admin routes/pages/components, and old data files in a single coordinated commit. Verify with `npm run build` after each logical group of deletions.

## Standard Stack

No new libraries are needed for this phase. This is pure deletion and file reorganization.

### Core (What STAYS)
| File/Module | Location | Purpose | Why It Stays |
|-------------|----------|---------|--------------|
| `fastapi-client.ts` | `src/lib/assistant/` | Typed client for FastAPI backend | Active -- imported by `route.ts` |
| `fastapi.ts` (schemas) | `src/lib/schemas/fastapi.ts` | Zod schemas for FastAPI response | Active -- imported by `fastapi-client.ts` |
| `assistant.ts` (schemas) | `src/lib/schemas/assistant.ts` | Zod schemas for chat request validation | Active -- imported by `route.ts` |
| `citation-utils.ts` | `src/lib/citation-utils.ts` | GitHub permalink builder | Active -- imported by `route.ts` |
| `route.ts` (chat) | `src/app/api/assistant/chat/route.ts` | Chat API endpoint (FastAPI proxy) | Active -- the main chat endpoint |
| `handoff.ts` | `src/lib/assistant/` -> move to `src/lib/utils/` | Mailto link builder for HumanHandoff | Active -- imported by `HumanHandoff.tsx` |
| `projects.json` | `src/data/` | Project configuration data | Active -- imported by `src/lib/github.ts` |
| `accomplishments.json` | `src/data/` | Accomplishments data | Active -- imported by `src/lib/accomplishments.ts` |

### To Be Removed
| File/Module | Location | Reason for Removal |
|-------------|----------|-------------------|
| `analytics.ts` | `src/lib/assistant/` | Old Firestore analytics, only used by removed admin pages |
| `facts-store.ts` | `src/lib/assistant/` | Old Firestore facts CRUD, only used by removed admin routes |
| `filters.ts` | `src/lib/assistant/` | Old safety pipeline input filters, replaced by FastAPI |
| `gemini.ts` | `src/lib/assistant/` | Old Gemini model config, replaced by FastAPI |
| `knowledge.ts` | `src/lib/assistant/` | Old knowledge base loader, replaced by FastAPI RAG |
| `lead-capture.ts` | `src/lib/assistant/` | Old hiring intent detection, not used anywhere |
| `logging.ts` | `src/lib/assistant/` | Old Firestore conversation logging, replaced by FastAPI |
| `prompt-versions.ts` | `src/lib/assistant/` | Old prompt versioning, only used by removed admin |
| `prompts.ts` | `src/lib/assistant/` | Old system prompt builder, replaced by FastAPI |
| `rate-limit.ts` | `src/lib/assistant/` | Old in-memory rate limiter, replaced by FastAPI |
| `refusals.ts` | `src/lib/assistant/` | Old refusal message generator, replaced by FastAPI |
| `safety.ts` | `src/lib/assistant/` | Old safety pipeline orchestrator, replaced by FastAPI |

### API Routes to Remove
| Route | Location | Reason |
|-------|----------|--------|
| `/api/assistant/facts` | `src/app/api/assistant/facts/route.ts` | Admin-only facts CRUD |
| `/api/assistant/feedback` | `src/app/api/assistant/feedback/route.ts` | Old feedback logging |
| `/api/assistant/prompt-versions` | `src/app/api/assistant/prompt-versions/route.ts` | Old prompt rollback |
| `/api/assistant/reindex` | `src/app/api/assistant/reindex/route.ts` | Old knowledge cache clear |

### Admin Pages to Remove
| Page | Location | Reason |
|------|----------|--------|
| `/control-center/assistant` | `src/app/control-center/assistant/page.tsx` | Old analytics dashboard |
| `/control-center/assistant/facts` | `src/app/control-center/assistant/facts/page.tsx` | Old facts editor |

### Admin Components to Remove
| Component | Location | Reason |
|-----------|----------|--------|
| `AssistantAnalytics` | `src/components/admin/AssistantAnalytics.tsx` | Used only by removed admin page |
| `FactsEditor` | `src/components/admin/FactsEditor.tsx` | Used only by removed admin page |
| `PromptVersions` | `src/components/admin/PromptVersions.tsx` | Used only by removed admin page |
| `ReindexButton` | `src/components/admin/ReindexButton.tsx` | Used only by removed admin page |
| `TopQuestions` | `src/components/admin/TopQuestions.tsx` | Used only by removed admin page |
| `UnansweredQuestions` | `src/components/admin/UnansweredQuestions.tsx` | Used only by removed admin page |

### Data Files to Remove
| File | Location | Reason |
|------|----------|--------|
| `approved-responses.json` | `src/data/` | Only used by `refusals.ts` (being deleted) |
| `canon.json` | `src/data/` | Only used by `knowledge.ts` (being deleted) |
| `contact.json` | `src/data/` | Only used by `knowledge.ts` (being deleted) |
| `faq.json` | `src/data/` | Only used by `knowledge.ts` (being deleted) |
| `safety-rules.json` | `src/data/` | Only used by `filters.ts` (being deleted) |
| `services.md` | `src/data/` | Only used by `knowledge.ts` (being deleted) |
| `writing.json` | `src/data/` | Only used by `knowledge.ts` (being deleted) |

### Npm Package to Remove
| Package | Current Version | Reason |
|---------|----------------|--------|
| `@ai-sdk/google` | `^3.0.21` | Only imported by `gemini.ts` (being deleted). No other file uses it. |

### Files to Keep (Potential Confusion Points)
| File | Location | Why KEEP |
|------|----------|----------|
| `useIdToken.ts` | `src/hooks/` | Only used by deleted components currently, but is a general auth utility. **Decision: Could delete or keep.** Currently only imported by `FactsEditor`, `PromptVersions`, `ReindexButton` -- all being deleted. If no other admin routes need it, it becomes dead code. |
| `admin.ts` | `src/lib/auth/` | Only imported by deleted assistant API routes currently, but is a general admin auth utility. **Decision: Could delete or keep.** |
| `AdminGuard.tsx` | `src/components/admin/` | Used by `control-center/layout.tsx` which wraps ALL control center pages (todoist, etc.). **MUST KEEP.** |
| `RepoCard.tsx` | `src/components/admin/` | Used by control-center main page. **MUST KEEP.** |
| `TodoistBoard.tsx` | `src/components/admin/` | Used by todoist pages. **MUST KEEP.** |
| `TodoistProjectCard.tsx` | `src/components/admin/` | Used by control-center main page. **MUST KEEP.** |

## Architecture Patterns

### Recommended Deletion Order

The order matters to avoid transient broken imports during multi-file operations:

```
Step 1: Move handoff.ts to src/lib/utils/handoff.ts
        Update import in src/components/assistant/HumanHandoff.tsx
        Build & verify

Step 2: Delete admin pages (src/app/control-center/assistant/ directory)
        Delete admin API routes (src/app/api/assistant/facts/, feedback/, prompt-versions/, reindex/)
        Delete admin components (AssistantAnalytics, FactsEditor, PromptVersions, ReindexButton, TopQuestions, UnansweredQuestions)
        Build & verify

Step 3: Delete old assistant library files (analytics, facts-store, filters, gemini, knowledge, lead-capture, logging, prompt-versions, prompts, rate-limit, refusals, safety)
        Delete old data files (approved-responses.json, canon.json, contact.json, faq.json, safety-rules.json, services.md, writing.json)
        Build & verify

Step 4: Remove @ai-sdk/google from package.json
        Run npm install to update lockfile
        Build & verify

Step 5: (Optional) Delete useIdToken.ts and lib/auth/admin.ts if no longer needed
        Build & verify
```

### Post-Deletion Directory Structure

After cleanup, `src/lib/assistant/` should contain ONLY:
```
src/lib/assistant/
  fastapi-client.ts    # FastAPI typed client
```

And `src/lib/utils/` should contain:
```
src/lib/utils/
  handoff.ts           # Mailto link builder for HumanHandoff component
```

And `src/data/` should contain ONLY:
```
src/data/
  accomplishments.json  # Used by src/lib/accomplishments.ts
  projects.json         # Used by src/lib/github.ts
```

### Anti-Patterns to Avoid
- **Deleting entire directories blindly:** `src/app/api/assistant/` contains both the active `chat/route.ts` AND the dead admin routes. Only delete the subdirectories `facts/`, `feedback/`, `prompt-versions/`, `reindex/` -- NOT the parent or `chat/`.
- **Deleting the entire `src/data/` directory:** `projects.json` and `accomplishments.json` are actively used by non-assistant code. Only delete the 7 assistant-specific data files.
- **Deleting `src/components/admin/` entirely:** `AdminGuard.tsx`, `RepoCard.tsx`, `TodoistBoard.tsx`, and `TodoistProjectCard.tsx` are used by the non-assistant control center pages.
- **Forgetting to move handoff.ts first:** If you bulk-delete all assistant files before moving handoff, `HumanHandoff.tsx` will have a broken import.

## Don't Hand-Roll

Not applicable for this phase -- this is a deletion/cleanup phase, not a building phase.

## Common Pitfalls

### Pitfall 1: Deleting projects.json or accomplishments.json
**What goes wrong:** Projects page and Accomplishments page break with `Module not found` errors at build time.
**Why it happens:** These files live in `src/data/` alongside the assistant knowledge base files and look like they belong to the assistant.
**How to avoid:** Verify each data file's imports before deleting. `projects.json` is imported by `src/lib/github.ts`. `accomplishments.json` is imported by `src/lib/accomplishments.ts`. Neither is assistant-specific.
**Warning signs:** Build error mentioning `@/data/projects.json` or `@/data/accomplishments.json`.

### Pitfall 2: Deleting handoff.ts without moving it first
**What goes wrong:** `HumanHandoff` component breaks -- the chat interface loses its "Talk to Dan directly" button.
**Why it happens:** `handoff.ts` currently lives in `src/lib/assistant/` and is imported by `src/components/assistant/HumanHandoff.tsx`. If you delete all files in the assistant directory, this breaks.
**How to avoid:** Move `handoff.ts` to `src/lib/utils/handoff.ts` and update the import in `HumanHandoff.tsx` BEFORE bulk-deleting assistant files.
**Warning signs:** Build error mentioning `@/lib/assistant/handoff`.

### Pitfall 3: Deleting admin pages but not their backend dependencies (or vice versa)
**What goes wrong:** If you delete the library files first but leave the admin pages, the pages will fail to build because they import the deleted libraries. If you delete the pages but leave the API routes, you have orphaned code but no build error.
**Why it happens:** The admin pages import types and functions from the assistant library. The admin API routes import functions from the assistant library. They must be deleted together.
**How to avoid:** Delete admin pages, admin API routes, admin components, and their assistant library dependencies in the same commit.
**Warning signs:** Build errors referencing `@/lib/assistant/analytics`, `@/lib/assistant/facts-store`, etc.

### Pitfall 4: Deleting the AdminGuard component
**What goes wrong:** The entire control center (including todoist pages) breaks because `control-center/layout.tsx` wraps all children in `<AdminGuard>`.
**Why it happens:** `AdminGuard.tsx` lives in `src/components/admin/` alongside the assistant-specific admin components. Easy to delete by accident.
**How to avoid:** When deleting admin components, explicitly name each file to delete. Do NOT delete the entire `src/components/admin/` directory.
**Warning signs:** Build error in `control-center/layout.tsx` referencing `AdminGuard`.

### Pitfall 5: Forgetting to remove @ai-sdk/google from package.json
**What goes wrong:** Dead dependency stays in the bundle, wastes space, potentially causes supply chain risk.
**Why it happens:** `gemini.ts` is the only file that imports `@ai-sdk/google`. After deleting `gemini.ts`, the package is unused but still listed in `package.json`.
**How to avoid:** After deleting `gemini.ts`, remove `@ai-sdk/google` from `package.json` dependencies and run `npm install`.
**Warning signs:** `npm ls @ai-sdk/google` shows the package is installed but unused.

### Pitfall 6: Leaving dead API routes accessible
**What goes wrong:** No build error, but dead endpoints remain publicly accessible at `/api/assistant/feedback`, etc.
**Why it happens:** Since these routes don't import deleted files (they import from files that will be deleted), they might be overlooked if deletion is partial.
**How to avoid:** Explicitly delete all four admin API route directories: `facts/`, `feedback/`, `prompt-versions/`, `reindex/`.
**Warning signs:** Routes still responding to HTTP requests after cleanup.

### Pitfall 7: Breaking the control center navigation
**What goes wrong:** Control center page might have links to `/control-center/assistant` that now 404.
**Why it happens:** Residual links in the control center page or navigation.
**How to avoid:** Verified: the control center main page (`src/app/control-center/page.tsx`) does NOT contain any links to the assistant admin pages. The only back-links are internal (assistant facts -> assistant analytics -> control center), which are all being deleted. Navigation links (`NavLinks.tsx`) only link to `/control-center`, not to sub-routes. No action needed.

## Code Examples

### Moving handoff.ts and updating imports

Before (current):
```typescript
// src/components/assistant/HumanHandoff.tsx
import { buildMailtoLink } from "@/lib/assistant/handoff";
```

After (updated):
```typescript
// src/components/assistant/HumanHandoff.tsx
import { buildMailtoLink } from "@/lib/utils/handoff";
```

The file itself (`handoff.ts`) requires no code changes -- only its location changes from `src/lib/assistant/handoff.ts` to `src/lib/utils/handoff.ts`.

### Removing @ai-sdk/google from package.json

Remove this line from dependencies:
```json
"@ai-sdk/google": "^3.0.21",
```

Then run:
```bash
npm install
```

### Verification commands

After all deletions:
```bash
# Must pass with zero errors
npm run build

# Verify no broken imports
npm run lint

# Verify the assistant chat still works
# (manual: visit /assistant and send a message)

# Verify control center still works
# (manual: visit /control-center)

# Verify projects page still works
# (manual: visit /projects)
```

## State of the Art

Not applicable -- this phase is about code deletion, not adopting new technology.

## Open Questions

1. **Should `useIdToken.ts` be deleted?**
   - What we know: It is only imported by `FactsEditor.tsx`, `PromptVersions.tsx`, and `ReindexButton.tsx` -- all being deleted. After deletion, it has zero importers.
   - What's unclear: Whether future admin features might need it.
   - Recommendation: Delete it. It's a simple utility (35 lines) that can be recreated if needed. Dead code should be removed.

2. **Should `src/lib/auth/admin.ts` be deleted?**
   - What we know: It is only imported by the three assistant admin API routes being deleted. After deletion, it has zero importers.
   - What's unclear: Whether future admin API routes might need it.
   - Recommendation: Keep it. It's a general-purpose admin auth utility (65 lines) that is not assistant-specific. Future admin routes will likely need it. However, deleting it is also defensible -- it can be recreated from git history if needed.

3. **Should `@ai-sdk/google` removal require `npm install`?**
   - What we know: Removing a dependency from `package.json` requires running `npm install` to update the lockfile. The lockfile is in `.gitignore` / forbidden zone per CLAUDE.md conventions.
   - Recommendation: Remove from `package.json` and run `npm install` to regenerate the lockfile. Do not commit the lockfile directly.

## Verified Dependency Graph

### Files with ZERO remaining importers after Phase 14 (confirmed dead):

| File | Was Imported By | Status |
|------|----------------|--------|
| `analytics.ts` | `control-center/assistant/page.tsx`, `AssistantAnalytics.tsx` | Both importers being deleted |
| `facts-store.ts` | `api/assistant/facts/route.ts`, `control-center/assistant/facts/page.tsx`, `FactsEditor.tsx` | All importers being deleted |
| `filters.ts` | `safety.ts` | Importer being deleted |
| `gemini.ts` | None (was used by old route.ts, already replaced) | Already dead |
| `knowledge.ts` | `prompts.ts`, `api/assistant/reindex/route.ts` | Both importers being deleted |
| `lead-capture.ts` | None | Already dead |
| `logging.ts` | `api/assistant/feedback/route.ts` | Importer being deleted |
| `prompt-versions.ts` | `api/assistant/prompt-versions/route.ts`, `control-center/assistant/facts/page.tsx`, `PromptVersions.tsx` | All importers being deleted |
| `prompts.ts` | None (was used by old route.ts, already replaced) | Already dead |
| `rate-limit.ts` | None (was used by old route.ts, already replaced) | Already dead |
| `refusals.ts` | `safety.ts` | Importer being deleted |
| `safety.ts` | None (was used by old route.ts, already replaced) | Already dead |

### Files with ACTIVE importers (must NOT delete):

| File | Active Importer |
|------|-----------------|
| `fastapi-client.ts` | `src/app/api/assistant/chat/route.ts` |
| `handoff.ts` | `src/components/assistant/HumanHandoff.tsx` (move, don't delete) |
| `projects.json` | `src/lib/github.ts` |
| `accomplishments.json` | `src/lib/accomplishments.ts` |
| `AdminGuard.tsx` | `src/app/control-center/layout.tsx` |
| `RepoCard.tsx` | `src/app/control-center/page.tsx` |
| `TodoistBoard.tsx` | Todoist pages |
| `TodoistProjectCard.tsx` | `src/app/control-center/page.tsx` |

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis via file reads and grep searches across `/Users/dweinbeck/Documents/personal-brand/src/`
- Every import chain verified by reading source files and searching for all `from` references
- All files in `src/lib/assistant/`, `src/data/`, `src/app/control-center/assistant/`, `src/app/api/assistant/`, and `src/components/admin/` read in full

### Secondary (MEDIUM confidence)
- None needed -- this is a codebase-internal analysis, not a technology research question

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack (what to delete): HIGH -- verified every import chain by reading every file
- Architecture (deletion order): HIGH -- based on verified dependency graph
- Pitfalls: HIGH -- each pitfall verified by checking actual import references
- Open questions: MEDIUM -- decisions about keeping vs. deleting general-purpose utilities are judgment calls

**Research date:** 2026-02-08
**Valid until:** Until Phase 15 is executed (static analysis of current codebase state)
