# Phase 6: Wire Reroute Destination Handlers - Research

**Researched:** 2026-02-20
**Domain:** Next.js API route wiring, Firestore capture pipeline, destination handler integration
**Confidence:** HIGH

## Summary

This phase closes a single, well-defined gap: the reroute endpoint (`/api/admin/builder-inbox/[id]/reroute/route.ts`) marks Firestore status as "routed" but never actually calls the destination handlers (`routeToGitHub` / `routeToTask`). The fix is surgical -- import and call the existing destination handlers before updating status, mirroring the pattern already proven in `router.ts::routeToDestination()`.

The entire codebase for this fix already exists. Both destination handlers (`src/lib/gsd/destinations/github.ts` and `src/lib/gsd/destinations/tasks.ts`) are production-tested through the automated pipeline. The reroute endpoint just needs to call them. There is also an opportunity to add Discord alerts for manual reroutes and proper error handling when destination execution fails.

**Primary recommendation:** Import destination handlers into the reroute endpoint, execute them based on the `destination` parameter, update Firestore with the real `destinationRef` (issue URL or task ID), and add error handling that marks the capture as `failed` if the destination handler throws.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INBOX-REROUTE | Manual re-route from detail view must actually execute destination handlers | Direct: reroute endpoint must call `routeToGitHub()` / `routeToTask()` instead of only updating Firestore status. Pattern exists in `router.ts::routeToDestination()`. |
</phase_requirements>

## Standard Stack

### Core

No new libraries needed. Everything required is already in the project.

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| @octokit/rest | (existing) | GitHub issue creation via `routeToGitHub` | Yes |
| firebase-admin | (existing) | Firestore capture status updates | Yes |
| zod | (existing) | Request validation in reroute endpoint | Yes |

### Supporting

| Library | Version | Purpose | Already Installed |
|---------|---------|---------|-------------------|
| Discord webhook (native fetch) | N/A | Alert on manual reroute via `alertCaptureRouted` | Yes (in `discord.ts`) |

### Alternatives Considered

None. This is a wiring fix, not a design decision. All components exist.

## Architecture Patterns

### Current Reroute Flow (BROKEN)

```
Admin clicks "Route to GitHub" in CaptureDetailPage
  -> POST /api/admin/builder-inbox/[id]/reroute { destination: "github_issue" }
  -> verifyAdmin()
  -> rerouteSchema.safeParse()
  -> updateCaptureStatus(id, { status: "routed", destination, destinationRef: "manual:github_issue" })
  -> Response.json({ status: "rerouted" })

  PROBLEM: No GitHub issue created. No task created. Just a Firestore flag.
```

### Target Reroute Flow (FIXED)

```
Admin clicks "Route to GitHub" in CaptureDetailPage
  -> POST /api/admin/builder-inbox/[id]/reroute { destination: "github_issue" }
  -> verifyAdmin()
  -> rerouteSchema.safeParse()
  -> getCapture(id) to load capture data
  -> IF destination == "github_issue": routeToGitHub(routingOutput) -> gets issue URL
  -> IF destination == "task": routeToTask(routingOutput) -> gets task ID
  -> IF destination == "inbox": no handler needed (just status update)
  -> updateCaptureStatus(id, { status: "routed", destination, destinationRef: real_ref })
  -> alertCaptureRouted() (fire-and-forget Discord alert)
  -> Response.json({ status: "rerouted", destinationRef: real_ref })
  -> ON ERROR: updateCaptureStatus(id, { status: "failed", error }) + alertCaptureFailed()
```

### Pattern 1: Destination Handler Dispatch (from `router.ts`)

**What:** Dynamic import + switch on destination category
**When to use:** When routing a capture to a specific destination
**Example:**

```typescript
// Source: src/lib/gsd/router.ts (lines 73-96) — proven pattern
async function routeToDestination(
  _captureId: string,
  routing: RoutingOutput,
): Promise<{ destination: string; destinationRef: string }> {
  const effectiveCategory =
    routing.confidence < CONFIDENCE_THRESHOLD || routing.category === "unknown"
      ? "inbox"
      : routing.category;

  switch (effectiveCategory) {
    case "github_issue": {
      const { routeToGitHub } = await import("./destinations/github");
      const issueUrl = await routeToGitHub(routing);
      return { destination: "github_issue", destinationRef: issueUrl };
    }
    case "task": {
      const { routeToTask } = await import("./destinations/tasks");
      const taskId = await routeToTask(routing);
      return { destination: "task", destinationRef: taskId };
    }
    default:
      return { destination: "inbox", destinationRef: "inbox" };
  }
}
```

