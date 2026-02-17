# Phase 41: Envelopes Enhancements - Research

**Researched:** 2026-02-17
**Domain:** Envelope budgeting app - fund transfers, analytics redesign, weekly rollover workflow
**Confidence:** HIGH

## Summary

Phase 41 enhances the existing Envelopes budgeting feature across three distinct areas: (1) fund transfers between envelopes, (2) analytics page redesign, and (3) weekly rollover workflow. The existing codebase is mature with 60+ files, well-established patterns (SWR hooks, Zod validation, Firestore CRUD, `cents`-based arithmetic), and a clean separation between server API routes and client components.

The existing **overage allocation system** (`OverageModal`, `createAllocations`, `validateAllocations`) already implements a form of fund transfer -- specifically, reallocating funds from "donor" envelopes to cover an overage on a specific transaction. Phase 41's fund transfer feature would generalize this into a standalone, user-initiated transfer between any two envelopes. The analytics page currently has three sections (SummaryStats, WeeklyPivotTable, SavingsChart) and uses recharts for charting. The rollover feature already exists as a boolean flag on envelopes, but there is no automated "week end" workflow -- rollover is a display concept only, and the system does not carry forward unused budget into the next week's calculations.

**Primary recommendation:** Break this phase into 3-4 plans: (1) Fund transfers API + UI, (2) Analytics redesign, (3) Rollover workflow, and optionally (4) Demo mode parity updates.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js | 16.1.6 | App router, API routes | Framework |
| React | 19.2.3 | UI components | Framework |
| Tailwind CSS | 4.x | Styling | Design system |
| Firebase Admin | 13.6.0 | Firestore server-side | Database |
| SWR | 2.4.0 | Client-side data fetching with cache | Already used for all envelope hooks |
| Zod | 4.3.6 | Runtime input validation at API boundaries | Schema-first mandate |
| recharts | 3.7.0 | Charts (AreaChart currently used) | Already in use for SavingsChart |
| date-fns | 4.1.0 | Date manipulation, week math | Already in use throughout |
| clsx | 2.1.1 | Conditional className joining | Already in use |

### Supporting (No New Dependencies Needed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| recharts (BarChart, PieChart) | 3.7.0 | Additional chart types for analytics redesign | Analytics redesign plan |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts BarChart | Custom SVG bars | recharts already installed, consistent API, responsive built in |
| Firestore batch writes | Individual writes | Batch is essential for atomicity of transfers -- already used in allocations |

**Installation:**
```bash
# No new packages needed -- all dependencies are already installed
```

## Architecture Patterns

