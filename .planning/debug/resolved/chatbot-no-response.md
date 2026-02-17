---
status: resolved
trigger: "Chatbot at dev.dan-weinbeck.com/api/assistant/chat does not return messages. User sees an error message in the UI when sending a message."
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T22:32:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED
test: curl to dev.dan-weinbeck.com/api/assistant/chat after env var update
expecting: Streamed UIMessage response with HTTP 200
next_action: Archive session

## Symptoms

expected: When user sends a message in the chatbot widget, they should receive an AI-generated response streamed back to the UI.
actual: An error message is shown in the chat UI instead of a response. No messages come back.
errors: FastAPI returned 404 (from Next.js proxy error mapping)
reproduction: Send any message via the chatbot widget on dev.dan-weinbeck.com. Also reproducible via curl.
started: Unknown when it last worked. Unclear if it ever worked on dev environment.

## Eliminated

- hypothesis: FastAPI backend service is down or broken
  evidence: Direct call to chat.dev.dan-weinbeck.com/chat with API key returns HTTP 200 with valid JSON response
  timestamp: 2026-02-16T22:28:00Z

- hypothesis: Client-side code (ChatInterface) has wrong API call pattern
  evidence: Client code correctly uses useChat with DefaultChatTransport pointing to /api/assistant/chat. The request reaches the Next.js API route handler successfully.
  timestamp: 2026-02-16T22:25:00Z

- hypothesis: Schema validation rejects the request
  evidence: The 404 error comes from the FastAPI call, not from request validation. chatRequestSchema.safeParse works fine.
  timestamp: 2026-02-16T22:25:00Z

- hypothesis: Missing CHATBOT_API_KEY causing auth failure
  evidence: The error is 404 not 401. The API key IS configured as a secret mount. The 404 happens because traffic goes to wrong URL entirely.
  timestamp: 2026-02-16T22:28:00Z

## Evidence

- timestamp: 2026-02-16T22:22:00Z
  checked: curl to dev.dan-weinbeck.com/api/assistant/chat
  found: Returns {"error":"FastAPI returned 404"} with HTTP 404
  implication: Next.js route handler works but the downstream FastAPI call fails with 404

- timestamp: 2026-02-16T22:23:00Z
  checked: Cloud Run env vars for personal-brand service
  found: CHATBOT_API_URL=https://dev.dan-weinbeck.com/assistant-api
  implication: The code appends /chat making full URL https://dev.dan-weinbeck.com/assistant-api/chat

- timestamp: 2026-02-16T22:24:00Z
  checked: Load balancer URL map (dev-lb-https-url-map)
  found: dev.dan-weinbeck.com routes to default backend (personal-brand site). chat.dev.dan-weinbeck.com routes to assistant-api backend. NO path-based /assistant-api/* rules exist.
  implication: https://dev.dan-weinbeck.com/assistant-api/chat hits the Next.js site's 404 page, not the chatbot service

- timestamp: 2026-02-16T22:26:00Z
  checked: chatbot-assistant Cloud Run ingress setting
  found: ingress=internal-and-cloud-load-balancing (not publicly accessible via direct URL)
  implication: Must use load balancer subdomain, cannot use direct Cloud Run URL

- timestamp: 2026-02-16T22:27:00Z
  checked: curl to https://chat.dev.dan-weinbeck.com/chat without API key
  found: Returns {"detail":"Invalid or missing API key"} HTTP 401
  implication: Correct subdomain reaches the actual FastAPI service

- timestamp: 2026-02-16T22:28:00Z
  checked: curl to https://chat.dev.dan-weinbeck.com/chat WITH API key
  found: Returns {"answer":"No repositories have been indexed yet...","citations":[],"confidence":"low"} HTTP 200
  implication: Full pipeline works when using correct subdomain URL with API key

- timestamp: 2026-02-16T22:31:00Z
  checked: curl to dev.dan-weinbeck.com/api/assistant/chat AFTER fix
  found: Returns streamed UIMessage response (start, text-start, text-delta, text-end, finish, [DONE]) with HTTP 200
  implication: Fix verified - full request chain now works end to end

- timestamp: 2026-02-16T22:32:00Z
  checked: Cloud Build trigger personal-brand-deploy-dev substitutions
  found: _CHATBOT_API_URL already set to https://chat.dev.dan-weinbeck.com
  implication: Future automated deploys will use the correct URL; the bad value was a stale manual override

## Resolution

root_cause: CHATBOT_API_URL environment variable on the dev Cloud Run service was set to https://dev.dan-weinbeck.com/assistant-api (path-based routing assumption) but the load balancer uses subdomain-based routing. The correct URL is https://chat.dev.dan-weinbeck.com. The code in fastapi-client.ts appends /chat to CHATBOT_API_URL, so the request to https://dev.dan-weinbeck.com/assistant-api/chat was hitting the personal-brand Next.js site's own 404 page instead of the chatbot FastAPI service.
fix: Updated CHATBOT_API_URL on Cloud Run dev service from https://dev.dan-weinbeck.com/assistant-api to https://chat.dev.dan-weinbeck.com via gcloud run services update. No code changes needed. Cloud Build trigger already had the correct value.
verification: curl to dev.dan-weinbeck.com/api/assistant/chat returns streamed UIMessage with HTTP 200 (was returning {"error":"FastAPI returned 404"} HTTP 404 before fix)
files_changed: [Cloud Run env var only - no code changes]
