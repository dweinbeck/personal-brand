---
phase: quick-12
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/envelopes/TransactionsPage.tsx
  - src/components/envelopes/TransactionList.tsx
autonomous: true
requirements: [QUICK-12]

must_haves:
  truths:
    - "Global transactions page shows transfer rows interleaved with transaction rows by date"
    - "Each transfer appears as two rows: a debit row on the source envelope and a credit row on the destination envelope"
    - "Transfer rows are visually distinct from transaction rows (italic + 'Transfer' label)"
    - "Transfer rows are read-only (no edit/delete actions)"
    - "Transfers and transactions for a given week net to the correct totals per envelope"
  artifacts:
    - path: "src/components/envelopes/TransactionsPage.tsx"
      provides: "Fetches transfers via useTransfers hook and passes to TransactionList"
      contains: "useTransfers"
    - path: "src/components/envelopes/TransactionList.tsx"
      provides: "Renders transfer rows interleaved with transaction rows sorted by date"
      contains: "TransferRow"
  key_links:
    - from: "src/components/envelopes/TransactionsPage.tsx"
      to: "src/lib/envelopes/hooks.ts"
      via: "useTransfers hook import"
      pattern: "useTransfers"
    - from: "src/components/envelopes/TransactionList.tsx"
      to: "src/lib/envelopes/types.ts"
      via: "EnvelopeTransfer type import"
      pattern: "EnvelopeTransfer"
---

<objective>
Show envelope transfers as interleaved rows in the global Transactions page so that transfers between envelopes are visible and add up to $0.00 net.

Purpose: Users currently cannot see transfers in the global transaction view, making it impossible to reconcile envelope balances. Each transfer should appear as two rows (debit from source, credit to destination) so the math is transparent.

Output: Updated TransactionsPage and TransactionList components that fetch and display transfer rows alongside regular transactions.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@src/components/envelopes/TransactionsPage.tsx
@src/components/envelopes/TransactionList.tsx
@src/components/envelopes/TransactionRow.tsx
@src/lib/envelopes/hooks.ts
@src/lib/envelopes/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fetch transfers in TransactionsPage and pass to TransactionList</name>
  <files>src/components/envelopes/TransactionsPage.tsx</files>
  <action>
    In `TransactionsPage.tsx`:

    1. Add `useTransfers` to the import from `@/lib/envelopes/hooks`:
       ```
       import { useEnvelopes, useTransactions, useTransfers } from "@/lib/envelopes/hooks";
       ```

    2. Call `useTransfers` with the same week range parameters, right after the `useEnvelopes()` call:
       ```
       const { data: transferData, error: transferError, isLoading: transferLoading } = useTransfers(weekStartStr, weekEndStr);
       ```

    3. Add `transferLoading` to the loading check: `if (txLoading || envLoading || transferLoading)`

    4. Add `transferError` to the error check: `if (txError || envError || transferError)`

    5. Extract transfers: `const transfers = transferData?.transfers ?? [];`

    6. Pass transfers to TransactionList as a new prop:
       ```
       <TransactionList
         transactions={transactions}
         transfers={transfers}
         envelopes={envelopes}
         onUpdate={handleUpdate}
         onDelete={handleDelete}
         isSubmitting={isSubmitting}
       />
       ```
  </action>
  <verify>TypeScript compiles without errors (the transfers prop will be added to TransactionList in Task 2, so verify after both tasks complete): `npx tsc --noEmit`</verify>
  <done>TransactionsPage fetches transfers using useTransfers hook and passes them to TransactionList</done>
</task>