### Pattern 2: Constructing RoutingOutput for Manual Reroutes

**What:** When an admin manually reroutes, the capture may or may not have a `routingResult` from a prior LLM classification. The handler needs a valid `RoutingOutput` to pass to destination handlers.
**When to use:** Always, in the reroute endpoint.
**Key insight:** If the capture has `routingResult` from a prior classification, use it. If not (e.g., the capture was never classified or went straight to inbox), construct a minimal `RoutingOutput` from the capture's raw transcript/context.

```typescript
// Construct RoutingOutput from capture data
function buildRoutingOutput(
  capture: CaptureData,
  destination: string,
): RoutingOutput {
  // If prior routing exists, reuse it with overridden category
  if (capture.routingResult) {
    return {
      ...capture.routingResult,
      category: destination as RoutingCategory,
    };
  }

  // Fallback: build minimal routing from raw capture data
  const transcript = capture.type === "dictation"
    ? (capture.transcript ?? "")
    : (capture.context ?? "[Screenshot capture]");

  return {
    category: destination as RoutingCategory,
    title: transcript.slice(0, 100),
    summary: transcript,
    priority: "medium",
    confidence: 1.0, // Manual = full confidence
  };
}
```

### Pattern 3: Error Handling in Async Admin Actions

**What:** If a destination handler fails (e.g., `GITHUB_PAT` not set, network error), the reroute should mark the capture as `failed` and return an error to the admin.
**When to use:** Wrapping destination handler calls.
**Key insight:** Unlike the automated pipeline (fire-and-forget), the reroute is a synchronous admin action -- the admin expects a response indicating success or failure. Return the error in the response body.

```typescript
try {
  const destinationRef = await executeDestination(destination, routingOutput);
  await updateCaptureStatus(id, { status: "routed", destination, destinationRef });
  alertCaptureRouted({ ... }); // fire-and-forget
  return Response.json({ status: "rerouted", destinationRef });
} catch (err) {
  const errorMessage = err instanceof Error ? err.message : "Unknown error";
  await updateCaptureStatus(id, { status: "failed", error: errorMessage });
  alertCaptureFailed({ ... }); // fire-and-forget
  return Response.json({ error: errorMessage }, { status: 500 });
}
```

### Anti-Patterns to Avoid

- **Fire-and-forget for admin actions:** Unlike `processCapture()` which is called fire-and-forget from capture routes, the reroute is a user-facing admin action. The admin needs to know if it succeeded or failed. Do NOT use fire-and-forget here -- await the destination handler and return the result.
- **Re-running LLM classification:** The reroute endpoint should NOT re-classify the capture. The admin already chose the destination. Just execute the handler for the chosen destination.
- **Ignoring missing `routingResult`:** A capture might reach the inbox without ever being classified (e.g., if classification itself failed). The reroute must handle this by constructing a `RoutingOutput` from raw capture data.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub issue creation | Custom GitHub API calls | `routeToGitHub()` from `destinations/github.ts` | Already handles labels, body formatting, env var validation |
| Task creation | Custom Prisma/service calls | `routeToTask()` from `destinations/tasks.ts` | Already handles effort mapping, user/project config |
| Discord alerts | Custom webhook logic | `alertCaptureRouted()` / `alertCaptureFailed()` from `discord.ts` | Already handles rate limiting, embed formatting |
| Destination dispatch logic | New switch/if chain | Adapt pattern from `router.ts::routeToDestination()` | Proven, consistent with automated pipeline |

**Key insight:** Every component needed already exists and is tested via the automated pipeline. This phase is pure wiring -- zero new libraries, zero new abstractions.

## Common Pitfalls

### Pitfall 1: Missing `routingResult` on Captures

**What goes wrong:** Admin reroutes a capture that was never classified (went straight to inbox due to early failure). The destination handler receives `undefined` for `routing.title`, `routing.summary`, etc.
**Why it happens:** `routeToGitHub` and `routeToTask` both expect a full `RoutingOutput` object with `title`, `summary`, `priority`, `confidence`. A capture that failed classification won't have `routingResult`.
**How to avoid:** Always check for `capture.routingResult`. If absent, construct a minimal `RoutingOutput` from the capture's raw `transcript`/`context` fields.
**Warning signs:** GitHub issues created with `undefined` titles, or task creation throwing on missing fields.

### Pitfall 2: Rerouting to "inbox" Doesn't Need a Handler

**What goes wrong:** Attempting to call a destination handler for `inbox` category, which doesn't have one.
**Why it happens:** The three valid destinations are `github_issue`, `task`, and `inbox`. Only the first two have actual destination handlers. `inbox` just means "stay in inbox."
**How to avoid:** For `destination === "inbox"`, just update Firestore status to `routed` with `destinationRef: "inbox"`. Skip handler execution.
**Warning signs:** Error looking for `destinations/inbox.ts` that doesn't exist.

