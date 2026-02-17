---
status: investigating
trigger: "auth-unauthorized-domain: User clicks sign-in button, Google OAuth popup opens briefly then closes with error: Sign-in failed: Firebase: Error (auth/unauthorized-domain)"
created: 2026-02-16T00:00:00Z
updated: 2026-02-16T00:05:00Z
---

## Current Focus

hypothesis: CONFIRMED - dev.dan-weinbeck.com is missing from Firebase Auth authorized domains list
test: Code review complete; Firebase Console change required + need to confirm which domain user is on
expecting: Adding dev.dan-weinbeck.com to Firebase Auth authorized domains will fix the issue
next_action: Return checkpoint - need user to confirm domain and add it to Firebase Console

## Symptoms

expected: Click sign-in -> Google OAuth popup opens -> user authenticates -> popup closes -> user is signed in
actual: Click sign-in -> popup opens briefly -> popup closes immediately -> error toast "Sign-in failed: Firebase: Error (auth/unauthorized-domain)"
errors: Firebase: Error (auth/unauthorized-domain)
reproduction: Click the sign-in button on the website
started: Unknown - recent commit 499086e "use dual Firebase apps to separate auth from Firestore" is suspicious

## Eliminated

- hypothesis: Recent dual Firebase apps commit (499086e) broke client-side auth
  evidence: That commit only changed server-side Admin SDK files (firebase.ts, auth/admin.ts, auth/user.ts). The client-side SDK (firebase-client.ts) and auth components (AuthButton.tsx, AuthGuard.tsx) were NOT modified. The auth/unauthorized-domain error is purely client-side.
  timestamp: 2026-02-16T00:01:00Z

- hypothesis: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN env var is misconfigured
  evidence: .env.local has NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=personal-brand-486314.firebaseapp.com, which matches the Firebase project ID (personal-brand-486314). This is correct per planning docs and Firebase convention.
  timestamp: 2026-02-16T00:02:00Z

- hypothesis: Firebase client SDK initialization code has a bug
  evidence: firebase-client.ts correctly reads apiKey, authDomain, projectId from NEXT_PUBLIC_* env vars and passes them to initializeApp(). No code changes to this file in recent commits.
  timestamp: 2026-02-16T00:02:30Z

## Evidence

- timestamp: 2026-02-16T00:01:00Z
  checked: git show 499086e (dual Firebase apps commit)
  found: Only modified server-side files (src/lib/firebase.ts, src/lib/auth/admin.ts, src/lib/auth/user.ts). Client-side firebase-client.ts untouched.
  implication: Recent commit is NOT the cause of the auth/unauthorized-domain error.

- timestamp: 2026-02-16T00:02:00Z
  checked: Client-side auth flow (AuthButton.tsx, firebase-client.ts)
  found: signInWithPopup uses getFirebaseAuth() which initializes with authDomain from NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN. Value is personal-brand-486314.firebaseapp.com.
  implication: Client SDK config is correct. Error must be about the domain the page is served from.

- timestamp: 2026-02-16T00:03:00Z
  checked: Planning docs Phase 23 (infrastructure configuration)
  found: Phase 23 summary confirms authorized domains include dan-weinbeck.com and personal-brand-pcyrow43pa-uc.a.run.app. No mention of dev.dan-weinbeck.com.
  implication: dev.dan-weinbeck.com was never added to Firebase Auth authorized domains.

- timestamp: 2026-02-16T00:03:30Z
  checked: Playwright config and previous debug sessions
  found: playwright.config.ts baseURL is https://dev.dan-weinbeck.com. Previous billing-api-failure debug session reproduction step uses https://dev.dan-weinbeck.com.
  implication: The dev environment uses dev.dan-weinbeck.com, which is a different domain from dan-weinbeck.com.

- timestamp: 2026-02-16T00:04:00Z
  checked: Full grep for "dev.dan-weinbeck" in authorized domains context
  found: Zero results - dev.dan-weinbeck.com was never discussed in the context of Firebase Auth authorized domains.
  implication: This is the root cause. The domain was simply never added.

## Resolution

root_cause: The domain dev.dan-weinbeck.com is not listed in Firebase Console -> Authentication -> Settings -> Authorized domains for the Firebase project personal-brand-486314. Only dan-weinbeck.com and the Cloud Run .run.app domain were added during Phase 23 infrastructure setup. The auth/unauthorized-domain error occurs because Firebase client SDK checks the current page's domain against the authorized domains list before allowing signInWithPopup to proceed.
fix: Add dev.dan-weinbeck.com to Firebase Console -> Authentication -> Settings -> Authorized domains. No code change required.
verification:
files_changed: []
