# Technology Stack

**Project:** v1.8 -- Tasks App Integration (Effort Scoring, Demo Mode, Help Tips, Weekly Credit Gating)
**Researched:** 2026-02-11
**Overall confidence:** HIGH
**Mode:** Ecosystem (focused on stack additions for new features across two repos)

## Executive Summary

The v1.8 milestone spans two repositories (todoist and personal-brand) and introduces four feature areas: effort scoring on tasks, a demo workspace mode, reusable help tip tooltips, and weekly credit gating for the Tasks app. The core finding is that **zero new npm packages are needed in either repo**. All four features can be built with existing dependencies plus native browser APIs (Popover API + CSS Anchor Positioning). The primary stack changes are Prisma schema additions in the todoist repo and a new Firestore collection + billing tool pricing entry in the personal-brand repo.

---

## Repo 1: todoist (Task Management App)

### No New Dependencies Needed

All todoist features (effort scoring, demo workspace, help tips) are achievable with the existing stack.

| Existing Technology | Version (Installed) | Latest | v1.8 Role | Status |
|---------------------|---------------------|--------|-----------|--------|
| Next.js | 16.1.6 | 16.1.6 | App Router, Server Actions, RSC | Current |
| React | 19.2.3 | 19.2.4 | UI (task form, tooltips, demo banner) | Patch behind (non-blocking) |
| Prisma | 6.19.2 | 7.4.0 | Schema changes for `effort` field and `isDemo` flag | Major behind -- see note below |
| Tailwind CSS | 4.1.18 | 4.1.18 | Styling for effort badges, help tips, demo banner | Current |
| Zod | 4.3.6 | 4.3.6 | Schema validation for effort field in task forms | Current |
| date-fns | 4.1.0 | 4.1.0 | Date formatting (unchanged) | Current |
| Vitest | 3.2.4 | 3.2.4 | Tests for effort logic, demo workspace seed | Current |
| Biome | 2.3.14 | 2.3.14 | Linting | Current |

**Prisma 7.x Note:** Prisma 7.4.0 is available but is a major version bump. Do NOT upgrade during v1.8. Prisma 6.19.2 fully supports all schema changes needed (optional fields, boolean defaults, Int fields). The `prisma db push` workflow the todoist app uses makes schema iteration trivial -- no migration files to manage.

**Confidence:** HIGH -- all versions verified via `npm list` and `npm view` on 2026-02-11.

### Schema Additions (Prisma)

The following changes to `prisma/schema.prisma` require zero new dependencies:

#### Effort Scoring

```prisma
model Task {
  // ... existing fields ...
  effort    Int?   // null = unscored, 1-5 scale (or Fibonacci: 1,2,3,5,8)
}
```

**Why `Int?` instead of an enum:** An optional integer is simpler than a Prisma enum for a numeric scale. It avoids the enum migration pitfalls documented in Prisma issues (adding/removing enum values requires careful migration ordering on PostgreSQL). A nullable Int with Zod validation (`z.number().int().min(1).max(5).nullable().optional()`) gives the same type safety with less schema ceremony.

**Why not a String field:** The effort value has inherent ordering (1 < 2 < 3). Storing as Int enables `ORDER BY effort` queries directly, and Zod validates the range at the application layer.

#### Demo Workspace Flag

```prisma
model Workspace {
  // ... existing fields ...
  isDemo    Boolean  @default(false)
}
```

**Why a boolean on Workspace, not a separate model:** The demo workspace is functionally identical to a regular workspace -- same projects, sections, tasks. The only difference is that mutations are blocked in the UI/server actions and a banner is displayed. A boolean flag is the simplest approach. The demo workspace's data is seeded via a Prisma seed script, not created through the UI.

### Native Browser APIs (No Libraries)

#### Help Tip Tooltips: Popover API + CSS Anchor Positioning

