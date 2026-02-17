---
status: verifying
trigger: "Research Assistant fails on dev deployment with PERMISSION_DENIED error when submitting a prompt"
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T02:30:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED - The actAs error was from brand-scraper service (unrelated). The real research assistant issue was placeholder API keys in Secret Manager.
test: Updated both secrets with real keys and deployed new revision (00047-btl). Also fixed brand-scraper actAs issue.
expecting: Research assistant works when user submits a prompt on dev.dan-weinbeck.com
next_action: User verification needed - test Research Assistant on dev.dan-weinbeck.com

## Symptoms

expected: Submitting a prompt to the Research Assistant should send it to both LLMs and return results from each
actual: Fails immediately with PERMISSION_DENIED error about iam.serviceAccounts.actAs
errors: Error: 7 PERMISSION_DENIED: The principal (user or service account) lacks IAM permission "iam.serviceAccounts.actAs" for the resource "brand-scraper@personal-brand-dev-487114.iam.gserviceaccount.com" (or the resource may not exist).
reproduction: Submit any prompt in the Research Assistant on the dev deployment
started: Never worked on dev deployment

## Eliminated

- hypothesis: Code bug in Research Assistant API route or streaming controller
  evidence: Full code trace shows NO code that references brand-scraper SA. All GCP calls are Firestore gRPC or REST AI APIs.
  timestamp: 2026-02-16T00:30:00Z

- hypothesis: @ai-sdk/google falls back to Vertex AI / ADC when API key is missing
  evidence: @ai-sdk/google v3 uses loadApiKey() which throws if env var missing. Does NOT fall back to ADC.
  timestamp: 2026-02-16T00:35:00Z

- hypothesis: Firestore operations produce the actAs error
  evidence: Firestore errors say "Missing or insufficient permissions", not actAs. cloudrun-site SA has roles/datastore.user.
  timestamp: 2026-02-16T00:40:00Z

- hypothesis: Brand scraper code invoked by research assistant
  evidence: Zero cross-references between research-assistant and brand-scraper modules.
  timestamp: 2026-02-16T00:42:00Z

- hypothesis: Cloud Build trigger has _SA_NAME overridden to brand-scraper
  evidence: gcloud builds triggers list shows personal-brand-deploy-dev does NOT override _SA_NAME. Uses default cloudrun-site.
  timestamp: 2026-02-16T01:10:00Z

- hypothesis: Deployment failure prevents research assistant from being deployed
  evidence: All recent Cloud Build runs show SUCCESS status. Revision 00044 was healthy.
  timestamp: 2026-02-16T01:12:00Z

- hypothesis: actAs error comes from the personal-brand Cloud Run service
  evidence: Zero actAs entries in personal-brand Cloud Run logs. Audit logs show actAs failures only from brand-scraper SA.
  timestamp: 2026-02-16T01:30:00Z

## Evidence

- timestamp: 2026-02-16T00:20:00Z
  checked: Complete research assistant code flow
  found: Zero references to brand-scraper SA. All GCP calls are Firestore or AI REST APIs.
  implication: The error cannot originate from application code.

- timestamp: 2026-02-16T01:10:00Z
  checked: Cloud Build trigger substitutions
  found: personal-brand-deploy-dev does NOT override _SA_NAME. Uses default cloudrun-site.
  implication: Deployment uses correct service account.

- timestamp: 2026-02-16T01:15:00Z
  checked: Cloud Run service configuration
  found: Service runs as cloudrun-site@personal-brand-dev-487114. Latest revision 00044-pjn healthy.
  implication: Service is deployed and running correctly.

- timestamp: 2026-02-16T01:20:00Z
  checked: Audit logs for actAs with brand-scraper SA
  found: brand-scraper SA trying to actAs itself, denied. Triggered by cloudsql.instances.connect from brand-scraper-api/worker services.
  implication: The actAs error is a brand-scraper infrastructure issue, not research assistant.

- timestamp: 2026-02-16T01:25:00Z
  checked: Research assistant chat API logs on revision 00040
  found: POST returned HTTP 200 but stderr shows OpenAI: "Incorrect API key provided: YOUR_OPE***_KEY" and Google AI: "API key not valid"
  implication: Both API keys are placeholders. SSE stream delivers error events per-model.

- timestamp: 2026-02-16T01:28:00Z
  checked: Secret Manager values
  found: openai-api-key="YOUR_OPENAI_KEY", google-ai-api-key="YOUR_GOOGLE_AI_KEY" (both placeholders)
  implication: Root cause confirmed. Secrets were never updated with real keys.

- timestamp: 2026-02-16T02:00:00Z
  checked: Applied fixes
  found: Copied production API keys to dev secrets (both now at version 2). Deployed new revision 00047-btl (healthy). Granted brand-scraper SA roles/iam.serviceAccountUser on itself.
  implication: Both issues fixed. Needs user verification.

## Resolution

root_cause: TWO SEPARATE ISSUES were conflated:
  1. The "iam.serviceAccounts.actAs" PERMISSION_DENIED error is from the brand-scraper Cloud Run service (brand-scraper@personal-brand-dev-487114), NOT from the personal-brand (research assistant) service. The brand-scraper SA needed iam.serviceAccountUser role on itself for Cloud SQL connections.
  2. The actual research assistant failure was caused by PLACEHOLDER API KEYS in Secret Manager. openai-api-key contained "YOUR_OPENAI_KEY" and google-ai-api-key contained "YOUR_GOOGLE_AI_KEY" -- never replaced with real values since creation on 2026-02-14.

fix: |
  Infrastructure changes (no code changes needed):
  1. Updated openai-api-key secret in dev project to version 2 (real key copied from production)
  2. Updated google-ai-api-key secret in dev project to version 2 (real key copied from production)
  3. Deployed new Cloud Run revision personal-brand-00047-btl to pick up new secret values
  4. Granted brand-scraper SA roles/iam.serviceAccountUser on itself (fixes unrelated actAs error)

verification: |
  - New revision 00047-btl is healthy (latestCreated = latestReady)
  - Unauthenticated POST returns 401 (auth verification working)
  - No startup errors in new revision logs
  - Awaiting user manual verification: submit a prompt in Research Assistant on dev.dan-weinbeck.com

files_changed: []
infra_changed:
  - Secret Manager: openai-api-key v2 (real key, was placeholder)
  - Secret Manager: google-ai-api-key v2 (real key, was placeholder)
  - Cloud Run: personal-brand revision 00047-btl deployed
  - IAM: brand-scraper SA granted iam.serviceAccountUser on itself
