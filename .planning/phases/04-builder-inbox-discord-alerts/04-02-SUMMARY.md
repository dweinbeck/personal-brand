---
phase: 04-builder-inbox-discord-alerts
plan: 02
status: complete
---

## One-liner
Added retry and re-route admin actions for captures in Builder Inbox detail view.

## What Changed
| File | Change |
|------|--------|
| src/app/api/admin/builder-inbox/[id]/retry/route.ts | POST — reset to processing, re-run processCapture |
| src/app/api/admin/builder-inbox/[id]/reroute/route.ts | POST — manually set destination with Zod validation |
| src/components/admin/builder-inbox/CaptureDetailPage.tsx | Action buttons — retry, route to GitHub/Tasks/Inbox |

## Verification
- npm run lint: 0 errors
- npm run build: 0 errors
- npm test: 227 passed