**Use the native Popover API** (`popover` attribute) paired with **CSS Anchor Positioning** (`anchor-name`, `position-anchor`, `inset-area`) for contextual help tips. No tooltip library needed.

| API | Baseline Status | Global Support | Source |
|-----|----------------|----------------|--------|
| Popover API | Widely Available (April 2025) | ~93% | [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) |
| CSS Anchor Positioning | Newly Available (Jan 2026) | ~77% | [Can I Use](https://caniuse.com/css-anchor-positioning) |

**Why native over a library (Radix, Floating UI, etc.):**
1. The todoist app has zero UI library dependencies. Adding Radix or Floating UI for tooltips alone would be disproportionate.
2. Both APIs are Baseline in all major browsers as of January 2026 (Chrome 125+, Firefox 147+, Safari 26+, Edge 125+).
3. For the ~23% on older browsers, help tips are a progressive enhancement -- the app works without them.
4. A single reusable `<HelpTip>` component (~30 lines) wrapping these APIs is trivial.

**Implementation pattern:**
```tsx
// src/components/ui/help-tip.tsx
function HelpTip({ id, content }: { id: string; content: string }) {
  return (
    <>
      <button
        type="button"
        className="text-text-tertiary hover:text-gold"
        style={{ anchorName: `--tip-${id}` } as React.CSSProperties}
        popoverTarget={`tip-${id}`}
        popoverTargetAction="toggle"
      >?</button>
      <div
        id={`tip-${id}`}
        popover="auto"
        style={{
          positionAnchor: `--tip-${id}`,
          insetArea: "top",
        } as React.CSSProperties}
        className="rounded-lg border border-border bg-surface p-3 text-sm shadow-lg max-w-xs"
      >{content}</div>
    </>
  );
}
```

**Fallback strategy for older browsers:** The `popover` attribute degrades to `display: none` in unsupported browsers (the tip simply never shows). The `?` button remains visible but does nothing. This is acceptable for non-critical help text.

**Confidence:** HIGH for Popover API, MEDIUM for CSS Anchor Positioning (newer, but 5 months in all major browsers).

---

## Repo 2: personal-brand (dan-weinbeck.com)

### No New Dependencies Needed

The personal-brand site already has everything required for weekly credit gating and app listing.

| Existing Technology | Version (Installed) | v1.8 Role | Status |
|---------------------|---------------------|-----------|--------|
| Next.js | 16.1.6 | Apps page, API routes for billing check | Current |
| Firebase Admin | 13.6.0 | Firestore for billing, `verifyIdToken` | Current |
| Stripe | 20.3.1 | Already configured for credit purchases | Current |
| Zod | 4.3.6 | Validation for billing API inputs | Current |
| SWR | 2.4.0 | Client-side polling if needed for gating state | Current |

### Weekly Credit Gating: Billing System Extension

The existing billing system (Firestore ledger, `debitForToolUse`, `billing_tool_pricing`) already handles per-use credit charges. Weekly gating adds a **periodic (weekly) charge model** on top of the existing per-use model.

**Approach: Firestore-only, no Stripe subscription.** Use the existing credit ledger to debit a fixed weekly amount. No Stripe Billing/subscriptions needed because:

1. Users already buy credit packs via Stripe Checkout (one-time purchases).
2. Weekly access fees are deducted from the credit balance, same as tool usage.
3. Adding Stripe subscriptions for a $0.50/week access fee would add massive complexity (subscription lifecycle management, cancellations, proration, webhook handling for `invoice.paid`, etc.) for negligible benefit.

**New Firestore collection:** `billing_tool_access` (or extend `billing_tool_usage` with a new `type` field)

```typescript
type ToolAccessGrant = {
  uid: string;
  toolKey: "tasks_app";         // matches billing_tool_pricing
  grantedAt: Timestamp;         // start of access period
  expiresAt: Timestamp;         // grantedAt + 7 days
  creditsCharged: number;
  ledgerEntryId: string;        // reference to the ledger debit
};
```

**Gating flow:**
1. User navigates to `/apps/tasks` on personal-brand site.
2. API route checks `billing_tool_access` for an active (non-expired) grant for `tasks_app`.
3. If active grant exists: redirect to the todoist app URL (or render embedded).
4. If no active grant: show pricing/purchase page. User clicks "Activate for X credits/week."
5. Server action debits credits via existing `debitForToolUse` (or a new `debitForToolAccess`) and creates the access grant.
6. Grant checked on each app load, not continuously.

**New tool pricing seed entry:**
```typescript
{
  toolKey: "tasks_app",
  label: "Tasks App (Weekly)",
  active: true,
  creditsPerUse: 25,              // 25 credits/week = $0.25/week
  costToUsCentsEstimate: 0,       // no external API cost
}
```

**Confidence:** HIGH -- this extends the proven billing pattern with a time-based access check. No new infrastructure.

### Apps Page Extension

The `src/data/apps.ts` file and `AppCard` component need a new entry for the Tasks app. The existing `AppListing` type and `AppCard` component handle this without changes -- just add a new entry to the `getApps()` array.

The `href` field can point to either:
- An internal page (`/apps/tasks`) that checks billing then redirects to the external todoist app URL
- The todoist app directly (with billing check happening via a middleware or API call on the todoist side)

**Recommended: Internal page pattern** (`/apps/tasks` on personal-brand). This keeps all billing logic in one codebase and avoids adding Firebase/billing dependencies to the todoist app.

---

## Cross-Repo Integration Pattern

### How the Two Apps Connect

| Concern | Where It Lives | Why |
|---------|---------------|-----|
| Task management (CRUD, views, effort scoring) | todoist repo | Standalone app with its own database |
| Billing, credits, access gating | personal-brand repo | Centralized billing system |
| Demo workspace | todoist repo | Pre-seeded data, read-only UI mode |
| Help tips | todoist repo | Task-specific contextual help |
| App listing + purchase flow | personal-brand repo | Apps ecosystem entry point |

### Integration Approach: Link-Based (Not Embedded)

The todoist app runs as a separate deployment. The personal-brand site links to it after verifying billing access. This is the same pattern as the Envelopes app (which has `href: "/envelopes"` as an internal route, not an external URL).

**If the todoist app will be deployed separately** (its own Cloud Run service or Vercel deployment):
- personal-brand's `/apps/tasks` page checks billing access
- On success, redirects to the todoist app's URL with a signed token or session param
- The todoist app verifies the token before serving content

**If the todoist app will be embedded as a route in personal-brand** (recommended for simplicity):
- Copy/adapt todoist's pages into `src/app/apps/tasks/` in the personal-brand repo
- Database connection (PostgreSQL + Prisma) added to personal-brand's server-side code
- All billing + task management in one deploy

**Recommendation: Decide integration architecture first.** This is the most impactful decision for v1.8. Embedding is simpler but adds PostgreSQL/Prisma as a dependency to personal-brand. Separate deployment is cleaner but requires cross-app auth.

---

## Recommended Stack (Complete Summary)

### Todoist Repo Changes

| Change Type | What | Why |
|-------------|------|-----|
| Prisma schema | Add `effort Int?` to Task model | Effort scoring feature |
| Prisma schema | Add `isDemo Boolean @default(false)` to Workspace model | Demo workspace identification |
| Zod schema | Add `effort` to create/update task schemas | Validation for effort values |
| New component | `src/components/ui/help-tip.tsx` | Reusable tooltip using native Popover API |
| New component | `src/components/tasks/effort-badge.tsx` | Visual effort indicator on task cards |
| New component | `src/components/workspace/demo-banner.tsx` | Read-only mode indicator |
| Seed script | `prisma/seed.ts` | Populate demo workspace with sample data |
| Service logic | Guard mutations for demo workspace | Prevent edits to demo data |

### Personal-Brand Repo Changes

| Change Type | What | Why |
|-------------|------|-----|
| Data file | Add tasks_app entry to `src/data/apps.ts` | App listing |
| New page | `src/app/apps/tasks/page.tsx` | Billing-gated entry point |
| Billing | Add `tasks_app` to `TOOL_PRICING_SEED` | Weekly pricing |
| Billing | New `billing_tool_access` Firestore collection | Time-based access grants |
| Billing logic | `debitForToolAccess()` function | Weekly credit debit with expiry |
| API route | `/api/tools/tasks/access` | Check/create access grants |

---

## Alternatives Considered

### Effort Scoring Approach

| Approach | Recommended | Why |
|----------|-------------|-----|
| `Int?` field (1-5 scale) | **Yes** | Simple, sortable, no enum migration issues, Zod-validated |
| Prisma `enum Effort { TRIVIAL SMALL MEDIUM LARGE HUGE }` | No | Enum migrations on PostgreSQL are fragile in Prisma; adding/removing values requires careful ordering |
| String field with convention | No | No ordering, no type safety without extra parsing |
| Fibonacci points (1,2,3,5,8,13) | No for MVP | Familiar to devs but confusing for non-technical users; can add as an alternative scale later |

### Tooltip/Help Tip Library

| Approach | Recommended | Why |
|----------|-------------|-----|
| Native Popover API + CSS Anchor Positioning | **Yes** | Zero dependencies, Baseline in all major browsers since Jan 2026, progressive enhancement |
| `@radix-ui/react-tooltip` | No | Would be the first Radix dependency; 18KB for tooltips alone; overkill for contextual help text |
| `@floating-ui/react` | No | Powerful but complex (15KB); designed for complex positioning needs the app does not have |
| `react-tooltip` | No | Adds a dependency for a feature that native APIs now handle |
| CSS-only `:hover` pseudo-class | No | Not accessible (no keyboard/screen reader support); no mobile touch support |

### Weekly Billing Model

| Approach | Recommended | Why |
|----------|-------------|-----|
| Credit debit + Firestore access grants | **Yes** | Uses existing billing infrastructure, zero new dependencies, simple time-check |
| Stripe Subscription (weekly) | No | Massive complexity for $0.25/week; subscription lifecycle, cancellations, proration, additional webhooks |
| Stripe Metered Billing | No | Designed for variable usage; weekly access is fixed-cost |
| Free tier + premium features | No | Overcomplicates MVP; weekly credit model is simpler and already fits the billing system |
| Per-use charges (charge per task created) | No | Unpredictable costs annoy users; weekly flat fee is predictable |

### Demo Workspace Implementation

| Approach | Recommended | Why |
|----------|-------------|-----|
| Boolean flag on Workspace + seed script | **Yes** | Minimal schema change; mutations guarded at service layer; seed script reproducible |
| Separate "demo mode" with in-memory data | No | Would require duplicating all data access patterns; can't demonstrate real DB-backed features |
| Hardcoded demo page with static data | No | Doesn't show actual app functionality; can't toggle views or expand tasks |
| Read-only database user | No | PostgreSQL role-based access is infrastructure-level; too heavy for a UI feature |

---

## What NOT to Add

| Technology | Why Not |
|------------|---------|
| `@radix-ui/react-tooltip` or `@radix-ui/react-popover` | Native Popover API + CSS Anchor Positioning covers the use case. Zero-dependency approach. |
| `@floating-ui/react` or `@floating-ui/dom` | Same as above. Over-engineered for simple contextual tips. |
| `react-tooltip` | Same as above. |
| Stripe Billing (subscriptions) | Weekly credit debit is simpler and uses existing infrastructure. |
| `@stripe/stripe-js` (client SDK) | Not needed; existing Stripe Checkout redirect pattern handles purchases. |
| `next-auth` or `auth.js` | Both apps already have auth solutions (Firebase Auth in personal-brand, no auth needed in todoist standalone). |
| `prisma@7.x` upgrade | Major version bump during feature work adds unnecessary risk. |
| `vitest@4.x` upgrade | Same reasoning. |
| Firebase SDK in todoist repo | Keep billing in personal-brand. Todoist should remain a standalone PostgreSQL app. |
| `cron` or `node-cron` | Weekly expiry checked on access, not via scheduled jobs. No cron needed. |
| `ioredis` or `upstash/redis` | Access grant checks hit Firestore (single document read). Not a performance bottleneck. |
| `@tailwindcss/forms` | The todoist app already has custom form styling that matches its design system. |

---

## Installation Commands

### Todoist Repo

```bash
# No packages to install. Schema changes only.
cd /Users/dweinbeck/Documents/todoist

# After schema changes, push to database
npx prisma db push

# Regenerate Prisma client
npx prisma generate

# Run seed script (after creating prisma/seed.ts)
npx prisma db seed
```

### Personal-Brand Repo

```bash
# No packages to install. Code changes only.
cd /Users/dweinbeck/Documents/personal-brand

# Verify existing deps are installed
npm ci

# Run quality gates after changes
npm run lint && npm run build && npm test
```

---

## Environment Variables

### No New Environment Variables Needed

**Todoist repo:** Uses `DATABASE_URL` (already configured). No new env vars for effort, demo, or help tips.

**Personal-brand repo:** All billing env vars already configured (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, Firebase credentials). The weekly access gating uses the same Firestore connection.

**If the todoist app is deployed separately and needs cross-app auth:**
- `TASKS_APP_URL` in personal-brand (URL to redirect to after billing check)
- `BILLING_API_URL` in todoist (URL to verify access grants)
- `TASKS_APP_SIGNING_SECRET` in both repos (shared secret for signed tokens)

These are only needed if the apps run as separate deployments. If embedded, no new env vars.

---

## Sources

### Verified Locally (HIGH confidence)
- **Package versions:** All verified via `npm list --depth=0` in both repos and `npm view <pkg> version` on 2026-02-11
- **Prisma schema:** Read `prisma/schema.prisma` -- confirmed no existing `effort` or `isDemo` fields
- **Billing system:** Read `src/lib/billing/firestore.ts`, `types.ts`, `tools.ts` -- confirmed debit pattern and tool pricing structure
- **App listing:** Read `src/data/apps.ts` and `src/components/apps/AppCard.tsx` -- confirmed listing pattern
- **No migrations directory:** Confirmed todoist uses `prisma db push` (no `prisma/migrations/` directory)

### Official Documentation (HIGH confidence)
- [MDN Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API) -- Baseline Widely Available April 2025
- [MDN CSS Anchor Positioning](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Anchor_positioning) -- Baseline Newly Available January 2026
- [Can I Use: CSS Anchor Positioning](https://caniuse.com/css-anchor-positioning) -- ~77% global support (all major browsers since Jan 2026)
- [Can I Use: Popover](https://caniuse.com/?search=popover) -- ~93% global support
- [Prisma Schema Reference](https://www.prisma.io/docs/orm/reference/prisma-schema-reference) -- Optional fields, Boolean defaults
- [Prisma Enum Migration Issues](https://github.com/prisma/prisma/issues/24292) -- Known PostgreSQL enum migration pitfalls

### Web Search (MEDIUM confidence)
- [Stripe Billing Credits Documentation](https://docs.stripe.com/billing/subscriptions/usage-based/billing-credits) -- Confirmed metered billing requires subscriptions; our credit debit approach avoids this
- [Frontend Masters: Popover API for Tooltips](https://frontendmasters.com/blog/using-the-popover-api-for-html-tooltips/) -- Practical implementation patterns
- [web.dev: Popover API Baseline](https://web.dev/blog/popover-api) -- Baseline announcement and browser compat