### Current File Structure (Envelopes)
```
src/
├── app/
│   ├── envelopes/
│   │   ├── layout.tsx              # EnvelopesNav wrapper
│   │   ├── page.tsx                # Home (landing if !auth, HomPage if auth)
│   │   ├── [envelopeId]/page.tsx   # Detail page
│   │   ├── analytics/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # AuthGuard -> AnalyticsPage
│   │   ├── transactions/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx            # AuthGuard -> TransactionsPage
│   │   └── demo/                   # Demo mode (no auth required)
│   └── api/envelopes/
│       ├── route.ts                # GET list, POST create
│       ├── [envelopeId]/route.ts   # GET/PUT/DELETE single
│       ├── transactions/route.ts   # GET list, POST create
│       ├── transactions/[transactionId]/route.ts  # PUT/DELETE single
│       ├── allocations/route.ts    # POST create overage allocations
│       ├── analytics/route.ts      # GET analytics data
│       ├── reorder/route.ts        # POST reorder
│       └── profile/route.ts        # GET/PUT KPI profile
├── components/envelopes/
│   ├── EnvelopesHomePage.tsx        # Main home page (290 lines)
│   ├── EnvelopeCard.tsx             # Single card in grid
│   ├── EnvelopeCardGrid.tsx         # Grid layout
│   ├── EnvelopeDetailPage.tsx       # Single envelope detail
│   ├── EnvelopeForm.tsx             # Create/edit form
│   ├── CreateEnvelopeCard.tsx       # "+" card
│   ├── TransactionsPage.tsx         # Full transactions view
│   ├── TransactionForm.tsx          # Create/edit transaction
│   ├── TransactionList.tsx          # Table of transactions
│   ├── TransactionRow.tsx           # Single row
│   ├── InlineTransactionForm.tsx    # Compact form for detail page
│   ├── AnalyticsPage.tsx            # Analytics container (60 lines)
│   ├── SummaryStats.tsx             # 4 stat cards
│   ├── WeeklyPivotTable.tsx         # Week x Envelope spending matrix
│   ├── SavingsChart.tsx             # AreaChart for cumulative savings
│   ├── OverageModal.tsx             # Modal for overage reallocation
│   ├── DonorAllocationRow.tsx       # Row in overage modal
│   ├── GreetingBanner.tsx           # Welcome banner
│   ├── SavingsBanner.tsx            # Savings total banner
│   ├── KpiBox.tsx                   # Key metrics display
│   ├── KpiWizardModal.tsx           # Setup wizard
│   ├── WeekSelector.tsx             # Week navigation
│   ├── EnvelopesNav.tsx             # Sub-navigation tabs
│   ├── ReadOnlyBanner.tsx           # Billing warning
│   ├── EnvelopesLandingPage.tsx     # Unauthenticated landing
│   └── demo/                        # Demo mode components
└── lib/envelopes/
    ├── types.ts                     # Zod schemas + TS types (223 lines)
    ├── firestore.ts                 # CRUD + computations (992 lines)
    ├── api.ts                       # Client fetch wrapper
    ├── hooks.ts                     # SWR hooks (92 lines)
    ├── week-math.ts                 # Date utilities
    ├── format.ts                    # formatCents utility
    ├── kpi-math.ts                  # KPI calculations
    └── billing.ts                   # Billing access checks
```

### Pattern 1: Fund Transfer as a New API Route
**What:** Create `POST /api/envelopes/transfers` as a new endpoint that atomically moves funds between two envelopes within a week, using Firestore batched writes.
**When to use:** When a user wants to move remaining budget from one envelope to another without creating a transaction.
**How it differs from overage allocations:** Overage allocations are linked to a specific transaction (`sourceTransactionId`) and are triggered automatically when spending exceeds budget. Fund transfers are user-initiated, standalone, and bidirectional (any envelope to any envelope).

**Data model approach:**
```typescript
// Option A: New Firestore collection "envelope_transfers"
export type EnvelopeTransfer = {
  id: string;
  userId: string;
  fromEnvelopeId: string;
  toEnvelopeId: string;
  amountCents: number;
  weekStart: string; // YYYY-MM-DD -- scoped to the week
  note?: string;
  createdAt: Timestamp;
};

// Zod input schema
export const transferSchema = z.object({
  fromEnvelopeId: z.string().min(1),
  toEnvelopeId: z.string().min(1),
  amountCents: z.number().int().min(1),
  note: z.string().max(200).optional(),
});
```

**Key decision: New collection vs. synthetic transactions**
- **New collection (recommended):** Clean separation, transfers are first-class entities, easy to query/display/undo. The overage allocation system already established the pattern of a separate collection.
- **Synthetic transactions:** Creating matching debit/credit transactions would muddy the transaction list and complicate analytics.

### Pattern 2: Analytics Redesign with recharts Components
**What:** Enhance the AnalyticsPage with additional chart types and improved data visualization.
**When to use:** The current analytics page is functional but basic -- three sections stacked vertically.

**Current analytics data available from API (`AnalyticsPageData`):**
- `summary`: totalSpent, totalBudget, totalRemaining, onTrackCount, totalEnvelopeCount
- `envelopes`: [{id, title}] for column headers
- `pivotRows`: Week-by-envelope spending matrix (newest first)
- `savingsByWeek`: Per-week and cumulative savings (oldest first)

**Potential analytics redesign directions:**
1. **Budget utilization bar chart** -- horizontal bars showing spent vs. budget per envelope (like DemoAnalyticsPage progress bars but as a proper recharts BarChart)
2. **Spending trend line chart** -- weekly totals over time as a line chart
3. **Category breakdown pie/donut chart** -- proportional spending by envelope
4. **Per-envelope sparklines** on the home page cards
5. **Improved summary cards** -- with trend indicators (up/down arrows, % change)
6. **Transfer history section** -- if fund transfers are implemented

