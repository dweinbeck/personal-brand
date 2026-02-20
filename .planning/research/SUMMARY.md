# Research Summary: v3.0 GSD Builder OS

**Domain:** Personal productivity capture system (iPhone Action Button to GitHub/Tasks/Inbox)
**Researched:** 2026-02-20
**Overall confidence:** HIGH

## Executive Summary

GSD Builder OS turns the iPhone Action Button into a universal capture device that routes dictated requests and screenshots into GitHub Issues, Tasks, or a Builder Inbox. The system is architecturally simple: two API endpoints (dictation capture + screenshot upload), an LLM-powered router, three output destinations (GitHub, Tasks, Builder Inbox), and one notification channel (Discord). The entire feature set requires only one new npm dependency (`@octokit/rest`) plus a GitHub Actions workflow YAML file.

The existing stack is remarkably well-suited for this milestone. Firebase Admin SDK already bundles Cloud Storage for screenshots. The Vercel AI SDK v6 already installed supports structured output via `Output.object()` with Zod schemas for the routing LLM. Native `fetch` handles Discord webhooks without a library. The established auth middleware patterns (`verifyUser`, `verifyAdmin`) extend naturally to a new `verifyApiKey` pattern for iPhone Shortcuts, which cannot perform OAuth flows.

The Builder Inbox admin UI fits cleanly into the existing Control Center surface at `/control-center/*`, using the same client-side fetch + Firebase ID token pattern established by the billing admin panel. Firestore is the right persistence layer for capture requests (document-oriented, flexible schema, already proven for contact submissions, billing ledger, and scrape history).

The primary risk areas are: (1) the body size limit for screenshot uploads is a global Next.js setting with no per-route override, (2) LLM routing reliability needs fallback handling when the model returns low-confidence classifications, and (3) the GitHub PAT token scope needs careful configuration to limit blast radius. All three are well-understood problems with established mitigations.

## Key Findings

**Stack:** Only 1 new npm dependency (`@octokit/rest@^22.0.1`). Cloud Storage, Discord, LLM routing, and file uploads all use existing deps or zero-dependency patterns.

**Architecture:** Two capture endpoints -> Firestore persistence -> LLM router -> destination handlers (GitHub/Tasks/Inbox) -> Discord notification. Builder Inbox UI in Control Center.

**Critical pitfall:** iPhone Shortcuts cannot perform OAuth. API key auth is the only viable mechanism, requiring secure key generation, Secret Manager storage, and rate limiting to prevent abuse.

## Implications for Roadmap

Based on research, suggested phase structure:

1. **Foundation: Capture API + Storage** - Build the two capture endpoints (dictation + screenshot) with API key auth and Cloud Storage. This is the data ingestion layer everything else depends on.
   - Addresses: API key auth middleware, multipart upload, Cloud Storage integration, Firestore capture persistence
   - Avoids: Building routing before capture works end-to-end

2. **Intelligence: LLM Router + Destinations** - Add the Gemini-powered routing that classifies captures and dispatches to GitHub Issues (via Octokit) or Tasks (via existing service layer). This phase can only start after capture data exists in Firestore.
   - Addresses: Structured output routing, GitHub issue creation, @claude comments, Tasks creation
   - Avoids: Manual routing burden; enables async processing

3. **Visibility: Discord Alerts + Builder Inbox UI** - Add notification layer and admin audit surface. These are read-side features that can be built independently once capture+routing pipeline exists.
   - Addresses: Discord webhook alerts, Builder Inbox list/detail/retry/convert UI
   - Avoids: Building admin UI before there's data to display

4. **Automation: GitHub Actions + Shortcuts Docs** - Set up Claude Code Action workflow and document the iPhone Shortcuts configuration. This is the "last mile" that connects GitHub automation and user-facing setup.
   - Addresses: `.github/workflows/claude.yml`, iPhone Shortcuts documentation
   - Avoids: Late-stage workflow configuration surprises

**Phase ordering rationale:**
- Phase 1 before Phase 2: Routing needs capture data to classify. Cannot test routing without real captures in Firestore.
- Phase 2 before Phase 3: Builder Inbox displays routed captures. Discord alerts fire after routing decisions. Both need the routing pipeline.
- Phase 4 last: GitHub Actions is a standalone YAML config. Shortcuts docs require the full API to be deployed and testable.

**Research flags for phases:**
- Phase 1: Standard patterns, unlikely to need deeper research. `request.formData()` and `firebase-admin/storage` are well-documented.
- Phase 2: LLM routing may need iteration on prompt engineering and schema design. The `Output.object()` API is straightforward but routing accuracy depends on prompt quality.
- Phase 3: Standard CRUD admin UI. Follows existing Control Center patterns.
- Phase 4: Claude Code Action v1 is stable. Shortcuts documentation is manual work, not code.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All versions verified via npm. Only 1 new dep needed. |
| Features | HIGH | Feature set is well-defined in PROJECT.md. Clear boundaries. |
| Architecture | HIGH | Extends existing patterns (auth middleware, Firestore persistence, Control Center UI). |
| Pitfalls | HIGH | Risks are well-understood (body size limits, API key security, LLM reliability). |

## Gaps to Address

- **Prompt engineering for LLM router:** The Zod schema structure is clear, but the system prompt for accurate routing will need iteration during Phase 2 implementation.
- **GitHub PAT scope:** Need to determine minimum required OAuth scopes for the PAT (likely `repo` for issue creation + comments). Document in deployment guide.
- **Firebase Storage security rules:** If using Firebase Storage (vs raw GCS), need to configure security rules. Since we're using Admin SDK (server-side only), default rules may be sufficient, but should verify.
- **Apple Shortcuts HTTP limitations:** Shortcuts supports custom headers and JSON/FormData bodies, but testing actual Shortcut configs requires a physical iPhone. Document the Shortcut steps clearly.
