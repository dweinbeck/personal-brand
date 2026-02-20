---
phase: 03-llm-router-destination-handlers
plan: 01
status: complete
---

## One-liner
Created LLM routing pipeline with Gemini 2.0 Flash classification, confidence thresholding, and async processing orchestration.

## What Changed
| File | Change |
|------|--------|
| src/lib/gsd/schemas.ts | Added routingOutputSchema, routingCategorySchema with category/title/summary/priority/confidence fields |
| src/lib/gsd/capture.ts | Added getCapture() helper for reading back capture documents |
| src/lib/gsd/router.ts | New file — classifyCapture (LLM), processCapture (pipeline), routeToDestination (dispatcher) |
| src/app/api/gsd/capture/route.ts | Wired processCapture fire-and-forget call after save |
| src/app/api/gsd/capture/screenshot/route.ts | Wired processCapture fire-and-forget call after save |

## Key Decisions
- generateText + Output.object (AI SDK v6 pattern, not deprecated generateObject)
- Confidence threshold 0.7 — below routes to inbox
- Dynamic import() for destination handlers — avoids loading deps when unused
- Fire-and-forget preserves <5s response time for iPhone Shortcuts

## Verification
- npm run lint: 0 errors
- npm run build: 0 errors
- npm test: 227 passed
