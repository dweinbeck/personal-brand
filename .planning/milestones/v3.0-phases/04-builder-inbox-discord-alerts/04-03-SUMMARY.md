---
phase: 04-builder-inbox-discord-alerts
plan: 03
status: complete
---

## One-liner
Created Discord webhook utility and wired alerts into capture processing pipeline.

## What Changed
| File | Change |
|------|--------|
| src/lib/gsd/discord.ts | New file — sendDiscordAlert, alertCaptureRouted, alertCaptureFailed |
| src/lib/gsd/router.ts | Added Discord alert calls after routed/failed status updates |

## Key Decisions
- Fire-and-forget with .catch(() => {}) — never blocks processing
- 429 rate limit handled with single retry after retry-after delay
- Color-coded embeds: green for routed, red for failed
- Silently skips if DISCORD_WEBHOOK_URL not configured

## Verification
- npm run lint: 0 errors
- npm run build: 0 errors
- npm test: 227 passed
