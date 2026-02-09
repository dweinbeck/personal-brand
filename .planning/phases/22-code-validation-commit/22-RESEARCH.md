# Phase 22: Code Validation & Commit - Research

**Researched:** 2026-02-09
**Domain:** Code validation, git hygiene, quality gates
**Confidence:** HIGH

## Summary

This phase validates existing billing code (~2,810 LOC across 29 source files) that already exists as untracked/modified files in the working tree, then commits it to master. Research focused on running the three quality gates (`npm run build`, `npm run lint`, `npm test`) and inventorying every file that needs to be staged.

All three quality gates pass RIGHT NOW with no code changes needed. The build succeeds, Biome reports zero errors across 145 files, and all tests pass. However, there is one critical discrepancy: the roadmap specifies "41 existing test cases" but only 26 tests exist (16 in types.test.ts + 10 in credits.test.ts). The REQUIREMENTS.md and ROADMAP.md need to be corrected to say 26.

There are two gitignore issues that must be resolved before committing: (1) `src/node_modules/` is a Vitest cache directory that is NOT covered by the `.gitignore` pattern `/node_modules` (which only matches root), and (2) `repo.zip` (8.8MB) is an untracked artifact that must not be committed.

**Primary recommendation:** Fix `.gitignore` to exclude `src/node_modules/` and `repo.zip`, correct the test count in planning docs from 41 to 26, then stage all 29 new files + 9 modified files and commit.

## Standard Stack

Not applicable for this phase -- no new libraries are being introduced. The existing code uses:

### Core (already in package.json)
| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| stripe | ^20.3.1 | Stripe SDK for payments | New dependency (added to package.json) |
| vitest | ^3.2.4 | Test runner | New devDependency (added to package.json) |

### Tooling
| Tool | Version | Purpose |
|------|---------|---------|
| Biome | v2.3 | Linting via `npm run lint` / `biome check` |
| Next.js | 16 | Build via `npm run build` |
| TypeScript | ^5 | Type checking (during build) |
| Vitest | ^3.2.4 | Testing via `npm test` / `vitest run` |

## Architecture Patterns

### File Inventory -- New Untracked Files (29 files, 2,810 LOC)

```
src/
├── app/
│   ├── api/
│   │   ├── admin/billing/
│   │   │   ├── pricing/route.ts              (44 LOC)
│   │   │   ├── usage/[usageId]/refund/route.ts (37 LOC)
│   │   │   ├── users/route.ts                (15 LOC)
│   │   │   ├── users/[uid]/route.ts          (41 LOC)
│   │   │   └── users/[uid]/adjust/route.ts   (42 LOC)
│   │   ├── billing/
│   │   │   ├── checkout/route.ts             (43 LOC)
│   │   │   ├── me/route.ts                   (18 LOC)
│   │   │   └── webhook/route.ts              (63 LOC)
│   │   └── tools/
│   │       └── brand-scraper/
│   │           ├── jobs/[id]/route.ts         (60 LOC)
│   │           └── scrape/route.ts            (83 LOC)
│   ├── apps/brand-scraper/page.tsx            (11 LOC)
│   ├── billing/
│   │   ├── page.tsx                           (9 LOC)
│   │   ├── cancel/page.tsx                    (26 LOC)
│   │   └── success/page.tsx                   (38 LOC)
│   └── control-center/billing/
│       ├── page.tsx                            (5 LOC)
│       └── [uid]/page.tsx                     (10 LOC)
├── components/
│   ├── admin/billing/
│   │   ├── AdminBillingPage.tsx               (340 LOC)
│   │   └── AdminBillingUserDetail.tsx         (395 LOC)
│   ├── auth/AuthGuard.tsx                     (39 LOC)
│   ├── billing/BillingPage.tsx                (149 LOC)
│   └── tools/brand-scraper/
│       └── UserBrandScraperPage.tsx           (246 LOC)
├── lib/
│   ├── auth/user.ts                           (62 LOC)
│   └── billing/
│       ├── __tests__/credits.test.ts          (84 LOC)
│       ├── __tests__/types.test.ts            (126 LOC)
│       ├── firestore.ts                       (545 LOC)
│       ├── stripe.ts                          (70 LOC)
│       ├── tools.ts                           (64 LOC)
│       └── types.ts                           (132 LOC)
vitest.config.ts                               (13 LOC)
```

### Modified Tracked Files (9 files)

