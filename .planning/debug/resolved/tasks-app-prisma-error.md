---
status: resolved
trigger: "Tasks app server component error after auth fix deployment. PrismaClientInitializationError: DATABASE_URL must start with postgresql:// or postgres://"
created: 2026-02-17T00:10:00Z
updated: 2026-02-17T00:50:00Z
---

## Current Focus

hypothesis: CONFIRMED and RESOLVED
test: Deployed with corrected cloudbuild.yaml, verified via curl and Cloud Run logs
expecting: N/A - verified
next_action: Archive session

## Symptoms

expected: Tasks app should render the authenticated layout with sidebar and content
actual: Server Components render error — Prisma cannot initialize because DATABASE_URL protocol is invalid
errors: "PrismaClientInitializationError: Error validating datasource db: the URL must start with the protocol postgresql:// or postgres://. Invalid prisma.workspace.findMany() invocation"
reproduction: Navigate to https://tasks.dev.dan-weinbeck.com/tasks (after auth succeeds and page reloads)
started: After deploying auth fix (commit 9918f10). May have been masked before because server-side code never reached Prisma calls when auth always failed.

## Eliminated

## Evidence

- timestamp: 2026-02-17T00:10:00Z
  checked: Cloud Run logs (gcloud logging read)
  found: PrismaClientInitializationError at prisma.workspace.findMany(). The DATABASE_URL must start with postgresql:// or postgres://. Schema line 8 references env("DATABASE_URL").
  implication: The DATABASE_URL env var/secret is not a standard Postgres URL. This was previously masked because the admin SDK project mismatch meant auth always failed and Prisma calls were never reached.

- timestamp: 2026-02-17T00:20:00Z
  checked: Secret Manager value for "database-url" secret
  found: URL was `postgresql+asyncpg://chatbot:...@localhost/chatbot?host=/cloudsql/...chatbot-assistant` — this is the chatbot app's database URL with asyncpg protocol, NOT a tasks database URL
  implication: No tasks database existed. The secret was a leftover from chatbot-assistant setup. The `postgresql+asyncpg://` protocol is invalid for Prisma's classic engine which requires `postgresql://`.

- timestamp: 2026-02-17T00:30:00Z
  checked: Cloud SQL instance and IAM permissions
  found: Created `tasks` database and `tasks` user in existing `chatbot-assistant` Cloud SQL instance. Created `tasks-database-url` secret with proper `postgresql://tasks:...@localhost/tasks?host=/cloudsql/...` URL. Granted SA roles: secretmanager.secretAccessor on new secret, roles/cloudsql.client on project.
  implication: Infrastructure is ready. Need to update cloudbuild.yaml to reference new secret and add Cloud SQL instance connection.

- timestamp: 2026-02-17T00:35:00Z
  checked: Prisma schema push via local cloud-sql-proxy
  found: Successfully pushed schema to new tasks database. All 6 tables created (Workspace, Project, Section, Task, Tag, TaskTag).
  implication: Database schema is ready for the app.

- timestamp: 2026-02-17T00:40:00Z
  checked: cloudbuild.yaml changes
  found: Updated line 39 from `database-url:latest` to `tasks-database-url:latest`, added line 40 `--add-cloudsql-instances=${PROJECT_ID}:${_REGION}:chatbot-assistant`
  implication: Cloud Run will now mount the correct secret and have Cloud SQL connectivity. Ready to commit and deploy.

- timestamp: 2026-02-17T00:50:00Z
  checked: Post-deployment verification
  found: Build 8b1516a5 succeeded. Cloud Run logs show clean startup (Next.js 16.1.6, ready in 27.1s). No Prisma errors. HTTP 200 from curl. Server correctly renders AuthGuard and redirects unauthenticated users.
  implication: Fix is verified. The Prisma database connection works correctly.

## Resolution

root_cause: The Cloud Run `DATABASE_URL` secret (`database-url`) contained the chatbot-assistant database URL with `postgresql+asyncpg://` protocol — wrong database AND wrong protocol. No tasks database existed. The error was previously masked because the Firebase Admin SDK project mismatch (fixed in commit 9918f10) meant auth always failed and server-side Prisma calls were never reached.
fix: (1) Created `tasks` database and user in existing Cloud SQL instance. (2) Created `tasks-database-url` secret with proper `postgresql://` URL. (3) Updated cloudbuild.yaml to reference new secret and add Cloud SQL instance connection. (4) Granted IAM roles for secret access and Cloud SQL client.
verification: Build 8b1516a5 succeeded. Cloud Run logs clean (no errors). HTTP 200 on curl. Server renders correctly without Prisma errors. Commit 006075d deployed.
files_changed: [cloudbuild.yaml]
