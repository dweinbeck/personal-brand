"use client";

import { format, startOfWeek } from "date-fns";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { envelopeFetch } from "@/lib/envelopes/api";
import { useEnvelopes, useTransactions } from "@/lib/envelopes/hooks";
import { getWeekRange } from "@/lib/envelopes/week-math";
import { type OverageContext, OverageModal } from "./OverageModal";
import { TransactionForm } from "./TransactionForm";
import { TransactionList } from "./TransactionList";
import { WeekSelector } from "./WeekSelector";

export function TransactionsPage() {
  const { user } = useAuth();

  const [weekStart, setWeekStart] = useState<Date>(
    startOfWeek(new Date(), { weekStartsOn: 0 }),
  );
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [overageContext, setOverageContext] = useState<OverageContext | null>(
    null,
  );

  // Compute date strings for the API query
  const range = getWeekRange(weekStart);
  const weekStartStr = format(range.start, "yyyy-MM-dd");
  const weekEndStr = format(range.end, "yyyy-MM-dd");

  const {
    data: txData,
    error: txError,
    isLoading: txLoading,
    mutate: mutateTransactions,
  } = useTransactions(weekStartStr, weekEndStr);

  const {
    data: envData,
    error: envError,
    isLoading: envLoading,
    mutate: mutateEnvelopes,
  } = useEnvelopes();

  const getToken = useCallback(async () => {
    const token = await user?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [user]);

  // -- CRUD handlers --

  async function handleCreate(txnData: {
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
      setIsCreating(false);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to create transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleAllocated() {
    mutateEnvelopes();
    mutateTransactions();
  }

  async function handleUpdate(
    transactionId: string,
    data: {
      envelopeId?: string;
      amountCents?: number;
      date?: string;
      merchant?: string;
      description?: string;
    },
  ) {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch(
        `/api/envelopes/transactions/${transactionId}`,
        token,
        {
          method: "PUT",
          body: JSON.stringify(data),
        },
      );
      await mutateTransactions();
      await mutateEnvelopes();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to update transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(transactionId: string) {
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch(
        `/api/envelopes/transactions/${transactionId}`,
        token,
        {
          method: "DELETE",
        },
      );
      await mutateTransactions();
      await mutateEnvelopes();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to delete transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleWeekChange(newWeekStart: Date) {
    setWeekStart(newWeekStart);
    setIsCreating(false);
  }

  // -- Loading state --
  if (txLoading || envLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-text-secondary">
          Loading transactions...
        </p>
      </div>
    );
  }

  // -- Error state --
  if (txError || envError) {
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
              mutateTransactions();
              mutateEnvelopes();
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const transactions = txData?.transactions ?? [];
  const envelopes = (envData?.envelopes ?? []).map((e) => ({
    id: e.id,
    title: e.title,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="mb-6 text-2xl font-bold text-primary font-display">
        Transactions
      </h1>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <WeekSelector weekStart={weekStart} onWeekChange={handleWeekChange} />
      </div>

      {isCreating ? (
        <Card variant="default" className="mb-6">
          <TransactionForm
            envelopes={envelopes}
            onSubmit={handleCreate}
            onCancel={() => setIsCreating(false)}
            isSubmitting={isSubmitting}
          />
        </Card>
      ) : (
        <div className="mb-6">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreating(true)}
          >
            Add Transaction
          </Button>
        </div>
      )}

      <TransactionList
        transactions={transactions}
        envelopes={envelopes}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
      />

      <OverageModal
        context={overageContext}
        onClose={() => setOverageContext(null)}
        onAllocated={handleAllocated}
        getToken={getToken}
      />
    </div>
  );
}
