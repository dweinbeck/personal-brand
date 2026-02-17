"use client";

import clsx from "clsx";
import { format, startOfWeek } from "date-fns";
import Link from "next/link";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { envelopeFetch } from "@/lib/envelopes/api";
import { formatCents } from "@/lib/envelopes/format";
import {
  useEnvelopes,
  useTransactions,
  useTransfers,
} from "@/lib/envelopes/hooks";
import { getWeekRange } from "@/lib/envelopes/week-math";
import { InlineTransactionForm } from "./InlineTransactionForm";
import { type OverageContext, OverageModal } from "./OverageModal";
import { StatusBadge } from "./StatusBadge";

type EnvelopeDetailPageProps = {
  envelopeId: string;
};

export function EnvelopeDetailPage({ envelopeId }: EnvelopeDetailPageProps) {
  const { user } = useAuth();

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 0 });
  const range = getWeekRange(weekStart);
  const weekStartStr = format(range.start, "yyyy-MM-dd");
  const weekEndStr = format(range.end, "yyyy-MM-dd");

  const {
    data: envData,
    error: envError,
    isLoading: envLoading,
    mutate: mutateEnvelopes,
  } = useEnvelopes();

  const {
    data: txData,
    error: txError,
    isLoading: txLoading,
    mutate: mutateTransactions,
  } = useTransactions(weekStartStr, weekEndStr);

  const { data: transferData } = useTransfers(weekStartStr, weekEndStr);

  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overageContext, setOverageContext] = useState<OverageContext | null>(
    null,
  );

  const getToken = useCallback(async () => {
    const token = await user?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [user]);

  async function handleAddTransaction(txnData: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  }) {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const createdTxn = await envelopeFetch<{ id: string }>(
        "/api/envelopes/transactions",
        token,
        {
          method: "POST",
          body: JSON.stringify(txnData),
        },
      );
      await mutateTransactions();
      const freshData = await mutateEnvelopes();

      // Check if the target envelope is now over budget
      if (freshData) {
        const targetEnvelope = freshData.envelopes.find(
          (e) => e.id === txnData.envelopeId,
        );
        if (targetEnvelope && targetEnvelope.remainingCents < 0) {
          setOverageContext({
            transactionId: createdTxn.id,
            envelopeId: targetEnvelope.id,
            envelopeTitle: targetEnvelope.title,
            overageAmountCents: Math.abs(targetEnvelope.remainingCents),
            donorEnvelopes: freshData.envelopes
              .filter((e) => e.id !== targetEnvelope.id && e.remainingCents > 0)
              .map((e) => ({
                id: e.id,
                title: e.title,
                remainingCents: e.remainingCents,
              })),
          });
          return;
        }
      }
      setIsAddingTransaction(false);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to add transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAllocated() {
    mutateEnvelopes();
    mutateTransactions();
  }

  // Loading state
  if (envLoading || txLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-text-secondary">Loading envelope...</p>
      </div>
    );
  }

  // Error state
  if (envError || txError) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-text-secondary mb-4">
            Something went wrong. Please try again.
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              mutateEnvelopes();
              mutateTransactions();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Find the specific envelope
  const envelope = envData?.envelopes.find((e) => e.id === envelopeId);

  if (!envelope) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-text-secondary mb-4">Envelope not found.</p>
          <Link
            href="/envelopes"
            className="text-sm text-primary hover:underline"
          >
            Back to Envelopes
          </Link>
        </div>
      </div>
    );
  }

  // Filter transactions for this envelope
  const transactions = (txData?.transactions ?? []).filter(
    (txn) => txn.envelopeId === envelopeId,
  );

  // Filter transfers involving this envelope
  const filteredTransfers = (transferData?.transfers ?? []).filter(
    (t) => t.fromEnvelopeId === envelopeId || t.toEnvelopeId === envelopeId,
  );

  const envelopeTitle = (id: string) =>
    envData?.envelopes.find((e) => e.id === id)?.title ?? "Unknown";

  const isReadOnly = envData?.billing?.mode === "readonly";

  // Date constraints for the inline form
  const todayStr = format(today, "yyyy-MM-dd");

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/envelopes"
        className="mb-6 inline-flex items-center gap-1 text-sm text-text-secondary hover:text-primary"
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
            d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08L5.612 9.25H16.25A.75.75 0 0 1 17 10Z"
            clipRule="evenodd"
          />
        </svg>
        Back to Envelopes
      </Link>

      {/* Header: title + status */}
      <div className="mb-4 flex items-center gap-3">
        <h1 className="font-display text-2xl font-bold text-primary">
          {envelope.title}
        </h1>
        <StatusBadge status={envelope.status} />
      </div>

      {/* Budget summary */}
      <div className="mb-6 flex flex-wrap items-baseline gap-x-6 gap-y-1">
        <p className="text-text-primary">
          <span className="text-xl font-bold">
            {formatCents(envelope.remainingCents)}
          </span>{" "}
          <span className="text-sm text-text-secondary">
            of {formatCents(envelope.weeklyBudgetCents)} budget
          </span>
        </p>
        <p className="text-sm text-text-secondary">
          {formatCents(envelope.spentCents)} spent this week
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-border mb-6" />

      {/* Add Transaction */}
      {!isReadOnly && (
        <div className="mb-6">
          {isAddingTransaction ? (
            <InlineTransactionForm
              envelopeId={envelopeId}
              defaultDate={todayStr}
              minDate={weekStartStr}
              maxDate={weekEndStr}
              onSubmit={handleAddTransaction}
              onCancel={() => setIsAddingTransaction(false)}
              isSubmitting={isSubmitting}
            />
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsAddingTransaction(true)}
              className="w-full"
            >
              Add Transaction
            </Button>
          )}
        </div>
      )}

      {/* Divider */}
      {transactions.length > 0 && (
        <div className="border-t border-border mb-6" />
      )}

      {/* Transaction list */}
      {transactions.length === 0 ? (
        <p className="py-8 text-center text-text-secondary">
          No transactions this week for this envelope.
        </p>
      ) : (
        <div>
          {/* Header row (desktop only) */}
          <div className="hidden border-b border-border pb-2 sm:grid sm:grid-cols-4 sm:gap-2">
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Date
            </span>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Amount
            </span>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Merchant
            </span>
            <span className="text-xs font-medium uppercase text-text-tertiary">
              Description
            </span>
          </div>

          {/* Transaction rows */}
          <div className="divide-y divide-border">
            {transactions.map((txn) => (
              <div
                key={txn.id}
                className="flex flex-col gap-1 py-3 sm:grid sm:grid-cols-4 sm:gap-2 sm:items-center"
              >
                <span className="text-sm text-text-secondary truncate">
                  {txn.date}
                </span>
                <span className="text-sm font-semibold text-text-primary">
                  {formatCents(txn.amountCents)}
                </span>
                <span className="text-sm text-text-secondary truncate">
                  {txn.merchant || "--"}
                </span>
                <span className="text-sm text-text-secondary truncate">
                  {txn.description || "--"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transfers section */}
      {filteredTransfers.length > 0 && (
        <>
          <div className="border-t border-border mb-6 mt-6" />
          <h2 className="font-display text-lg font-semibold text-primary mb-4">
            Transfers This Week
          </h2>
          <div className="divide-y divide-border">
            {filteredTransfers.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <span className="text-sm text-text-primary">
                    {t.fromEnvelopeId === envelopeId
                      ? `Sent to ${envelopeTitle(t.toEnvelopeId)}`
                      : `Received from ${envelopeTitle(t.fromEnvelopeId)}`}
                  </span>
                  {t.note && (
                    <p className="text-xs text-text-secondary">{t.note}</p>
                  )}
                </div>
                <span
                  className={clsx(
                    "text-sm font-semibold",
                    t.fromEnvelopeId === envelopeId
                      ? "text-red-600"
                      : "text-sage",
                  )}
                >
                  {t.fromEnvelopeId === envelopeId ? "-" : "+"}
                  {formatCents(t.amountCents)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      <OverageModal
        context={overageContext}
        onClose={() => setOverageContext(null)}
        onAllocated={handleAllocated}
        getToken={getToken}
      />
    </div>
  );
}
