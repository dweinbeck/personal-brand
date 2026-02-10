"use client";

import type { EnvelopeTransaction } from "@/lib/envelopes/types";
import { TransactionRow } from "./TransactionRow";

type TransactionListProps = {
  transactions: EnvelopeTransaction[];
  envelopes: { id: string; title: string }[];
  onUpdate: (
    transactionId: string,
    data: {
      envelopeId?: string;
      amountCents?: number;
      date?: string;
      merchant?: string;
      description?: string;
    },
  ) => void;
  onDelete: (transactionId: string) => void;
  isSubmitting: boolean;
};

export function TransactionList({
  transactions,
  envelopes,
  onUpdate,
  onDelete,
  isSubmitting,
}: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <p className="py-8 text-center text-text-secondary">
        No transactions this week.
      </p>
    );
  }

  return (
    <div>
      {/* Header row (desktop only) */}
      <div className="hidden border-b border-border pb-2 sm:flex sm:items-center sm:gap-4">
        <span className="min-w-[90px] text-xs font-medium uppercase text-text-tertiary">
          Date
        </span>
        <span className="min-w-[80px] text-xs font-medium uppercase text-text-tertiary">
          Amount
        </span>
        <span className="min-w-[100px] text-xs font-medium uppercase text-text-tertiary">
          Envelope
        </span>
        <span className="min-w-[100px] text-xs font-medium uppercase text-text-tertiary">
          Merchant
        </span>
        <span className="flex-1 text-xs font-medium uppercase text-text-tertiary">
          Description
        </span>
        <span className="ml-auto text-xs font-medium uppercase text-text-tertiary">
          Actions
        </span>
      </div>

      {/* Transaction rows */}
      <div className="divide-y divide-border">
        {transactions.map((txn) => (
          <TransactionRow
            key={txn.id}
            transaction={txn}
            envelopes={envelopes}
            onUpdate={onUpdate}
            onDelete={onDelete}
            isSubmitting={isSubmitting}
          />
        ))}
      </div>
    </div>
  );
}
