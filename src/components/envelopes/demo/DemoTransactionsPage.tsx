"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";
import { TransactionForm } from "../TransactionForm";
import { useDemo } from "./DemoProvider";

export function DemoTransactionsPage() {
  const { state, dispatch } = useDemo();
  const [isCreating, setIsCreating] = useState(false);

  const envelopeOptions = state.envelopes.map((e) => ({
    id: e.id,
    title: e.title,
  }));

  // Sort transactions by date descending
  const transactions = [...state.transactions].sort((a, b) =>
    b.date.localeCompare(a.date),
  );

  function handleCreate(txnData: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  }) {
    dispatch({ type: "ADD_TRANSACTION", payload: txnData });
    setIsCreating(false);
  }

  function handleDelete(id: string) {
    dispatch({ type: "DELETE_TRANSACTION", payload: { id } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-primary">
          Demo Transactions
        </h1>
        {!isCreating && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            Add Transaction
          </Button>
        )}
      </div>

      {isCreating && (
        <Card variant="default" className="mb-6">
          <TransactionForm
            envelopes={envelopeOptions}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isSubmitting={false}
          />
        </Card>
      )}

      {transactions.length === 0 ? (
        <p className="py-8 text-center text-text-secondary">
          No transactions yet. Add one to get started!
        </p>
      ) : (
        <div>
          {/* Header row (desktop only) */}
          <div className="hidden border-b border-border pb-2 sm:grid sm:grid-cols-5 sm:gap-2">
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Date
            </span>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Amount
            </span>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Envelope
            </span>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Merchant
            </span>
            <span className="text-right text-xs font-medium uppercase text-text-tertiary">
              Actions
            </span>
          </div>

          <div className="divide-y divide-border">
            {transactions.map((txn) => {
              const envelopeTitle =
                state.envelopes.find((e) => e.id === txn.envelopeId)?.title ??
                "Unknown";

              return (
                <div
                  key={txn.id}
                  className="flex flex-col gap-2 py-3 sm:grid sm:grid-cols-5 sm:gap-2 sm:items-center"
                >
                  <span className="text-sm text-text-secondary truncate">
                    {txn.date}
                  </span>
                  <span className="text-sm font-semibold text-text-primary">
                    {formatCents(txn.amountCents)}
                  </span>
                  <span className="text-sm text-text-primary truncate">
                    {envelopeTitle}
                  </span>
                  <span className="text-sm text-text-secondary truncate">
                    {txn.merchant || "--"}
                  </span>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleDelete(txn.id)}
                      className="rounded p-1 text-text-tertiary hover:text-red-600 hover:bg-red-50"
                      aria-label="Delete transaction"
                    >
                      <svg
                        aria-hidden="true"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
