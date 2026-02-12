---
phase: 33-multi-user-auth
plan: 01
subsystem: auth
tags: [firebase, firebase-auth, google-sign-in, cookie-sync, firebase-admin]

# Dependency graph
requires: []
provides:
  - "Firebase client SDK initialization (getFirebaseAuth singleton)"
  - "Firebase Admin SDK initialization (side-effect import)"
  - "Server-side auth functions (verifyUser, getUserIdFromCookie)"
  - "AuthContext with onIdTokenChanged cookie sync"
  - "AuthGuard sign-in gate component"
  - "Root layout AuthProvider wrapper"
affects: [33-02, 33-03, 34-billing-integration]

# Tech tracking
tech-stack:
  added: [firebase@12.9.0, firebase-admin@13.6.1, server-only@0.0.1]
  patterns: [singleton-firebase-init, cookie-token-sync, auth-context-provider]

key-files:
  created:
    - src/lib/firebase-client.ts
    - src/lib/firebase-admin.ts
    - src/lib/auth.ts
    - src/context/AuthContext.tsx
    - src/components/auth/AuthGuard.tsx
  modified:
    - src/app/layout.tsx
    - package.json

key-decisions:
  - "Use onIdTokenChanged (not onAuthStateChanged) for automatic cookie refresh on token rotation"
  - "Cookie name __session matches Cloud Run convention for single-cookie passthrough"
  - "Server-side auth.ts uses server-only package to prevent client import"

patterns-established:
  - "Firebase client singleton: getFirebaseAuth() with lazy initialization"
  - "Firebase Admin side-effect import: import './firebase-admin' for initialization"
  - "Cookie sync: onIdTokenChanged writes __session cookie, server reads via next/headers"
  - "Auth guard pattern: useAuth() hook + AuthGuard component wrapping protected content"

# Metrics
duration: 4min
completed: 2026-02-11
---

# Phase 33 Plan 01: Auth Foundation Summary

**Firebase Auth with Google Sign-In, onIdTokenChanged cookie sync, and server-side token verification using firebase-admin**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-12T04:39:36Z
- **Completed:** 2026-02-12T04:43:39Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Firebase client and admin SDKs installed and initialized with singleton patterns
- AuthContext provides user state and syncs ID token to __session cookie via onIdTokenChanged
- AuthGuard shows Google Sign-In UI for unauthenticated users, loading state during init
- Server-side auth.ts can verify tokens and read userId from cookies
- Root layout wraps all pages with AuthProvider

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Firebase dependencies and create auth library files** - `57fe4cd` (feat)
2. **Task 2: Create AuthContext, AuthGuard, and wire into root layout** - `7cb8a41` (feat)

## Files Created/Modified
- `src/lib/firebase-client.ts` - Client-side Firebase App/Auth singleton initialization
- `src/lib/firebase-admin.ts` - Server-side Admin SDK with ADC/cert credential handling
- `src/lib/auth.ts` - verifyUser() and getUserIdFromCookie() server functions (server-only)
- `src/context/AuthContext.tsx` - AuthProvider with onIdTokenChanged cookie sync
- `src/components/auth/AuthGuard.tsx` - Sign-in gate with Google popup authentication
- `src/app/layout.tsx` - Root layout wrapping children with AuthProvider
- `package.json` - Added firebase, firebase-admin, server-only dependencies

## Decisions Made
- Used `onIdTokenChanged` instead of `onAuthStateChanged` to ensure cookie refreshes when tokens rotate (every ~1 hour)
- Cookie named `__session` per Cloud Run convention (only cookie passed through to Cloud Run services)
- Added `server-only` package to `auth.ts` to prevent accidental client-side import of server auth functions
- Biome `noDocumentCookie` warnings suppressed as warnings (not errors) since Cookie Store API not used for Firebase auth cookie sync pattern

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- Pre-existing `next build` failure due to Prisma static generation trying to connect to database during build (not related to auth changes). TypeScript compilation (`tsc --noEmit`) and lint pass cleanly.

## User Setup Required

Firebase Auth requires manual configuration before the sign-in flow will work:

**Environment Variables** (add to `.env.local` in todoist repo):
- `NEXT_PUBLIC_FIREBASE_API_KEY` - Firebase Console -> Project Settings -> General -> Web app config
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` - Firebase Console -> Project Settings -> General -> Web app config
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID` - Firebase Console -> Project Settings -> General -> Web app config
- `FIREBASE_PROJECT_ID` - Same value as NEXT_PUBLIC_FIREBASE_PROJECT_ID
- `FIREBASE_CLIENT_EMAIL` - Firebase Console -> Project Settings -> Service accounts -> client_email
- `FIREBASE_PRIVATE_KEY` - Firebase Console -> Project Settings -> Service accounts -> Generate new private key

**Dashboard Configuration:**
- Enable Google Sign-In provider: Firebase Console -> Authentication -> Sign-in method -> Google -> Enable
- Add localhost to authorized domains: Firebase Console -> Authentication -> Settings -> Authorized domains

## Next Phase Readiness
- Auth foundation complete: AuthContext, AuthGuard, server-side verification all wired up
- Plan 02 can now add userId to Prisma models and audit queries to be user-scoped
- Plan 03 can integrate AuthGuard into the tasks layout for protected routes

## Self-Check: PASSED

- All 5 created files exist in todoist repo
- Both task commits verified (57fe4cd, 7cb8a41)
- SUMMARY.md exists in personal-brand planning directory

---
*Phase: 33-multi-user-auth*
*Completed: 2026-02-11*