<task type="auto">
  <name>Task 2: Render transfer rows interleaved with transactions in TransactionList</name>
  <files>src/components/envelopes/TransactionList.tsx</files>
  <action>
    In `TransactionList.tsx`:

    1. Import `EnvelopeTransfer` type:
       ```
       import type { EnvelopeTransaction, EnvelopeTransfer } from "@/lib/envelopes/types";
       ```

    2. Import `formatCents` from `@/lib/envelopes/format` (needed for transfer amount display).

    3. Add optional `transfers` prop to the props type:
       ```
       transfers?: EnvelopeTransfer[];
       ```

    4. Define a discriminated union type for the combined list items:
       ```
       type ListItem =
         | { kind: "transaction"; data: EnvelopeTransaction; sortDate: string }
         | { kind: "transfer"; data: EnvelopeTransfer; envelopeId: string; envelopeTitle: string; direction: "sent" | "received"; sortDate: string };
       ```

    5. Inside the component, build a merged + sorted list:
       - Map each transaction to a `ListItem` with `kind: "transaction"` and `sortDate: data.date`.
       - For each transfer, create TWO `ListItem` entries:
         - One with `direction: "sent"`, `envelopeId: transfer.fromEnvelopeId`, `envelopeTitle` resolved from the envelopes array for the `toEnvelopeId` (this is the "sent to X" label).
         - One with `direction: "received"`, `envelopeId: transfer.toEnvelopeId`, `envelopeTitle` resolved from the envelopes array for the `fromEnvelopeId` (this is the "received from Y" label).
         - Both use `sortDate: transfer.weekStart` (transfers don't have a `date` field, use `weekStart`).
       - Sort combined array by `sortDate` descending (newest first), with transactions before transfers on same date.

    6. Update the empty state check: show "No transactions this week." only when both `transactions.length === 0` AND `(transfers?.length ?? 0) === 0`.

    7. Render the combined list. For `kind: "transaction"` items, render the existing `TransactionRow`. For `kind: "transfer"` items, render an inline transfer row directly in the map (no separate component needed since it's simple and read-only):
       ```
       <div key={`transfer-${item.data.id}-${item.direction}`} className="flex flex-col gap-2 py-3 sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center opacity-75">
         {/* Date */}
         <span className="text-sm text-text-secondary truncate italic">
           {item.sortDate}
         </span>
         {/* Amount - negative for sent (red), positive for received (green) */}
         <span className={`text-sm font-semibold italic ${item.direction === "sent" ? "text-red-600" : "text-emerald-600"}`}>
           {item.direction === "sent" ? "-" : "+"}{formatCents(item.data.amountCents)}
         </span>
         {/* Envelope - show the envelope this side belongs to */}
         <span className="text-sm text-text-primary truncate italic">
           {envelopes.find(e => e.id === item.envelopeId)?.title ?? "Unknown"}
         </span>
         {/* Merchant column - show "Transfer" label */}
         <span className="text-sm text-text-secondary truncate italic">
           Transfer
         </span>
         {/* Description - show direction context */}
         <span className="text-sm text-text-secondary truncate italic">
           {item.direction === "sent" ? `To ${item.envelopeTitle}` : `From ${item.envelopeTitle}`}
         </span>
         {/* Actions - empty for transfers (read-only) */}
         <span />
       </div>
       ```

    8. The italic text + `opacity-75` + "Transfer" label in the merchant column visually distinguishes transfer rows from regular transaction rows. The red/green color coding makes debit/credit immediately clear.
  </action>
  <verify>
    Run full quality gates:
    - `npx tsc --noEmit` (types compile)
    - `npm run lint` (no lint errors)
    - `npm run build` (production build succeeds)
    - `npm test` (existing tests pass)
  </verify>
  <done>
    Transfer rows appear interleaved with transaction rows in the global Transactions page. Each transfer shows as two rows (one debit in red, one credit in green). Transfer rows show "Transfer" in the merchant column, direction context ("To X" / "From Y") in the description column, are visually distinct (italic + reduced opacity), and have no edit/delete actions.
  </done>
</task>

</tasks>

<verification>
1. `npm run build` passes with zero errors
2. `npm run lint` passes with zero errors
3. `npm test` passes (no regressions)
4. Manual verification: navigate to the global Transactions page, confirm transfer rows appear interleaved with regular transactions, show correct debit/credit amounts, and display source/destination envelope names
</verification>

<success_criteria>
- Global Transactions page fetches and displays envelope transfers alongside regular transactions
- Each transfer appears as two rows: a negative (red) entry on the source envelope and a positive (green) entry on the destination envelope
- Transfer rows are visually distinct (italic, reduced opacity, "Transfer" label)
- Transfer rows are read-only (no edit/delete buttons)
- All quality gates pass (build, lint, test)
</success_criteria>

<output>
After completion, create `.planning/quick/12-show-transfer-source-destination-in-enve/12-SUMMARY.md`
</output>
