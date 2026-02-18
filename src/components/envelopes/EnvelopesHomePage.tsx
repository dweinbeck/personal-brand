"use client";

import { format } from "date-fns";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext";
import { envelopeFetch } from "@/lib/envelopes/api";
import {
  useEnvelopeProfile,
  useEnvelopes,
  useIncome,
} from "@/lib/envelopes/hooks";
import type {
  EnvelopeProfileInput,
  EnvelopeWithStatus,
} from "@/lib/envelopes/types";
import { getWeekRange } from "@/lib/envelopes/week-math";
import { CreateEnvelopeCard } from "./CreateEnvelopeCard";
import { EnvelopeCard } from "./EnvelopeCard";
import { EnvelopeCardGrid } from "./EnvelopeCardGrid";
import { EnvelopeForm } from "./EnvelopeForm";
import { GreetingBanner } from "./GreetingBanner";
import { IncomeBanner } from "./IncomeBanner";
import { IncomeEntryForm } from "./IncomeEntryForm";
import { KpiBox } from "./KpiBox";
import { KpiWizardModal } from "./KpiWizardModal";
import { type OverageContext, OverageModal } from "./OverageModal";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { SavingsBanner } from "./SavingsBanner";
import { TransactionForm } from "./TransactionForm";
import { TransferModal } from "./TransferModal";