| File | Change | Category |
|------|--------|----------|
| `.env.local.example` | Added STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET vars | Config |
| `cloudbuild.yaml` | Added Stripe secrets to --set-secrets | Deploy |
| `docs/DEPLOYMENT.md` | Added Stripe setup section, BRAND_SCRAPER_API_URL | Docs |
| `package-lock.json` | Updated with stripe + vitest deps | Deps |
| `package.json` | Added stripe, vitest, test script | Config |
| `scripts/deploy.sh` | Added BRAND_SCRAPER_API_URL substitution | Deploy |
| `src/components/admin/ControlCenterNav.tsx` | Added Billing nav link | UI |
| `src/components/layout/AuthButton.tsx` | Added Billing link to user dropdown | UI |
| `src/lib/brand-scraper/hooks.ts` | Made apiBase configurable (for user vs admin) | Lib |

### Pattern: Commit Scope

All 29 new files + 9 modified files should be staged in a single commit. This is the "coherent commit" specified in VAL-04.

**Exclude from commit:**
- `src/node_modules/` -- Vitest cache (`.vite/vitest/`), created because vitest.config.ts sets `test.root: "src"`
- `repo.zip` -- 8.8MB archive, unrelated artifact
- `package-lock.json` -- While modified, it IS part of the billing changes (stripe + vitest added); it SHOULD be committed

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Gitignore patterns | Manual exclusion at commit time | Fix `.gitignore` properly | Prevents future accidents with `src/node_modules` |
| Selective staging | `git add -A` (too broad) | `git add` with explicit file paths | Avoids committing repo.zip and cache files |

**Key insight:** The `.gitignore` has `/node_modules` which only matches the root-level directory. Vitest with `test.root: "src"` creates `src/node_modules/.vite/vitest/` as its cache directory. This must be excluded by adding `**/node_modules` or `src/node_modules/` to `.gitignore`.

## Common Pitfalls

### Pitfall 1: Test Count Discrepancy (CRITICAL)
**What goes wrong:** The roadmap (VAL-03) specifies "41 existing test cases" but only 26 tests exist.
**Why it happens:** The test count may have been estimated during roadmap creation rather than counted from the actual test files.
**Actual count:**
- `types.test.ts`: 16 tests (4 creditPack + 2 CREDIT_PACKS + 5 adminAdjust + 2 refundReason + 3 pricingUpdate)
- `credits.test.ts`: 10 tests (2 credit pack economics + 5 tool pricing seed + 2 idempotency key + 1 positive margin)
- **Total: 26 tests**
**How to avoid:** Update REQUIREMENTS.md and ROADMAP.md to reflect the actual count of 26 before or during the commit.
**Warning signs:** `npm test` output showing "26 passed" instead of "41 passed"

### Pitfall 2: src/node_modules Not Gitignored
**What goes wrong:** Vitest cache files get committed to the repository.
**Why it happens:** `.gitignore` has `/node_modules` (leading slash = root only). Vitest config sets `test.root: "src"`, which causes Vitest to create `src/node_modules/.vite/vitest/` as its cache.
**How to avoid:** Add `**/node_modules` to `.gitignore` (replace the existing `/node_modules` pattern) OR add `src/node_modules/` as a separate entry.
**Warning signs:** `git status` shows `src/node_modules/` as untracked.

### Pitfall 3: Committing repo.zip
**What goes wrong:** An 8.8MB zip file gets committed to the repository.
**Why it happens:** `repo.zip` is untracked and not in `.gitignore`. Using `git add -A` or `git add .` would include it.
**How to avoid:** Use explicit file paths when staging. Add `repo.zip` to `.gitignore` or delete it.
**Warning signs:** Large file size in `git status` output.

### Pitfall 4: Firebase Build Warnings Confused with Errors
**What goes wrong:** Someone sees Firebase Admin SDK credential warnings during build and thinks the build failed.
**Why it happens:** Build runs in local dev environment without valid Firebase credentials. The warnings are expected and harmless -- they appear during static page generation but don't cause build failure.
**How to avoid:** Understand that the build succeeds despite these warnings. The credential error is caught by the try/catch in `src/lib/firebase.ts`.
**Warning signs:** `Firebase Admin SDK credential error` messages in build output.

### Pitfall 5: package-lock.json Excluded from Commit
**What goes wrong:** Forgetting to commit `package-lock.json` means the CI/CD pipeline won't get the correct dependency versions.
**Why it happens:** Lock files are sometimes treated as "don't touch" files, but when `package.json` changes (new deps), the lock file MUST be committed alongside.
**How to avoid:** Always commit `package-lock.json` when `package.json` is modified.

## Code Examples

### Correct .gitignore Fix
```gitignore
# dependencies — change from /node_modules to cover nested dirs too
node_modules
```
This removes the leading `/` so the pattern matches `node_modules` at any depth, covering both the root `node_modules/` and `src/node_modules/` (Vitest cache).

