"use client";

import { format } from "date-fns";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";
import { formatWeekLabel } from "@/lib/envelopes/week-math";
import { CreateEnvelopeCard } from "../CreateEnvelopeCard";
import { EnvelopeCardGrid } from "../EnvelopeCardGrid";
import { EnvelopeForm } from "../EnvelopeForm";
import { SavingsBanner } from "../SavingsBanner";
import { StatusBadge } from "../StatusBadge";
import { TransactionForm } from "../TransactionForm";
import { useDemo } from "./DemoProvider";
import type { DemoEnvelope } from "./seed-data";

// ---------------------------------------------------------------------------
// Demo-specific envelope card (avoids Firestore Timestamp dependencies)
// ---------------------------------------------------------------------------

function DemoEnvelopeCard({
  envelope,
  isEditMode,
  isDeleting,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  envelope: DemoEnvelope;
  isEditMode: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  if (isDeleting) {
    return (
      <Card
        variant="default"
        className="flex min-h-[180px] flex-col items-center justify-center gap-3"
      >
        <p className="text-sm font-medium text-text-primary">
          Delete &ldquo;{envelope.title}&rdquo;?
        </p>
        <p className="text-xs text-text-secondary">This cannot be undone.</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onConfirmDelete}
            className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700"
          >
            Confirm
          </button>
          <button
            type="button"
            onClick={onCancelDelete}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-hover"
          >
            Cancel
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card
      variant="default"
      className="relative flex min-h-[180px] flex-col gap-3"
    >
      {isEditMode && (
        <button
          type="button"
          onClick={onDelete}
          className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
          aria-label={`Delete ${envelope.title}`}
        >
          <svg
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
          >
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary truncate">
          {envelope.title}
        </h3>
        <StatusBadge status={envelope.status} />
      </div>

      <div className="mt-auto">
        <p className="text-2xl font-bold text-text-primary">
          {formatCents(envelope.remainingCents)}
        </p>
        <p className="text-sm text-text-secondary">
          of {formatCents(envelope.weeklyBudgetCents)} budget
        </p>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// DemoHomePage
// ---------------------------------------------------------------------------

export function DemoHomePage() {
  const { state, dispatch } = useDemo();

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);

  const envelopes = [...state.envelopes].sort(
    (a, b) => b.weeklyBudgetCents - a.weeklyBudgetCents,
  );

  const totalBudgetCents = envelopes.reduce(
    (sum, e) => sum + e.weeklyBudgetCents,
    0,
  );
  const totalSpentCents = envelopes.reduce((sum, e) => sum + e.spentCents, 0);
  const savingsCents = envelopes
    .filter((e) => !e.rollover && e.remainingCents > 0)
    .reduce((sum, e) => sum + e.remainingCents, 0);

  const onTrackCount = envelopes.filter((e) => e.status === "On Track").length;
  const weekLabel = formatWeekLabel(new Date());
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const envelopeOptions = envelopes.map((e) => ({
    id: e.id,
    title: e.title,
  }));

  function handleCreate(formData: {
    title: string;
    weeklyBudgetCents: number;
  }) {
    dispatch({
      type: "ADD_ENVELOPE",
      payload: {
        title: formData.title,
        weeklyBudgetCents: formData.weeklyBudgetCents,
        rollover: false,
      },
    });
    setIsCreating(false);
  }

  function handleDelete(id: string) {
    dispatch({ type: "DELETE_ENVELOPE", payload: { id } });
    setDeletingId(null);
  }

  function handleAddTransaction(txnData: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  }) {
    dispatch({ type: "ADD_TRANSACTION", payload: txnData });
    setIsAddingTransaction(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-primary">
          Welcome to Envelopes Demo
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {onTrackCount}/{envelopes.length} envelopes on track &middot;{" "}
          {formatCents(totalSpentCents)} spent of{" "}
          {formatCents(totalBudgetCents)}
        </p>
      </div>

      {savingsCents > 0 && <SavingsBanner savingsCents={savingsCents} />}

      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-primary">
          Week of {weekLabel}
        </h2>
        <Button
          variant={isEditing ? "primary" : "secondary"}
          size="sm"
          onClick={() => {
            setIsEditing(!isEditing);
            setDeletingId(null);
          }}
        >
          {isEditing ? "Done Editing" : "Edit Cards"}
        </Button>
      </div>

      {/* Add Transaction button */}
      {!isEditing && envelopes.length > 0 && (
        <div className="mb-4">
          {isAddingTransaction ? (
            <Card variant="default">
              <TransactionForm
                envelopes={envelopeOptions}
                onSubmit={handleAddTransaction}
                onCancel={() => setIsAddingTransaction(false)}
                isSubmitting={false}
                initialValues={{
                  envelopeId: "",
                  amountCents: 0,
                  date: todayStr,
                }}
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

      {envelopes.length === 0 && !isCreating && (
        <div className="mb-6 text-center">
          <p className="text-text-secondary mb-2">
            No envelopes yet. Create your first one to start budgeting!
          </p>
        </div>
      )}

      <EnvelopeCardGrid>
        {envelopes.map((env) => (
          <div key={env.id}>
            <DemoEnvelopeCard
              envelope={env}
              isEditMode={isEditing}
              isDeleting={deletingId === env.id}
              onDelete={() => setDeletingId(env.id)}
              onConfirmDelete={() => handleDelete(env.id)}
              onCancelDelete={() => setDeletingId(null)}
            />
          </div>
        ))}

        {isEditing &&
          (isCreating ? (
            <Card variant="default" className="min-h-[180px]">
              <EnvelopeForm
                mode="create"
                onSubmit={handleCreate}
                onCancel={() => setIsCreating(false)}
                isSubmitting={false}
              />
            </Card>
          ) : (
            <CreateEnvelopeCard onClick={() => setIsCreating(true)} />
          ))}
      </EnvelopeCardGrid>
    </div>
  );
}
