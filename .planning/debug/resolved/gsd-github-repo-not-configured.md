---
status: resolved
trigger: "Dictation shows in Builder Inbox but routing to GitHub fails with GSD_GITHUB_REPO not configured"
created: 2026-02-21T12:00:00Z
updated: 2026-02-21T12:02:00Z
---

## Current Focus

hypothesis: CONFIRMED - GSD_GITHUB_REPO env var was missing from .env.local and cloudbuild.yaml
test: Added var to both files, verified build still passes
expecting: GitHub routing will now work locally; Cloud Run needs secret created in Secret Manager
next_action: Archive session, user must create secret in GCP Secret Manager for dev and prod

## Symptoms

expected: Dictation should be routable to GitHub Issues from the Builder Inbox
actual: Dictation content appears in Builder Inbox, but routing to GitHub fails with "GSD_GITHUB_REPO not configured"
errors: "GSD_GITHUB_REPO not configured. Set to 'owner/repo' format."
reproduction: Open latest dictation in control center Builder Inbox, attempt to route to GitHub
started: Latest dictation - user noticed just now

## Eliminated

## Evidence

- timestamp: 2026-02-21T12:00:30Z
  checked: .env.local for GSD_GITHUB_REPO
  found: Variable is completely absent from .env.local. GITHUB_TOKEN exists (line 19) but no GSD_* vars at all.
  implication: The env var was never provisioned locally despite being defined in env.ts and .env.local.example

- timestamp: 2026-02-21T12:00:40Z
  checked: cloudbuild.yaml for GSD_GITHUB_REPO
  found: Not in --set-secrets or --set-env-vars. Other GSD vars (GSD_API_KEY, GSD_TASKS_USER_ID) ARE in --set-secrets but GSD_GITHUB_REPO was missed.
  implication: Even deployed environments (dev/prod) would fail the same way

- timestamp: 2026-02-21T12:00:50Z
  checked: src/lib/gsd/destinations/github.ts lines 17-21
  found: serverEnv().GSD_GITHUB_REPO is read and throws if falsy. The env.ts schema marks it as optional (line 221), so schema validation passes even when empty, but the runtime check in github.ts throws.
  implication: Error path is correct and expected -- the var simply needs to be provisioned

- timestamp: 2026-02-21T12:00:55Z
  checked: git remote -v
  found: origin is https://github.com/dweinbeck/personal-brand - this is the correct owner/repo value
  implication: GSD_GITHUB_REPO should be set to "dweinbeck/personal-brand"

- timestamp: 2026-02-21T12:01:30Z
  checked: Build after changes
  found: npm run build succeeds with no regressions
  implication: Changes are safe to deploy

## Resolution

root_cause: GSD_GITHUB_REPO env var was never added to .env.local (local dev) or cloudbuild.yaml (Cloud Run). The var is defined in env.ts schema and .env.local.example but was never actually provisioned. When the GitHub destination handler in github.ts calls serverEnv().GSD_GITHUB_REPO, it gets undefined (because the schema marks it optional, so validation passes), then the runtime null check throws "GSD_GITHUB_REPO not configured."
fix: (1) Added GSD_GITHUB_REPO=dweinbeck/personal-brand to .env.local; (2) Added GSD_GITHUB_REPO=gsd-github-repo:latest to cloudbuild.yaml --set-secrets
verification: Build passes. Local env var now set. User must create gsd-github-repo secret in GCP Secret Manager for both dev and prod environments, then restart local dev server to pick up the .env.local change.
files_changed:
  - .env.local (added GSD_GITHUB_REPO=dweinbeck/personal-brand)
  - cloudbuild.yaml (added GSD_GITHUB_REPO=gsd-github-repo:latest to --set-secrets)