### Pattern 3: Weekly Rollover Workflow
**What:** Currently, `rollover: boolean` on envelopes is a flag that determines whether savings are counted in `computeSavingsForWeek` (rollover envelopes are skipped). But there is NO mechanism to actually carry forward unused budget into the next week.
**When to use:** When a user marks an envelope as "rollover" and wants unused budget to accumulate.

**Current behavior analysis:**
- `computeEnvelopeStatus()` computes `remainingCents = weeklyBudgetCents - spentCents + received - donated` -- it does NOT consider prior weeks' surplus
- `computeSavingsForWeek()` explicitly skips rollover envelopes (`if (env.rollover) continue`)
- The `rollover` flag currently only affects savings calculations, not the envelope's effective budget

**Implementation approaches:**
1. **Computed rollover (query-time):** At query time, sum up (budget - spent) for all prior completed weeks of a rollover envelope, and add that surplus to the current week's budget. Pro: No new Firestore documents. Con: Performance cost grows with history.
2. **Stored rollover snapshots:** At the end of each week (or on first access of a new week), create a snapshot document recording the carryover amount. Pro: O(1) lookup. Con: Requires a trigger mechanism.
3. **Hybrid approach (recommended):** Compute rollover on the fly (like approach 1) but cache/store the result once computed for a given week. The `checkEnvelopeAccess` function already runs on every request and tracks "first access week start" -- a similar pattern could trigger rollover computation.

**Key question for rollover:** Should the rollover surplus be visible as a separate line item or just silently increase the effective budget?

### Anti-Patterns to Avoid
- **Modifying transaction amounts for transfers:** Transfers should NOT create fake transactions. Transactions are user spending records.
- **Coupling transfer logic to overage allocations:** The existing allocation system is overage-specific (linked to `sourceTransactionId`). Don't overload it.
- **N+1 queries in rollover calculation:** If computing historical rollover, batch-fetch all transactions for a user, don't query per-week.
- **Mutating the `weeklyBudgetCents` field for rollover:** The base budget should remain constant. Rollover surplus should be a computed or stored addition.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Chart rendering | Custom SVG charts | recharts (already installed) | Responsive, tooltips, animations built in |
| Date week math | Manual date arithmetic | date-fns + existing `week-math.ts` | Edge cases with DST, year boundaries |
| Atomic writes | Sequential Firestore writes | `db.batch()` or `db.runTransaction()` | Already used in allocations, ensures consistency |
| Form validation | Manual field checks | Zod schemas at API boundary | Consistent with existing pattern throughout codebase |
| Data fetching | Manual fetch + state | SWR hooks (existing pattern) | Cache invalidation, loading states, error handling |

**Key insight:** The existing codebase has solved all the infrastructure problems. Phase 41 is feature work on top of well-established patterns.

## Common Pitfalls

### Pitfall 1: Transfer and Rollover Double-Counting
**What goes wrong:** If transfers adjust effective budgets AND rollover also adjusts effective budgets, unspent transfer funds could be double-counted in rollover calculations.
**Why it happens:** Both features modify the "effective remaining" for an envelope.
**How to avoid:** Define clear accounting: transfers reduce the source and increase the target within a single week. Rollover carries forward the final end-of-week remaining (which already includes transfers). Use a well-defined formula: `effectiveBudget = weeklyBudgetCents + rolloverFromPriorWeeks + receivedTransfers - sentTransfers`.
**Warning signs:** Envelope remaining appears larger than expected, savings calculations seem inflated.

### Pitfall 2: Rollover for Non-Existent Weeks
**What goes wrong:** Computing rollover for an envelope that didn't exist in prior weeks includes phantom surplus.
**Why it happens:** The computation iterates over weeks from earliest envelope creation but doesn't account for individual envelope creation dates properly.
**How to avoid:** Already handled in `computeSavingsForWeek` with `if (env.createdAt > weekEnd) continue`. Apply the same guard to rollover calculations.
**Warning signs:** New envelopes show suspiciously large remaining amounts.

