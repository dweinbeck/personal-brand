"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { envelopeFetch } from "@/lib/envelopes/api";
import { useEnvelopes } from "@/lib/envelopes/hooks";
import type { EnvelopeWithStatus } from "@/lib/envelopes/types";
import { CreateEnvelopeCard } from "./CreateEnvelopeCard";
import { EnvelopeCard } from "./EnvelopeCard";
import { EnvelopeCardGrid } from "./EnvelopeCardGrid";
import { EnvelopeForm } from "./EnvelopeForm";
import { GreetingBanner } from "./GreetingBanner";
import { type OverageContext, OverageModal } from "./OverageModal";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { SavingsBanner } from "./SavingsBanner";
import { TransactionForm } from "./TransactionForm";

export function EnvelopesHomePage() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useEnvelopes();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [overageContext, setOverageContext] = useState<OverageContext | null>(
    null,
  );

  const isReadOnly = data?.billing?.mode === "readonly";

  const getToken = useCallback(async () => {
    const token = await user?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [user]);

  // -- CRUD handlers --

  async function handleCreate(formData: {
    title: string;
    weeklyBudgetCents: number;
  }) {
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch("/api/envelopes", token, {
        method: "POST",
        body: JSON.stringify(formData),
      });
      await mutate();
      setIsCreating(false);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to create envelope.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleUpdate(
    envelopeId: string,
    formData: { title: string; weeklyBudgetCents: number; rollover?: boolean },
  ) {
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch(`/api/envelopes/${envelopeId}`, token, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      await mutate();
      setEditingId(null);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to update envelope.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(envelopeId: string) {
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch(`/api/envelopes/${envelopeId}`, token, {
        method: "DELETE",
      });
      await mutate();
      setDeletingId(null);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to delete envelope.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleAddTransaction(txnData: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  }) {
    if (isReadOnly) return;
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
      const freshData = await mutate();

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
    mutate();
  }

  // -- Loading state --
  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <p className="text-center text-text-secondary">
          Loading your envelopes...
        </p>
      </div>
    );
  }

  // -- Error state --
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <p className="text-text-secondary mb-4">
            Something went wrong. Please try again.
          </p>
          <Button variant="secondary" size="sm" onClick={() => mutate()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // -- Data loaded --
  const envelopes = [...(data?.envelopes ?? [])].sort(
    (a, b) => b.weeklyBudgetCents - a.weeklyBudgetCents,
  );
  const onTrackCount = envelopes.filter(
    (e: EnvelopeWithStatus) => e.status === "On Track",
  ).length;
  const totalSpentCents = envelopes.reduce((sum, e) => sum + e.spentCents, 0);
  const totalRemainingCents = envelopes.reduce(
    (sum, e) => sum + e.remainingCents,
    0,
  );
  const isEmpty = envelopes.length === 0 && !isCreating;

  const envelopeOptions = envelopes.map((e) => ({
    id: e.id,
    title: e.title,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {isReadOnly && <ReadOnlyBanner />}
      <GreetingBanner
        onTrackCount={onTrackCount}
        totalCount={envelopes.length}
        totalSpentCents={totalSpentCents}
        totalRemainingCents={totalRemainingCents}
      />

      {data && data.cumulativeSavingsCents > 0 && (
        <SavingsBanner savingsCents={data.cumulativeSavingsCents} />
      )}

      {data && (
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-primary">
            Week of {data.weekLabel}
          </h2>
          {!isReadOnly && (
            <Button
              variant={isEditing ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setIsEditing(!isEditing);
                setEditingId(null);
                setDeletingId(null);
              }}
            >
              {isEditing ? "Done Editing" : "Edit Cards"}
            </Button>
          )}
        </div>
      )}

      {/* Full-width Add Transaction button */}
      {!isReadOnly && !isEditing && envelopes.length > 0 && (
        <div className="mb-4">
          {isAddingTransaction ? (
            <Card variant="default">
              <TransactionForm
                envelopes={envelopeOptions}
                onSubmit={handleAddTransaction}
                onCancel={() => setIsAddingTransaction(false)}
                isSubmitting={isSubmitting}
              />
            </Card>
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

      {isEmpty && (
        <div className="mb-6 text-center">
          <p className="text-text-secondary mb-2">
            No envelopes yet. Create your first one to start budgeting!
          </p>
        </div>
      )}

      <EnvelopeCardGrid>
        {envelopes.map((env: EnvelopeWithStatus) => (
          <div key={env.id}>
            {editingId === env.id ? (
              <Card variant="default" className="min-h-[180px]">
                <EnvelopeForm
                  mode="edit"
                  initialValues={{
                    title: env.title,
                    weeklyBudgetCents: env.weeklyBudgetCents,
                    rollover: env.rollover,
                  }}
                  onSubmit={(formData) => handleUpdate(env.id, formData)}
                  onCancel={() => setEditingId(null)}
                  isSubmitting={isSubmitting}
                />
              </Card>
            ) : (
              <EnvelopeCard
                envelope={env}
                isEditMode={isEditing}
                isDeleting={deletingId === env.id}
                onDelete={() => setDeletingId(env.id)}
                onConfirmDelete={() => handleDelete(env.id)}
                onCancelDelete={() => setDeletingId(null)}
              />
            )}
          </div>
        ))}

        {!isReadOnly &&
          isEditing &&
          (isCreating ? (
            <Card variant="default" className="min-h-[180px]">
              <EnvelopeForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setIsCreating(false)}
                isSubmitting={isSubmitting}
              />
            </Card>
          ) : (
            <CreateEnvelopeCard onClick={() => setIsCreating(true)} />
          ))}
      </EnvelopeCardGrid>

      <OverageModal
        context={overageContext}
        onClose={() => setOverageContext(null)}
        onAllocated={handleAllocated}
        getToken={getToken}
      />
    </div>
  );
}
