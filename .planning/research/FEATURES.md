# Feature Landscape

**Domain:** Personal productivity capture system (iPhone Action Button to GitHub/Tasks/Inbox)
**Researched:** 2026-02-20

## Table Stakes

Features that make the capture system actually useful. Missing any of these and the system is not functional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Dictation capture API endpoint | Core input -- iPhone Action Button triggers dictation, needs an endpoint to receive it | Low | Single POST route with JSON body, API key auth |
| Screenshot capture API endpoint | Core input -- Share Sheet sends image to endpoint | Medium | Multipart FormData, file size validation, Cloud Storage upload |
| API key authentication | iPhone Shortcuts cannot do OAuth; must have auth mechanism | Low | Header check against env var, follows existing auth pattern |
| Firestore capture persistence | All captures must be stored before routing (audit trail, retry) | Low | Single collection, document per capture |
| LLM-based request routing | Manual routing defeats the purpose; intelligence is the value prop | Medium | Gemini 2.0 Flash + Zod schema via Output.object() |
| GitHub issue creation | Primary output destination for dev work | Low | @octokit/rest, single API call |
| @claude comment on issues | Triggers Claude Code Action for automated implementation | Low | Second Octokit API call after issue creation |
| Tasks creation | Secondary output for non-GitHub work items | Low | Direct import of existing Tasks service layer |
| Builder Inbox persistence | Captures that don't route to GitHub/Tasks need a holding area | Low | Firestore collection with status field |
| Response time < 10 seconds | iPhone Shortcuts timeout perception -- user expects fast response | Medium | Async processing: respond immediately, route in background |

## Differentiators

Features that elevate from "capture tool" to "Builder OS." Not required for basic functionality but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Builder Inbox admin UI | Audit trail, manual routing, retry failed captures | Medium | Control Center page with list/detail views, follows existing admin patterns |
| Discord webhook alerts | Async notification when captures are processed | Low | Single fetch() call to webhook URL |
| GitHub Actions Claude Code workflow | Issues get auto-implemented by Claude | Low | YAML file in .github/workflows/ |
| Routing confidence score | Show how certain the LLM is about classification | Low | Already in Zod schema as confidence float |
| Screenshot OCR/description | LLM describes screenshot content for better routing context | Medium | Could use Gemini vision capabilities |
| Retry failed routes | Builder Inbox allows re-routing captures that failed | Medium | Status machine: pending -> routed/failed -> retried |
| iPhone Shortcuts documentation | Users need step-by-step setup instructions | Low | Markdown docs with screenshots |
| Capture metadata (location, time, device) | Context for when/where ideas were captured | Low | Shortcuts can pass device metadata in request body |

## Anti-Features

Features to explicitly NOT build for v3.0.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Real-time WebSocket updates for Inbox | Single-user admin tool; SWR polling is sufficient | Use SWR with revalidation interval (existing pattern) |
| Multi-user capture support | This is a personal productivity tool, not a team product | Hard-code owner to admin user |
| Voice-to-text transcription on server | Apple handles dictation locally on iPhone. Server receives text. | Accept pre-transcribed text from Shortcuts |
| Custom LLM model training | Gemini 2.0 Flash with good prompts is sufficient | Iterate on prompt engineering, not model training |
| Mobile app for capture | iPhone Shortcuts + Action Button IS the mobile interface | Document Shortcut setup instead |
| Capture scheduling / delayed routing | Adds complexity with minimal value | Route immediately on capture |
| Multiple GitHub repo targeting per capture | Start simple -- route to a single configurable repo | Add multi-repo support later if needed |
| Batch capture processing | Captures are infrequent (< 20/day) -- no batching needed | Process each capture individually |
| Capture editing before routing | Adds friction to the capture flow | Route first, edit in GitHub/Tasks after |

## Feature Dependencies

```
API Key Auth Middleware
  |
  +-> Dictation Capture API --> Firestore Persistence --> LLM Router
  |                                                         |
  +-> Screenshot Capture API --> Cloud Storage Upload       +-> GitHub Issue Creation --> @claude Comment
       |                              |                     |
       +-> Firestore Persistence -----+                     +-> Tasks Creation
                                                            |
                                                            +-> Builder Inbox (fallback)
                                                            |
                                                            +-> Discord Alert (notification)

Builder Inbox Admin UI (reads Firestore captures collection)
GitHub Actions Claude Code (standalone YAML, triggers from @claude comments)
```

## MVP Recommendation

Prioritize in this order:

1. **API key auth + dictation capture + Firestore persistence** -- minimum viable capture path
2. **LLM routing + GitHub issue creation + @claude comment** -- primary output destination
3. **Screenshot capture + Cloud Storage** -- second input method
4. **Builder Inbox admin UI** -- audit and manual routing
5. **Discord alerts** -- notification layer (simple, can be added anytime)
6. **GitHub Actions workflow** -- standalone YAML, no code dependency

Defer:
- **Screenshot OCR/description:** Can be added later without changing the capture schema. The screenshot URL is stored; OCR can be run retroactively.
- **Multi-repo targeting:** Start with a single repo target (e.g., `personal-brand`). Add repo selection to the routing schema later.
- **Capture metadata (location/device):** Schema supports optional fields. Add to Shortcuts config when core flow is proven.

## Sources

- [PROJECT.md v3.0 feature list](/Users/dweinbeck/ai/personal-brand/.planning/PROJECT.md) -- target features
- [Apple Shortcuts HTTP request docs](https://support.apple.com/guide/shortcuts/request-your-first-api-apd58d46713f/ios) -- Shortcuts capabilities
- [AI SDK Structured Data](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) -- Output.object() for routing
- [Claude Code Action](https://github.com/anthropics/claude-code-action) -- @claude trigger automation