### Pitfall 3: Transfer Validation Race Conditions
**What goes wrong:** Two simultaneous transfers from the same envelope could overdraw it.
**Why it happens:** Read-then-write pattern without transaction isolation.
**How to avoid:** Use Firestore `runTransaction()` for transfers (read balances + write transfer in a single atomic transaction). The allocations API already demonstrates this need (though it currently uses batch writes, not transactions).
**Warning signs:** Negative remaining on source envelope after transfer.

### Pitfall 4: Analytics API Performance Degradation
**What goes wrong:** Adding transfer data to analytics requires additional Firestore queries, slowing down the already-complex `getAnalyticsData()` function.
**Why it happens:** `getAnalyticsData()` already does 3 parallel queries. Adding transfers adds more.
**How to avoid:** Include transfer query in the existing `Promise.all()` parallel fetch. Keep the transfer collection query pattern simple (userId + date range).
**Warning signs:** Analytics page load time noticeably increases.

### Pitfall 5: Overage Allocation vs. Transfer Confusion
**What goes wrong:** Users don't understand the difference between the automatic overage allocation modal and manual fund transfers.
**Why it happens:** Both move money between envelopes, but with different triggers and semantics.
**How to avoid:** Clear UI labeling. Overage allocations appear only after an overspend. Fund transfers are a deliberate user action from a dedicated UI (button or section on home page). Consider a "Transfer History" section to distinguish from transactions.
**Warning signs:** Users expect the overage modal to work like a general transfer tool.

## Code Examples

### Example 1: Transfer Zod Schema (follows existing patterns in types.ts)
```typescript
// Source: existing pattern from types.ts (overageAllocationSchema)
export const transferSchema = z.object({
  fromEnvelopeId: z.string().min(1),
  toEnvelopeId: z.string().min(1),
  amountCents: z.number().int().min(1),
  note: z.string().max(200).optional(),
});
export type TransferInput = z.infer<typeof transferSchema>;
```

### Example 2: Transfer Firestore Operation (follows allocations pattern)
```typescript
// Source: existing pattern from firestore.ts (createAllocations)
export async function createTransfer(
  userId: string,
  input: TransferInput,
  weekStart: string,
): Promise<void> {
  const firestore = requireDb();

  await firestore.runTransaction(async (txn) => {
    // Verify both envelopes exist and belong to user
    const fromRef = envelopesCol().doc(input.fromEnvelopeId);
    const toRef = envelopesCol().doc(input.toEnvelopeId);
    const [fromSnap, toSnap] = await Promise.all([
      txn.get(fromRef),
      txn.get(toRef),
    ]);

    if (!fromSnap.exists || fromSnap.data()?.userId !== userId) {
      throw new Error("Source envelope not found or access denied.");
    }
    if (!toSnap.exists || toSnap.data()?.userId !== userId) {
      throw new Error("Target envelope not found or access denied.");
    }

    // Create transfer document
    const transferRef = transfersCol().doc();
    txn.set(transferRef, {
      userId,
      fromEnvelopeId: input.fromEnvelopeId,
      toEnvelopeId: input.toEnvelopeId,
      amountCents: input.amountCents,
      weekStart,
      ...(input.note ? { note: input.note } : {}),
      createdAt: FieldValue.serverTimestamp(),
    });
  });
}
```

### Example 3: Transfer Modal UI (follows OverageModal pattern)
```typescript
// Source: existing pattern from OverageModal.tsx
// The transfer modal would be simpler than the overage modal:
// - Select source envelope (dropdown)
// - Select target envelope (dropdown)
// - Enter amount (with max = source remaining)
// - Optional note
// - Submit button
```

### Example 4: Rollover Computation (follows computeEnvelopeStatus pattern)
```typescript
// Source: existing pattern from firestore.ts (computeEnvelopeStatus)
export function computeRolloverSurplus(
  weeklyBudgetCents: number,
  priorWeeksSpent: number[], // spent per completed week
): number {
  let surplus = 0;
  for (const spent of priorWeeksSpent) {
    const weekSurplus = Math.max(0, weeklyBudgetCents - spent);
    surplus += weekSurplus;
  }
  return surplus;
}
```

