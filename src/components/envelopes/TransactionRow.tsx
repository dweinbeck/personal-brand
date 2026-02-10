"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
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
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:gap-4">
      {/* Date */}
      <span className="min-w-[90px] text-sm text-text-secondary">
        {transaction.date}
      </span>

      {/* Amount */}
      <span className="min-w-[80px] text-sm font-semibold text-text-primary">
        {formatCents(transaction.amountCents)}
      </span>

      {/* Envelope */}
      <span className="min-w-[100px] text-sm text-text-primary">
        {envelopeTitle}
      </span>

      {/* Merchant */}
      <span className="min-w-[100px] text-sm text-text-secondary">
        {transaction.merchant || "--"}
      </span>

      {/* Description */}
      <span className="flex-1 truncate text-sm text-text-secondary">
        {transaction.description || "--"}
      </span>

      {/* Actions */}
      <div className="flex gap-1 sm:ml-auto">
        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(transaction.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
