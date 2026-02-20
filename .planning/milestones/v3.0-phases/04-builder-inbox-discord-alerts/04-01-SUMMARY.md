---
phase: 04-builder-inbox-discord-alerts
plan: 01
status: complete
---

## One-liner
Created Builder Inbox admin UI with status filter tabs, captures table, and detail view in Control Center.

## What Changed
| File | Change |
|------|--------|
| src/app/api/admin/builder-inbox/route.ts | GET endpoint — list captures with status filter, counts |
| src/app/api/admin/builder-inbox/[id]/route.ts | GET endpoint — single capture detail |
| src/components/admin/builder-inbox/BuilderInboxPage.tsx | Client component — filter tabs, captures table, relative time |
| src/components/admin/builder-inbox/CaptureDetailPage.tsx | Client component — full capture detail with routing decision |
| src/app/control-center/builder-inbox/page.tsx | Page wrapper for list |
| src/app/control-center/builder-inbox/[id]/page.tsx | Page wrapper for detail |
| src/components/admin/ControlCenterNav.tsx | Added Builder Inbox nav link |

## Verification
- npm run lint: 0 errors
- npm run build: 0 errors
- npm test: 227 passed
