---
phase: 04-contact
plan: 01
subsystem: api
tags: [zod, firebase-admin, firestore, server-actions, react-19, useActionState, rate-limiting, honeypot]

# Dependency graph
requires:
  - phase: 01-scaffold
    provides: Next.js 16 app structure, Biome linting, Tailwind CSS
provides:
  - Zod contact form validation schema
  - Firebase Admin singleton with Firestore write function
  - Server Action with honeypot, rate limiting, Zod validation, Firestore persistence
  - ContactForm client component with useActionState
  - SubmitButton with useFormStatus pending state
affects: [04-contact plan 02 (page integration)]

# Tech tracking
tech-stack:
  added: [zod@4.3.6, firebase-admin@13.6.0]
  patterns: [Server Action with useActionState, in-memory rate limiting, honeypot spam protection, Firebase Admin singleton]

key-files:
  created:
    - src/lib/schemas/contact.ts
    - src/lib/firebase.ts
    - src/lib/actions/contact.ts
    - src/components/contact/SubmitButton.tsx
    - src/components/contact/ContactForm.tsx
  modified:
    - package.json

key-decisions:
  - "Zod v4 used (latest); safeParse + flatten API compatible"
  - "Firebase Admin gracefully handles missing env vars at import time; throws at write time"
  - "In-memory rate limiting (3 per 15 min per IP) - simple, sufficient for single-server deployment"
  - "Honeypot uses plausible name 'company_website' with aria-hidden and tabIndex=-1"
  - "Used <output> element instead of <div role='status'> per Biome useSemanticElements rule"

patterns-established:
  - "Server Action pattern: 'use server' directive, accepts (prevState, formData), returns typed state"
  - "Form validation pattern: Zod safeParse -> flatten().fieldErrors -> field-level error display"
  - "Spam protection pattern: honeypot check -> rate limit -> validation -> persistence"
  - "Firebase Admin pattern: conditional init with env var check, singleton via getApps()"

# Metrics
duration: 3min
completed: 2026-02-02
---

# Phase 4 Plan 1: Contact Form Core Summary

**Contact form with Zod validation, honeypot + rate limiting spam protection, and Firestore persistence via Server Action**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-03T01:52:47Z
- **Completed:** 2026-02-03T01:56:00Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Zod schema validates name, email, and message with clear error messages
- Firebase Admin singleton handles missing env vars gracefully (warns at import, throws at write)
- Server Action enforces honeypot -> rate limit -> Zod validation -> Firestore write pipeline
- ContactForm renders field-level errors and success state via useActionState
- SubmitButton shows pending state via useFormStatus

## Task Commits

Each task was committed atomically:

1. **Task 1: Install dependencies and create validation schema + Firebase layer** - `2220364` (feat)
2. **Task 2: Create Server Action with spam protection and ContactForm component** - `9dc4caa` (feat)

## Files Created/Modified
- `src/lib/schemas/contact.ts` - Zod schema with name/email/message validation, exports ContactFormData type
- `src/lib/firebase.ts` - Firebase Admin singleton, exports db and saveContactSubmission
- `src/lib/actions/contact.ts` - Server Action with honeypot, rate limiting, Zod validation, Firestore write
- `src/components/contact/SubmitButton.tsx` - Submit button with useFormStatus pending state
- `src/components/contact/ContactForm.tsx` - Client form with useActionState, field-level errors, success message
- `package.json` - Added zod and firebase-admin dependencies

## Decisions Made
- Used Zod v4 (4.3.6) which ships with the same safeParse/flatten API as v3
- Firebase Admin conditionally initializes: no crash if env vars missing, just a warning
- In-memory rate limiting chosen over persistent store (adequate for single-server personal site)
- Used `<output>` semantic element for success message per Biome's useSemanticElements lint rule

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Used `<output>` instead of `<div role="status">` for success message**
- **Found during:** Task 2 (ContactForm component)
- **Issue:** Biome's useSemanticElements rule flagged `<div role="status">` as it should use `<output>` element
- **Fix:** Changed to `<output className="block ...">` semantic element
- **Files modified:** src/components/contact/ContactForm.tsx
- **Verification:** `npx biome check` passes with no errors
- **Committed in:** 9dc4caa (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor HTML element change for Biome compliance. No scope creep.

## Issues Encountered
None.

## User Setup Required
Firebase requires environment variables to be configured for Firestore writes to work:
- `FIREBASE_PROJECT_ID` - Firebase project ID
- `FIREBASE_CLIENT_EMAIL` - Service account email
- `FIREBASE_PRIVATE_KEY` - Service account private key (with literal \n for newlines)

The app will start without these but contact form submissions will fail with a user-friendly error message.

## Next Phase Readiness
- ContactForm component is ready to be integrated into the contact page (04-02)
- Firebase env vars needed for production but form renders and validates without them
- All exports match the contract specified in the plan's must_haves artifacts

---
*Phase: 04-contact*
*Completed: 2026-02-02*
