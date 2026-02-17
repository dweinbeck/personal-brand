---
status: resolved
trigger: "Tasks app at tasks.dev.dan-weinbeck.com/tasks renders blank page. CSP blocks eval() in JavaScript."
created: 2026-02-16T00:00:00Z
updated: 2026-02-17T00:06:00Z
---

## Current Focus

hypothesis: CONFIRMED AND FIXED
test: Deployed to Cloud Run, verified new chunks contain the fix
expecting: Page should render properly after client-side auth resolves
next_action: User verification needed

## Symptoms

expected: Tasks app page should render with task management UI
actual: Completely blank white page - nothing renders at all
errors: Content Security Policy blocks eval() in JavaScript. script-src directive blocked.
reproduction: Navigate to https://tasks.dev.dan-weinbeck.com/tasks
started: After recent changes to allow navigating to Tasks without re-signing in

## Eliminated

- hypothesis: CSP headers set in HTTP response or meta tag
  evidence: curl -sI shows NO CSP header. HTML has no meta CSP tag. No CSP in infrastructure (Terraform/Cloud Run/LB).
  timestamp: 2026-02-16T23:50:00Z

- hypothesis: eval() or Function() in JS bundles causing CSP violation
  evidence: Checked all 10 JS chunks served by the app. Zero eval() or Function() calls in any of them. Only the noModule polyfill (not executed in modern browsers) has Function("return this").
  timestamp: 2026-02-16T23:51:00Z

- hypothesis: Infrastructure (Cloud Run, Google Frontend, LB) adding CSP
  evidence: Checked all HTTP headers from tasks app, JS chunks, CSS, and Firebase auth pages. No CSP set by any infrastructure component.
  timestamp: 2026-02-16T23:52:00Z

## Evidence

- timestamp: 2026-02-16T23:46:00Z
  checked: Tasks app server response (curl)
  found: Server returns valid HTML with "Loading..." text. RSC payload shows AuthGuard with children=null. Also shows NEXT_REDIRECT to "/" (from page component).
  implication: Server-side render works but passes null children to AuthGuard when unauthenticated

- timestamp: 2026-02-16T23:47:00Z
  checked: Tasks app code (layout.tsx, AuthGuard.tsx, AuthContext.tsx)
  found: Layout returns AuthGuard with children=null when userId is null. AuthGuard renders {children} when user is authenticated. So when client-side Firebase resolves user, AuthGuard renders null = blank.
  implication: The mismatch between server-side (no auth) and client-side (auth from IndexedDB) causes blank render.

- timestamp: 2026-02-16T23:48:00Z
  checked: Cloud Run env vars for tasks service
  found: FIREBASE_PROJECT_ID=personal-brand-dev-487114, NEXT_PUBLIC_FIREBASE_PROJECT_ID=personal-brand-486314. Admin SDK project != client project.
  implication: Admin SDK verifyIdToken() rejects tokens from the prod Firebase project. Cookie verification always fails on Cloud Run.

- timestamp: 2026-02-16T23:49:00Z
  checked: Personal-brand commit a436712
  found: Tasks card now links directly to tasks.dev.dan-weinbeck.com with sameTab:true. No intermediate landing page. No auth cookie sharing between domains.
  implication: User arrives at tasks domain without __session cookie. Server always takes AuthGuard path.

- timestamp: 2026-02-16T23:53:00Z
  checked: Cookie configuration in AuthContext
  found: Cookie set with path=/ max-age=3600 SameSite=Lax. No domain specified, so it's only for tasks.dev.dan-weinbeck.com.
  implication: Even after auth completes client-side and cookie is set, no server-side reload occurs to use the cookie.

## Resolution

root_cause: Two interconnected issues caused the blank page:
  1. **Server/client auth mismatch**: When navigating from personal-brand to tasks.dev (cross-domain), the server had no __session cookie. The layout rendered AuthGuard with children=null. Client-side Firebase resolved the user from IndexedDB, making AuthGuard render {null} -- a completely blank page.
  2. **Admin SDK project ID mismatch**: The admin SDK was initialized with the GCP project (personal-brand-dev-487114) instead of the Firebase project (personal-brand-486314), causing verifyIdToken() to reject all tokens. This meant even when the __session cookie existed, the server could never verify it, always falling back to the AuthGuard path.

fix: Applied two fixes in the tasks app (/Users/dweinbeck/ai/todoist):
  1. AuthContext now detects when client-side auth resolves without a server-side cookie and triggers window.location.reload() to let the server re-render with the newly-set cookie.
  2. Admin SDK initializeApp now passes NEXT_PUBLIC_FIREBASE_PROJECT_ID as the projectId, ensuring tokens from the correct Firebase project are accepted.

Note on CSP: No CSP is set anywhere (headers, meta, infra). The reported CSP error is likely from a browser extension or unrelated. The blank page was caused by the auth mismatch described above.

verification: Build succeeded (Cloud Build 5bdbb9ea). New chunks deployed and verified to contain the reload logic. User testing needed.
files_changed:
  - /Users/dweinbeck/ai/todoist/src/context/AuthContext.tsx
  - /Users/dweinbeck/ai/todoist/src/lib/firebase-admin.ts
