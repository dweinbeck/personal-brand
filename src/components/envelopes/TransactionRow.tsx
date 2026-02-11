"use client";

import { useState } from "react";
import { formatCents } from "@/lib/envelopes/format";
import type { EnvelopeTransaction } from "@/lib/envelopes/types";
import { TransactionForm } from "./TransactionForm";

type TransactionRowProps = {
  transaction: EnvelopeTransaction;
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

export function TransactionRow({
  transaction,
  envelopes,
  onUpdate,
  onDelete,
  isSubmitting,
}: TransactionRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  const envelopeTitle =
    envelopes.find((e) => e.id === transaction.envelopeId)?.title ?? "Unknown";

  if (isEditing) {
    return (
      <div className="py-3">
        <TransactionForm
          envelopes={envelopes}
          initialValues={{
            envelopeId: transaction.envelopeId,
            amountCents: transaction.amountCents,
            date: transaction.date,
            merchant: transaction.merchant,
            description: transaction.description,
          }}
          onSubmit={(data) => {
            onUpdate(transaction.id, data);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 py-3 sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center">
      {/* Date */}
      <span className="text-sm text-text-secondary truncate">
        {transaction.date}
      </span>

      {/* Amount */}
      <span className="text-sm font-semibold text-text-primary">
        {formatCents(transaction.amountCents)}
      </span>

      {/* Envelope */}
      <span className="text-sm text-text-primary truncate">
        {envelopeTitle}
      </span>

      {/* Merchant */}
      <span className="text-sm text-text-secondary truncate">
        {transaction.merchant || "--"}
      </span>

      {/* Description */}
      <span className="text-sm text-text-secondary truncate">
        {transaction.description || "--"}
      </span>

      {/* Actions */}
      <div className="flex gap-1 justify-end">
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="rounded p-1 text-text-tertiary hover:text-primary hover:bg-primary/5"
          aria-label="Edit transaction"
        >
          {/* Pencil icon */}
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="m5.433 13.917 1.262-3.155A4 4 0 0 1 7.58 9.42l6.92-6.918a2.121 2.121 0 0 1 3 3l-6.92 6.918c-.383.383-.84.685-1.343.886l-3.154 1.262a.5.5 0 0 1-.65-.65Z" />
            <path d="M3.5 5.75c0-.69.56-1.25 1.25-1.25H10A.75.75 0 0 0 10 3H4.75A2.75 2.75 0 0 0 2 5.75v9.5A2.75 2.75 0 0 0 4.75 18h9.5A2.75 2.75 0 0 0 17 15.25V10a.75.75 0 0 0-1.5 0v5.25c0 .69-.56 1.25-1.25 1.25h-9.5c-.69 0-1.25-.56-1.25-1.25v-9.5Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(transaction.id)}
          className="rounded p-1 text-text-tertiary hover:text-red-600 hover:bg-red-50"
          aria-label="Delete transaction"
        >
          {/* Trash icon */}
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
}