### Example 5: Enhanced AnalyticsPageData Type
```typescript
// Source: extending existing AnalyticsPageData in types.ts
// Add to the existing type:
type EnhancedAnalyticsPageData = AnalyticsPageData & {
  spendingByEnvelope: {
    envelopeId: string;
    title: string;
    spentCents: number;
    budgetCents: number;
    percentUsed: number;
  }[];
  weeklyTotals: {
    weekStart: string;
    weekLabel: string;
    totalSpentCents: number;
    totalBudgetCents: number;
  }[];
  transferHistory?: {
    id: string;
    fromTitle: string;
    toTitle: string;
    amountCents: number;
    weekStart: string;
    note?: string;
    createdAt: string;
  }[];
};
```

## Existing Codebase Inventory

### Files That MUST Be Modified

| File | What Changes | Why |
|------|-------------|-----|
| `src/lib/envelopes/types.ts` | Add transfer schema, transfer type, enhanced analytics types | New data models |
| `src/lib/envelopes/firestore.ts` | Add `transfersCol()`, `createTransfer()`, `listTransfers()`, rollover computation helpers | New CRUD + computations |
| `src/lib/envelopes/hooks.ts` | Add `useTransfers()` hook (or extend `useEnvelopes`) | Client data fetching |
| `src/components/envelopes/EnvelopesHomePage.tsx` | Add transfer button/UI, show rollover amounts on cards | New user actions |
| `src/components/envelopes/EnvelopeCard.tsx` | Display rollover surplus indicator | Visual change |
| `src/components/envelopes/AnalyticsPage.tsx` | Redesign layout, add new chart sections | Analytics redesign |

### Files That WILL Be Created

| File | Purpose |
|------|---------|
| `src/app/api/envelopes/transfers/route.ts` | POST create, GET list transfers |
| `src/components/envelopes/TransferModal.tsx` | Fund transfer UI modal |
| `src/components/envelopes/SpendingByEnvelopeChart.tsx` | Bar chart for per-envelope spending |
| `src/components/envelopes/SpendingTrendChart.tsx` | Line chart for weekly spending trends |

### Files That MAY Need Updates

| File | If Condition | What Changes |
|------|-------------|-----|
| `src/lib/envelopes/billing.ts` | If transfers need billing check | Add transfer billing guard |
| `src/components/envelopes/demo/DemoProvider.tsx` | If demo mode should showcase transfers | Add TRANSFER_FUND action |
| `src/components/envelopes/demo/seed-data.ts` | If demo needs transfer data | Add demo transfers |
| `firestore.indexes.json` | If transfers need compound query | Add `envelope_transfers` userId+weekStart index |
| `src/components/envelopes/SummaryStats.tsx` | If analytics redesign changes summary | UI updates |
| `src/components/envelopes/WeeklyPivotTable.tsx` | If analytics redesign changes pivot | UI updates |

### Firestore Collections

| Collection | Existing | Purpose |
|------------|----------|---------|
| `envelopes` | Yes | Envelope documents (userId, title, weeklyBudgetCents, rollover, sortOrder) |
| `envelope_transactions` | Yes | Spending transactions |
| `envelope_allocations` | Yes | Overage reallocation records |
| `envelope_profiles` | Yes | KPI profile per user |
| `envelope_billing` | Yes | Per-user billing tracking |
| `envelope_transfers` | **NEW** | Fund transfer records between envelopes |

### Existing Firestore Indexes

| Collection | Fields | Exists |
|------------|--------|--------|
| `envelopes` | userId ASC, sortOrder ASC | Yes |
| `envelope_transactions` | userId ASC, date ASC | Yes |
| `envelope_transactions` | userId ASC, date DESC | Yes |
| `envelope_transfers` | userId ASC, weekStart ASC | **NEW NEEDED** |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Rollover as display-only flag | Need actual rollover computation | Phase 41 | Envelopes with `rollover: true` would show accumulated surplus |
| Overage-only fund movement | User-initiated transfers | Phase 41 | Users can proactively redistribute budget |
| Basic 3-section analytics | Enhanced charts + additional data | Phase 41 | Better spending insights |

## Open Questions