### Pitfall 3: Not Returning `destinationRef` to the UI

**What goes wrong:** The admin clicks "Route to GitHub," the issue is created, but the UI shows `manual:github_issue` as the ref instead of the actual GitHub issue URL.
**Why it happens:** Current code hardcodes `destinationRef: "manual:${destination}"`. After wiring handlers, the ref should be the actual issue URL or task ID.
**How to avoid:** Use the return value from the destination handler (`issueUrl` or `taskId`) as the `destinationRef` in both the Firestore update and the API response.
**Warning signs:** Destination ref in UI shows `manual:` prefix instead of a link.

### Pitfall 4: Env Var Missing for Destination

**What goes wrong:** Admin routes to GitHub but `GITHUB_PAT` or `GSD_GITHUB_REPO` isn't set in the environment. The handler throws, and without proper error handling the endpoint returns a 500 with no useful message.
**Why it happens:** The destination handlers (`routeToGitHub`, `routeToTask`) throw explicit errors when env vars are missing. In the automated pipeline, `processCapture` catches these and marks the capture as `failed`. The reroute endpoint currently has no such error handling.
**How to avoid:** Wrap destination handler calls in try/catch. On failure, update capture status to `failed` with the error message, send Discord alert, and return a 500 with the error to the admin.
**Warning signs:** Unhandled promise rejection in server logs, admin sees generic "Re-route failed" with no details.

### Pitfall 5: Loading Capture That Doesn't Exist

