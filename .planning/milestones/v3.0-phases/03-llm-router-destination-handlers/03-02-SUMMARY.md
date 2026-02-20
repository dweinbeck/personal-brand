---
phase: 03-llm-router-destination-handlers
plan: 02
status: complete
---

## One-liner
Created GitHub destination handler with @octokit/rest for auto-creating labeled issues from captures.

## What Changed
| File | Change |
|------|--------|
| src/lib/gsd/destinations/github.ts | New file — routeToGitHub creates issues with title, body, priority/bug/gsd-capture labels |
| src/lib/env.ts | Added GSD_GITHUB_REPO env var with owner/repo format validation |
| package.json | Added @octokit/rest dependency |

## Key Decisions
- Octokit instantiated per-call (not singleton) — avoids stale tokens
- Bug vs enhancement label via keyword regex on title/summary
- gsd-capture label identifies auto-created issues
- GITHUB_PAT required at runtime (separate from read-only GITHUB_TOKEN)

## Verification
- npm run lint: 0 errors
- npm run build: 0 errors
- npm test: 227 passed
