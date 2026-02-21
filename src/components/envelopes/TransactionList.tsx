"use client";

import { useMemo } from "react";
import { formatCents } from "@/lib/envelopes/format";
import type {
  EnvelopeTransaction,
  EnvelopeTransfer,
} from "@/lib/envelopes/types";
import { TransactionRow } from "./TransactionRow";

type TransactionListProps = {
  transactions: EnvelopeTransaction[];
  transfers?: EnvelopeTransfer[];
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

type ListItem =
  | { kind: "transaction"; data: EnvelopeTransaction; sortDate: string }
  | {
      kind: "transfer";
      data: EnvelopeTransfer;
      envelopeId: string;
      envelopeTitle: string;
      direction: "sent" | "received";
      sortDate: string;
    };

export function TransactionList({
  transactions,
  transfers,
  envelopes,
  onUpdate,
  onDelete,
  isSubmitting,
}: TransactionListProps) {
  const items = useMemo<ListItem[]>(() => {
    const txnItems: ListItem[] = transactions.map((txn) => ({
      kind: "transaction",
      data: txn,
      sortDate: txn.date,
    }));

    const transferItems: ListItem[] = (transfers ?? []).flatMap((transfer) => {
      const toTitle =
        envelopes.find((e) => e.id === transfer.toEnvelopeId)?.title ??
        "Unknown";
      const fromTitle =
        envelopes.find((e) => e.id === transfer.fromEnvelopeId)?.title ??
        "Unknown";

      return [
        {
          kind: "transfer" as const,
          data: transfer,
          envelopeId: transfer.fromEnvelopeId,
          envelopeTitle: toTitle,
          direction: "sent" as const,
          sortDate: transfer.weekStart,
        },
        {
          kind: "transfer" as const,
          data: transfer,
          envelopeId: transfer.toEnvelopeId,
          envelopeTitle: fromTitle,
          direction: "received" as const,
          sortDate: transfer.weekStart,
        },
      ];
    });

    return [...txnItems, ...transferItems].sort((a, b) => {
      const cmp = b.sortDate.localeCompare(a.sortDate);
      if (cmp !== 0) return cmp;
      // Transactions before transfers on same date
      if (a.kind === "transaction" && b.kind === "transfer") return -1;
      if (a.kind === "transfer" && b.kind === "transaction") return 1;
      return 0;
    });
  }, [transactions, transfers, envelopes]);

  if (transactions.length === 0 && (transfers?.length ?? 0) === 0) {
    return (
      <p className="py-8 text-center text-text-secondary">
        No transactions this week.
      </p>
    );
  }

  return (
    <div>
      {/* Header row (desktop only) */}
      <div className="hidden border-b border-border pb-2 sm:grid sm:grid-cols-6 sm:gap-2">
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
        <span className="text-xs font-medium uppercase text-text-tertiary">
          Description
        </span>
        <span className="text-right text-xs font-medium uppercase text-text-tertiary">
          Actions
        </span>
      </div>

      {/* Transaction + Transfer rows */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          if (item.kind === "transaction") {
            return (
              <TransactionRow
                key={item.data.id}
                transaction={item.data}
                envelopes={envelopes}
                onUpdate={onUpdate}
                onDelete={onDelete}
                isSubmitting={isSubmitting}
              />
            );
          }

          return (
            <div
              key={`transfer-${item.data.id}-${item.direction}`}
              className="flex flex-col gap-2 py-3 sm:grid sm:grid-cols-6 sm:gap-2 sm:items-center opacity-75"
            >
              {/* Date */}
              <span className="text-sm text-text-secondary truncate italic">
                {item.sortDate}
              </span>
              {/* Amount - negative for sent (red), positive for received (green) */}
              <span
                className={`text-sm font-semibold italic ${item.direction === "sent" ? "text-red-600" : "text-emerald-600"}`}
              >
                {item.direction === "sent" ? "-" : "+"}
                {formatCents(item.data.amountCents)}
              </span>
              {/* Envelope - show the envelope this side belongs to */}
              <span className="text-sm text-text-primary truncate italic">
                {envelopes.find((e) => e.id === item.envelopeId)?.title ??
                  "Unknown"}
              </span>
              {/* Merchant column - show "Transfer" label */}
              <span className="text-sm text-text-secondary truncate italic">
                Transfer
              </span>
              {/* Description - show direction context */}
              <span className="text-sm text-text-secondary truncate italic">
                {item.direction === "sent"
                  ? `To ${item.envelopeTitle}`
                  : `From ${item.envelopeTitle}`}
              </span>
              {/* Actions - empty for transfers (read-only) */}
              <span />
            </div>
          );
        })}
      </div>
    </div>
  );
}