**What goes wrong:** The reroute endpoint currently doesn't load the capture document at all -- it just blindly updates status. After this fix, it needs to load the capture (for `routingResult`), but the capture could have been deleted or the ID could be wrong.
**Why it happens:** The current endpoint only calls `updateCaptureStatus`, which will silently update a non-existent doc (Firestore `update` on missing doc throws, but it's not caught).
**How to avoid:** Call `getCapture(id)` first. If `null`, return 404.
**Warning signs:** Firestore "NOT_FOUND" errors in logs.

## Code Examples

### Current Reroute Endpoint (what needs to change)

```typescript
// Source: src/app/api/admin/builder-inbox/[id]/reroute/route.ts
// CURRENT: Only updates Firestore status — does NOT execute destination

import { z } from "zod";
import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { updateCaptureStatus } from "@/lib/gsd/capture";

const rerouteSchema = z.object({
  destination: z.enum(["github_issue", "task", "inbox"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyAdmin(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  // ... parse body ...

  // BUG: Only marks status, never calls routeToGitHub/routeToTask
  await updateCaptureStatus(id, {
    status: "routed",
    destination: parsed.data.destination,
    destinationRef: `manual:${parsed.data.destination}`,
  });

  return Response.json({ status: "rerouted", id, destination: parsed.data.destination });
}
```

### Destination Handlers (already exist, just need importing)

```typescript
// Source: src/lib/gsd/destinations/github.ts
export async function routeToGitHub(routing: RoutingOutput): Promise<string> {
  // Validates GITHUB_PAT and GSD_GITHUB_REPO env vars
  // Creates GitHub issue with labels and body
  // Returns issue.html_url
}

// Source: src/lib/gsd/destinations/tasks.ts
export async function routeToTask(routing: RoutingOutput): Promise<string> {
  // Validates GSD_TASKS_USER_ID and GSD_TASKS_PROJECT_ID env vars
  // Creates task via service layer
  // Returns task.id
}
```

### Discord Alerts (already exist, just need calling)

```typescript
// Source: src/lib/gsd/discord.ts
export function alertCaptureRouted(capture: {
  type: string;
  destination: string;
  title: string;
  confidence: number;
}): void { /* sends Discord embed */ }

export function alertCaptureFailed(capture: {
  type: string;
  error: string;
  captureId: string;
}): void { /* sends Discord embed */ }
```

### Test Pattern (from existing capture-route.test.ts)

```typescript
// Source: src/lib/gsd/__tests__/capture-route.test.ts — mock pattern
vi.mock("@/lib/auth/admin", () => ({
  verifyAdmin: vi.fn(),
  unauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/gsd/capture", () => ({
  getCapture: vi.fn(),
  updateCaptureStatus: vi.fn(),
}));

// Mock destination handlers
vi.mock("@/lib/gsd/destinations/github", () => ({
  routeToGitHub: vi.fn(),
}));

vi.mock("@/lib/gsd/destinations/tasks", () => ({
  routeToTask: vi.fn(),
}));
```

## Scope Assessment

### Files to Read (already read during research)

| File | Purpose |
|------|---------|
| `src/app/api/admin/builder-inbox/[id]/reroute/route.ts` | The broken endpoint (44 lines) |
| `src/lib/gsd/router.ts` | Reference for `routeToDestination` pattern |
| `src/lib/gsd/destinations/github.ts` | Handler to import |
| `src/lib/gsd/destinations/tasks.ts` | Handler to import |
| `src/lib/gsd/capture.ts` | `getCapture` + `updateCaptureStatus` signatures |

### Files to Modify

| File | Change |
|------|--------|
| `src/app/api/admin/builder-inbox/[id]/reroute/route.ts` | Wire destination handlers, add error handling, add Discord alerts |

### Files to Create

| File | Purpose |
|------|--------|
| `src/lib/gsd/__tests__/reroute-route.test.ts` | Unit tests for the fixed reroute endpoint |

### Estimated Size

- **Reroute endpoint:** ~60-80 lines (up from 44). Adds imports, `getCapture()` call, destination dispatch, error handling, Discord alerts.
- **Test file:** ~100-150 lines. Covers: successful reroute to GitHub, successful reroute to Tasks, reroute to Inbox (no handler), capture not found (404), destination handler failure (500), missing routingResult fallback.
- **Total LOC delta:** ~+120-180 lines across 2 files.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Reroute only marks Firestore status | Reroute executes destination handlers | This phase | Completes the manual reroute E2E flow |
| `destinationRef: "manual:github_issue"` | `destinationRef: "https://github.com/.../issues/123"` | This phase | Admin sees real issue/task links in UI |
| No error handling in reroute | Catches handler failures, marks failed, Discord alerts | This phase | Admin gets actionable error feedback |

## Open Questions

1. **Should reroute include `routingResult` in the Firestore update?**
   - What we know: The automated pipeline stores `routingResult` with the classification. For manual reroutes, the classification already exists (or doesn't). The reroute is just changing the destination.
   - What's unclear: Should the reroute update `routingResult.category` to match the new destination, or leave it as-is (showing original LLM classification)?
   - Recommendation: Leave `routingResult` as-is in Firestore. It's a historical record of the LLM classification. The `destination` field already reflects the admin's override. Updating `routingResult` would erase the audit trail of what the LLM originally recommended.

2. **Should the response be synchronous (await handler) or async (202 + fire-and-forget)?**
   - What we know: The retry endpoint uses fire-and-forget (`processCapture(id).catch(console.error)`) and returns immediately. The reroute is more targeted -- just one handler call, not full re-classification.
   - What's unclear: Could `routeToGitHub` be slow enough to cause a timeout?
   - Recommendation: Use synchronous (await). GitHub issue creation is typically <2s. Task creation is local DB. The admin expects to see the result immediately (and the UI already refetches the capture after the call). If timeouts become an issue later, it's easy to switch to async.

## Sources

### Primary (HIGH confidence)

- `src/app/api/admin/builder-inbox/[id]/reroute/route.ts` -- current broken endpoint (44 lines, fully read)
- `src/lib/gsd/router.ts` -- proven `routeToDestination` pattern (160 lines, fully read)
- `src/lib/gsd/destinations/github.ts` -- `routeToGitHub` handler (59 lines, fully read)
- `src/lib/gsd/destinations/tasks.ts` -- `routeToTask` handler (41 lines, fully read)
- `src/lib/gsd/capture.ts` -- `getCapture`, `updateCaptureStatus` (124 lines, fully read)
- `src/lib/gsd/discord.ts` -- `alertCaptureRouted`, `alertCaptureFailed` (103 lines, fully read)
- `src/lib/gsd/schemas.ts` -- `RoutingOutput`, `RoutingCategory` types (67 lines, fully read)
- `src/components/admin/builder-inbox/CaptureDetailPage.tsx` -- UI that calls reroute (359 lines, fully read)
- `src/app/api/admin/builder-inbox/[id]/retry/route.ts` -- reference for admin action pattern (19 lines, fully read)
- `.planning/v3.0-MILESTONE-AUDIT.md` -- gap identification and evidence (177 lines, fully read)

### Secondary (MEDIUM confidence)

None needed -- all source code is first-party.

### Tertiary (LOW confidence)

None.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new libraries, all existing code
- Architecture: HIGH -- pattern proven in `router.ts::routeToDestination()`, direct reuse
- Pitfalls: HIGH -- all identified from reading actual source code and data flow

**Research date:** 2026-02-20
**Valid until:** Indefinite (this is internal code analysis, not external dependency research)