1. **Transfer direction constraints**
   - What we know: Overage allocations only go from surplus envelopes to deficit ones. General transfers could go in any direction.
   - What's unclear: Should transfers only be allowed from envelopes with positive remaining? Or should a user be allowed to make a deficit envelope even more negative by transferring out?
   - Recommendation: Only allow transfers from envelopes with positive remaining (consistent with overage allocation pattern). Validate `amountCents <= sourceRemaining`.

2. **Rollover surplus visibility**
   - What we know: Currently `EnvelopeCard` shows `remainingCents of weeklyBudgetCents budget`. With rollover, the effective budget would be larger.
   - What's unclear: Should the card show "Remaining: $63 of $50 budget (+$13 rollover)" or just show the effective total?
   - Recommendation: Show the base budget + rollover as separate line items on the card for transparency. E.g., "Budget: $50/wk + $13 rollover = $63 effective".

3. **Analytics redesign scope**
   - What we know: Current analytics has SummaryStats + WeeklyPivotTable + SavingsChart.
   - What's unclear: How much redesign? Additive (add charts) or replacement (rethink entire layout)?
   - Recommendation: Additive approach -- keep existing sections, add spending-by-envelope bar chart and spending trend line chart. Restyle if needed but don't remove existing value.

4. **Transfer history display location**
   - What we know: Transactions have their own page tab. Allocations are only visible via the overage modal.
   - What's unclear: Where should transfer history live? Own page? On analytics? On envelope detail?
   - Recommendation: Show transfers in the analytics page (new "Transfers" section) and on individual envelope detail pages. Don't create a separate nav tab -- it would clutter the nav for a secondary action.

5. **Rollover computation trigger**
   - What we know: There is no background job/cron in this architecture. Everything is request-driven.
   - What's unclear: When does rollover get computed? On every request? Cached per-week?
   - Recommendation: Compute on the fly during `listEnvelopesWithRemaining()` for rollover envelopes. The query already fetches all transactions. Cache the result in the response (no separate Firestore document needed unless performance becomes an issue).

6. **Demo mode parity**
   - What we know: Demo mode mirrors the main app but with in-memory state (DemoProvider useReducer).
   - What's unclear: Should demo mode showcase transfers and rollover?
   - Recommendation: Add a static "Transfer" example in demo seed data and show rollover on one demo envelope. This keeps demo mode representative.

## Suggested Plan Breakdown

| Plan | Scope | Estimated Complexity |
|------|-------|---------------------|
| **41-01** | Fund transfers: types, API route, Firestore ops, TransferModal, home page integration | Medium-High (new collection, modal, computation changes) |
| **41-02** | Analytics redesign: new chart components, enhanced API data, layout improvements | Medium (recharts, no new collections) |
| **41-03** | Rollover workflow: computation logic, display changes, integration with transfers | Medium (pure computation + UI, but needs careful testing) |
| **41-04** (optional) | Demo mode parity: transfer demo, rollover demo, analytics demo updates | Low (seed data + reducer changes) |

## Sources

### Primary (HIGH confidence)
- Direct codebase analysis: `src/lib/envelopes/types.ts` (223 lines, all Zod schemas and TS types)
- Direct codebase analysis: `src/lib/envelopes/firestore.ts` (992 lines, all CRUD + computation logic)
- Direct codebase analysis: `src/components/envelopes/OverageModal.tsx` (existing fund reallocation pattern)
- Direct codebase analysis: `src/components/envelopes/AnalyticsPage.tsx` + subcomponents
- Direct codebase analysis: `firestore.indexes.json` (existing compound indexes)
- Direct codebase analysis: `package.json` (all dependencies verified)

### Secondary (MEDIUM confidence)
- Existing patterns from Phase 40.1 plans (envelope budget editing, detail page decisions)
- recharts v3.7.0 API (BarChart, PieChart components -- based on training data, consistent with existing AreaChart usage in codebase)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies needed, all patterns established
- Architecture: HIGH - All patterns are direct extensions of existing code (new collection, new API route, new modal, new chart components)
- Pitfalls: HIGH - Identified from direct analysis of existing computation logic and edge cases in week-math
- Rollover computation: MEDIUM - The optimal implementation approach depends on performance characteristics with real data volumes. Query-time computation is correct but may need optimization.

**Research date:** 2026-02-17
**Valid until:** 2026-03-17 (stable -- no external dependency changes expected)