### Staging Command Pattern
```bash
# Stage all new billing files explicitly
git add \
  src/app/api/admin/billing/ \
  src/app/api/billing/ \
  src/app/api/tools/ \
  src/app/apps/ \
  src/app/billing/ \
  src/app/control-center/billing/ \
  src/components/admin/billing/ \
  src/components/auth/ \
  src/components/billing/ \
  src/components/tools/ \
  src/lib/auth/user.ts \
  src/lib/billing/ \
  vitest.config.ts

# Stage modified tracked files
git add \
  .env.local.example \
  cloudbuild.yaml \
  docs/DEPLOYMENT.md \
  package-lock.json \
  package.json \
  scripts/deploy.sh \
  src/components/admin/ControlCenterNav.tsx \
  src/components/layout/AuthButton.tsx \
  src/lib/brand-scraper/hooks.ts
```

### Quality Gate Verification
```bash
# Run all three gates in sequence
npm run build && npm run lint && npm test
```

Current results (verified 2026-02-09):
- **Build:** Succeeds. All 43 pages generated. Billing routes render as dynamic (f).
- **Lint:** `Checked 145 files in 104ms. No fixes applied.`
- **Test:** `2 passed (2 files), 26 passed (26 tests)`

## State of the Art

| Old Pattern | Current Pattern | Notes |
|-------------|-----------------|-------|
| `/node_modules` in .gitignore | `node_modules` (no leading slash) | Leading slash only matches root; Vitest creates nested node_modules |

## Open Questions

1. **Test count: 26 vs 41**
   - What we know: There are exactly 26 test cases across 2 test files (types.test.ts: 16, credits.test.ts: 10)
   - What's unclear: Where the "41" number came from in the roadmap. Possibly an estimate or planned number.
   - Recommendation: Update REQUIREMENTS.md and ROADMAP.md to say 26 instead of 41. The phase should verify ALL EXISTING tests pass, not a specific number that doesn't match reality.

2. **repo.zip disposition**
   - What we know: 8.8MB file at project root, untracked, not gitignored
   - What's unclear: Whether the user wants to keep it or delete it
   - Recommendation: Add to `.gitignore` at minimum. Ideally delete it if it's a temporary artifact.

3. **deploy.sh change is from a prior phase**
   - What we know: The `deploy.sh` diff adds `BRAND_SCRAPER_API_URL` which was from Phase 20/21 (brand scraper), not billing
   - What's unclear: Why it wasn't committed in the prior phase
   - Recommendation: Include it in this commit since it's needed and has no separate logical home. The commit message should note it covers "billing, auth, tool integration, and supporting config changes."

## Quality Gate Results (Verified)

| Gate | Command | Result | Details |
|------|---------|--------|---------|
| TypeScript Build | `npm run build` | PASS | 43 pages generated, 0 TS errors |
| Biome Lint | `npm run lint` | PASS | 145 files checked, 0 errors |
| Vitest Tests | `npm test` | PASS | 26/26 tests pass (2 test files) |

**IMPORTANT:** All three gates pass with ZERO code changes needed. This phase is purely about gitignore fixes, planning doc corrections, and committing.

## Commit Checklist

The planner should structure tasks around this checklist:

1. [ ] Fix `.gitignore` -- change `/node_modules` to `node_modules` (covers nested)
2. [ ] Add `repo.zip` to `.gitignore` (or delete it)
3. [ ] Correct test count in `.planning/REQUIREMENTS.md` (41 -> 26)
4. [ ] Correct test count in `.planning/ROADMAP.md` (41 -> 26)
5. [ ] Run `npm run build` -- verify PASS
6. [ ] Run `npm run lint` -- verify PASS
7. [ ] Run `npm test` -- verify 26/26 PASS
8. [ ] Stage all 29 new + 9 modified files (explicit paths, NOT `git add -A`)
9. [ ] Verify `git diff --staged` -- no secrets, no debug code, no repo.zip, no node_modules cache
10. [ ] Commit with descriptive message
11. [ ] Run quality gates post-commit to confirm nothing broke

## Sources

### Primary (HIGH confidence)
- Direct execution of `npm run build`, `npm run lint`, `npm test` on local machine
- Direct file reading of all source files
- `git status`, `git diff`, `git check-ignore` output

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` and `.planning/REQUIREMENTS.md` for phase specifications

## Metadata

**Confidence breakdown:**
- Quality gate results: HIGH -- ran directly, output captured
- File inventory: HIGH -- enumerated via git and filesystem
- Gitignore issue: HIGH -- verified with `git check-ignore`
- Test count discrepancy: HIGH -- counted individual test cases in source
- Commit scope: HIGH -- every file reviewed

**Research date:** 2026-02-09
**Valid until:** 2026-02-16 (phase should execute immediately; file state may drift)