export function EnvelopesHomePage() {
  const { user } = useAuth();
  const { data, error, isLoading, mutate } = useEnvelopes();
  const {
    profile,
    isProfileMissing,
    isLoading: profileLoading,
    mutate: mutateProfile,
  } = useEnvelopeProfile();

  // Compute week range for income hook
  const today = new Date();
  const { start, end } = getWeekRange(today);
  const weekStartStr = format(start, "yyyy-MM-dd");
  const weekEndStr = format(end, "yyyy-MM-dd");
  const {
    entries: incomeEntries,
    totalCents: incomeTotalCents,
    mutate: mutateIncome,
  } = useIncome(weekStartStr, weekEndStr);

  const [wizardOpen, setWizardOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [overageContext, setOverageContext] = useState<OverageContext | null>(
    null,
  );

  const isReadOnly = data?.billing?.mode === "readonly";

  const getToken = useCallback(async () => {
    const token = await user?.getIdToken();
    if (!token) throw new Error("Not authenticated");
    return token;
  }, [user]);

  // -- KPI profile save --
  async function handleSaveProfile(profileData: EnvelopeProfileInput) {
    const token = await user?.getIdToken();
    if (!token) return;
    await envelopeFetch("/api/envelopes/profile", token, {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
    await mutateProfile();
    setWizardOpen(false);
  }

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

  async function handleAddIncome(incomeData: {
    amountCents: number;
    description: string;
    date: string;
  }) {
    if (isReadOnly) return;
    setIsSubmitting(true);
    try {
      const token = await getToken();
      await envelopeFetch("/api/envelopes/income", token, {
        method: "POST",
        body: JSON.stringify(incomeData),
      });
      await mutateIncome();
      setIsAddingIncome(false);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to add income.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteIncome(entryId: string) {
    if (isReadOnly) return;
    try {
      const token = await getToken();
      await envelopeFetch(`/api/envelopes/income/${entryId}`, token, {
        method: "DELETE",
      });
      await mutateIncome();
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Failed to delete income entry.",
      );
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
      {/* 1. Read-only banner (conditional) */}
      {isReadOnly && <ReadOnlyBanner />}

      {/* 2. Greeting banner (personal greeting first) */}
      <GreetingBanner
        onTrackCount={onTrackCount}
        totalCount={envelopes.length}
        totalSpentCents={totalSpentCents}
        totalRemainingCents={totalRemainingCents}
      />

      {/* 3. Week header + action buttons */}
      {data && (
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-primary">
            Week of {data.weekLabel}
          </h2>
          {!isReadOnly && envelopes.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant={isEditing ? "primary" : "secondary"}
                size="sm"
                onClick={() => {
                  setIsEditing(!isEditing);
                  setDeletingId(null);
                  setIsAddingTransaction(false);
                  setIsAddingIncome(false);
                }}
              >
                {isEditing ? "Done Editing" : "Edit Envelopes"}
              </Button>
              {!isEditing && envelopes.length >= 2 && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setTransferOpen(true)}
                >
                  Transfer Funds
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setIsAddingIncome(!isAddingIncome);
                    setIsAddingTransaction(false);
                  }}
                >
                  {isAddingIncome ? "Cancel Income" : "Log Income"}
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setIsAddingTransaction(!isAddingTransaction);
                    setIsAddingIncome(false);
                  }}
                >
                  {isAddingTransaction ? "Cancel" : "Add Transaction"}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Inline Income Entry form */}
      {!isReadOnly && !isEditing && isAddingIncome && (
        <div className="mb-4">
          <Card variant="default">
            <IncomeEntryForm
              onSubmit={handleAddIncome}
              onCancel={() => setIsAddingIncome(false)}
              isSubmitting={isSubmitting}
            />
          </Card>
        </div>
      )}

      {/* 5. Inline Add Transaction form */}
      {!isReadOnly &&
        !isEditing &&
        isAddingTransaction &&
        envelopes.length > 0 && (
          <div className="mb-4">
            <Card variant="default">
              <TransactionForm
                envelopes={envelopeOptions}
                onSubmit={handleAddTransaction}
                onCancel={() => setIsAddingTransaction(false)}
                isSubmitting={isSubmitting}
              />
            </Card>
          </div>
        )}

      {/* 6. Empty state */}
      {isEmpty && (
        <div className="mb-6 text-center">
          <p className="text-text-secondary mb-2">
            No envelopes yet. Create your first one to start budgeting!
          </p>
        </div>
      )}

      {/* 7. Envelope card grid */}
      <EnvelopeCardGrid>
        {envelopes.map((env: EnvelopeWithStatus) => (
          <div key={env.id}>
            <EnvelopeCard
              envelope={env}
              isEditMode={isEditing}
              isDeleting={deletingId === env.id}
              onEdit={() => {}}
              onDelete={() => setDeletingId(env.id)}
              onConfirmDelete={() => handleDelete(env.id)}
              onCancelDelete={() => setDeletingId(null)}
              onBudgetChange={(newCents) =>
                handleUpdate(env.id, {
                  title: env.title,
                  weeklyBudgetCents: newCents,
                  rollover: env.rollover,
                })
              }
            />
          </div>
        ))}

        {!isReadOnly &&
          isEditing &&
          (isProfileMissing ? (
            <Card variant="default" className="min-h-[180px]">
              <div className="flex flex-col items-center justify-center h-full py-6 text-center">
                <p className="text-sm text-text-secondary mb-3">
                  Complete your budget setup to start creating envelopes
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setWizardOpen(true)}
                >
                  Set Up Budget
                </Button>
              </div>
            </Card>
          ) : isCreating ? (
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

      {/* 8. Income banner */}
      {incomeEntries.length > 0 && (
        <div className="mt-6">
          <IncomeBanner
            totalCents={incomeTotalCents}
            entries={incomeEntries.map((e) => ({
              id: e.id,
              amountCents: e.amountCents,
              description: e.description,
            }))}
            onDelete={isReadOnly ? undefined : handleDeleteIncome}
          />
        </div>
      )}

      {/* 9. Savings banner */}
      {data && data.cumulativeSavingsCents > 0 && (
        <div className="mt-4">
          <SavingsBanner savingsCents={data.cumulativeSavingsCents} />
        </div>
      )}

      {/* 10. KPI metrics (supplementary, at bottom) */}
      <div className="mt-6">
        <KpiBox
          profile={profile}
          isLoading={profileLoading}
          onEdit={() => setWizardOpen(true)}
        />
      </div>

      {/* Modals */}
      <OverageModal
        context={overageContext}
        onClose={() => setOverageContext(null)}
        onAllocated={handleAllocated}
        getToken={getToken}
      />

      <TransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransferred={() => mutate()}
        envelopes={envelopes.map((e) => ({
          id: e.id,
          title: e.title,
          remainingCents: e.remainingCents,
        }))}
        getToken={getToken}
      />

      <KpiWizardModal
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        onSave={handleSaveProfile}
        initialProfile={profile}
      />
    </div>
  );
}
