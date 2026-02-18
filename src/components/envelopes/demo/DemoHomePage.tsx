"use client";

import { format } from "date-fns";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { formatCents } from "@/lib/envelopes/format";
import { formatWeekLabel } from "@/lib/envelopes/week-math";
import { CreateEnvelopeCard } from "../CreateEnvelopeCard";
import { EnvelopeCardGrid } from "../EnvelopeCardGrid";
import { EnvelopeForm } from "../EnvelopeForm";
import { IncomeBanner } from "../IncomeBanner";
import { IncomeEntryForm } from "../IncomeEntryForm";
import { KpiBox } from "../KpiBox";
import { SavingsBanner } from "../SavingsBanner";
import { StatusBadge } from "../StatusBadge";
import { TransactionForm } from "../TransactionForm";
import { useDemo } from "./DemoProvider";
import type { DemoEnvelope } from "./seed-data";

// ---------------------------------------------------------------------------
// Demo-specific envelope card (with inline budget editing)
// ---------------------------------------------------------------------------

function DemoEnvelopeCard({
  envelope,
  isEditMode,
  isDeleting,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onBudgetChange,
}: {
  envelope: DemoEnvelope;
  isEditMode: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onBudgetChange: (newCents: number) => void;
}) {
  const [editValue, setEditValue] = useState(
    (envelope.weeklyBudgetCents / 100).toString(),
  );

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
        {isEditMode ? (
          <div className="flex items-center gap-1 mt-1">
            <span className="text-sm text-text-secondary">$</span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => {
                const cents = Math.round(Number.parseFloat(editValue) * 100);
                if (cents > 0 && cents !== envelope.weeklyBudgetCents) {
                  onBudgetChange(cents);
                } else {
                  setEditValue((envelope.weeklyBudgetCents / 100).toString());
                }
              }}
              className="w-20 rounded border border-border bg-surface px-1 py-0.5 text-sm text-text-primary"
            />
            <span className="text-sm text-text-secondary">/ week</span>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">
            of {formatCents(envelope.weeklyBudgetCents)} budget
          </p>
        )}
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Demo Transfer Modal (dispatches to reducer instead of API)
// ---------------------------------------------------------------------------

function DemoTransferModal({
  isOpen,
  onClose,
  onTransfer,
  envelopes,
}: {
  isOpen: boolean;
  onClose: () => void;
  onTransfer: (fromId: string, toId: string, amountCents: number) => void;
  envelopes: { id: string; title: string; remainingCents: number }[];
}) {
  const [fromEnvelopeId, setFromEnvelopeId] = useState("");
  const [toEnvelopeId, setToEnvelopeId] = useState("");
  const [amountDollars, setAmountDollars] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setFromEnvelopeId("");
      setToEnvelopeId("");
      setAmountDollars("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (toEnvelopeId && toEnvelopeId === fromEnvelopeId) {
      setToEnvelopeId("");
    }
  }, [fromEnvelopeId, toEnvelopeId]);

  const sourceEnvelopes = envelopes.filter((e) => e.remainingCents > 0);
  const targetEnvelopes = envelopes.filter((e) => e.id !== fromEnvelopeId);
  const selectedSource = envelopes.find((e) => e.id === fromEnvelopeId);
  const maxCents = selectedSource?.remainingCents ?? 0;
  const maxDollars = maxCents / 100;
  const amountCents = Math.round(Number.parseFloat(amountDollars || "0") * 100);
  const canSubmit =
    fromEnvelopeId !== "" &&
    toEnvelopeId !== "" &&
    amountCents > 0 &&
    amountCents <= maxCents;

  function handleSubmit() {
    if (!canSubmit) return;
    onTransfer(fromEnvelopeId, toEnvelopeId, amountCents);
    onClose();
  }

  const inputClasses =
    "rounded-lg border border-border bg-white px-3 py-2 text-sm";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      aria-labelledby="demo-transfer-heading"
    >
      <div className="flex flex-col">
        <div className="flex items-center justify-between border-b border-border p-6 pb-4">
          <h2
            id="demo-transfer-heading"
            className="font-display text-lg font-bold text-primary"
          >
            Transfer Funds
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-text-secondary hover:bg-gold-light hover:text-text-primary"
            aria-label="Close"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="demo-transfer-from"
              className="text-sm font-medium text-text-primary"
            >
              From Envelope
            </label>
            <select
              id="demo-transfer-from"
              value={fromEnvelopeId}
              onChange={(e) => setFromEnvelopeId(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select source...</option>
              {sourceEnvelopes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} (remaining: {formatCents(e.remainingCents)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="demo-transfer-to"
              className="text-sm font-medium text-text-primary"
            >
              To Envelope
            </label>
            <select
              id="demo-transfer-to"
              value={toEnvelopeId}
              onChange={(e) => setToEnvelopeId(e.target.value)}
              className={inputClasses}
            >
              <option value="">Select target...</option>
              {targetEnvelopes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} (available: {formatCents(e.remainingCents)})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label
              htmlFor="demo-transfer-amount"
              className="text-sm font-medium text-text-primary"
            >
              Amount ($)
            </label>
            <input
              id="demo-transfer-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxDollars > 0 ? maxDollars : undefined}
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              placeholder="0.00"
              className={inputClasses}
            />
            {selectedSource && (
              <p className="text-xs text-text-secondary">
                Max: {formatCents(maxCents)}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border p-6 pt-4">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            Transfer
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// DemoHomePage (full parity with real EnvelopesHomePage)
// ---------------------------------------------------------------------------

export function DemoHomePage() {
  const { state, dispatch } = useDemo();

  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const envelopes = [...state.envelopes].sort(
    (a, b) => b.weeklyBudgetCents - a.weeklyBudgetCents,
  );

  const totalBudgetCents = envelopes.reduce(
    (sum, e) => sum + e.weeklyBudgetCents,
    0,
  );
  const totalSpentCents = envelopes.reduce((sum, e) => sum + e.spentCents, 0);
  const totalRemainingCents = envelopes.reduce(
    (sum, e) => sum + e.remainingCents,
    0,
  );
  const savingsCents = envelopes
    .filter((e) => !e.rollover && e.remainingCents > 0)
    .reduce((sum, e) => sum + e.remainingCents, 0);
  const incomeTotalCents = state.incomeEntries.reduce(
    (sum, e) => sum + e.amountCents,
    0,
  );

  const onTrackCount = envelopes.filter((e) => e.status === "On Track").length;
  const weekLabel = formatWeekLabel(new Date());
  const _todayStr = format(new Date(), "yyyy-MM-dd");

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

  function handleBudgetChange(id: string, weeklyBudgetCents: number) {
    dispatch({
      type: "UPDATE_ENVELOPE_BUDGET",
      payload: { id, weeklyBudgetCents },
    });
  }

  function handleTransfer(
    fromEnvelopeId: string,
    toEnvelopeId: string,
    amountCents: number,
  ) {
    dispatch({
      type: "TRANSFER_FUNDS",
      payload: { fromEnvelopeId, toEnvelopeId, amountCents },
    });
  }

  function handleAddIncome(incomeData: {
    amountCents: number;
    description: string;
    date: string;
  }) {
    dispatch({ type: "ADD_INCOME_ENTRY", payload: incomeData });
    setIsAddingIncome(false);
  }

  function handleDeleteIncome(id: string) {
    dispatch({ type: "DELETE_INCOME_ENTRY", payload: { id } });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
      {/* 1. Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-display text-primary">
          Welcome to Envelopes Demo
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          {onTrackCount}/{envelopes.length} envelopes on track &middot;{" "}
          {formatCents(totalSpentCents)} spent of{" "}
          {formatCents(totalBudgetCents)} &middot;{" "}
          {formatCents(totalRemainingCents)} remaining
        </p>
      </div>

      {/* 2. Week header + action buttons */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h2 className="font-display text-lg font-semibold text-primary">
          Week of {weekLabel}
        </h2>
        {envelopes.length > 0 && (
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

      {/* 3. Inline Income Entry form */}
      {!isEditing && isAddingIncome && (
        <div className="mb-4">
          <Card variant="default">
            <IncomeEntryForm
              onSubmit={handleAddIncome}
              onCancel={() => setIsAddingIncome(false)}
              isSubmitting={false}
            />
          </Card>
        </div>
      )}

      {/* 4. Inline Transaction form */}
      {!isEditing && isAddingTransaction && envelopes.length > 0 && (
        <div className="mb-4">
          <Card variant="default">
            <TransactionForm
              envelopes={envelopeOptions}
              onSubmit={handleAddTransaction}
              onCancel={() => setIsAddingTransaction(false)}
              isSubmitting={false}
            />
          </Card>
        </div>
      )}

      {/* 5. Empty state */}
      {envelopes.length === 0 && !isCreating && (
        <div className="mb-6 text-center">
          <p className="text-text-secondary mb-2">
            No envelopes yet. Create your first one to start budgeting!
          </p>
        </div>
      )}

      {/* 6. Envelope card grid */}
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
              onBudgetChange={(newCents) =>
                handleBudgetChange(env.id, newCents)
              }
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

      {/* 7. Income banner */}
      {state.incomeEntries.length > 0 && (
        <div className="mt-6">
          <IncomeBanner
            totalCents={incomeTotalCents}
            entries={state.incomeEntries.map((e) => ({
              id: e.id,
              amountCents: e.amountCents,
              description: e.description,
            }))}
            onDelete={handleDeleteIncome}
          />
        </div>
      )}

      {/* 8. Savings banner */}
      {savingsCents > 0 && (
        <div className="mt-4">
          <SavingsBanner savingsCents={savingsCents} />
        </div>
      )}

      {/* 9. KPI metrics */}
      <div className="mt-6">
        <KpiBox profile={state.profile} isLoading={false} onEdit={() => {}} />
      </div>

      {/* Demo Transfer Modal */}
      <DemoTransferModal
        isOpen={transferOpen}
        onClose={() => setTransferOpen(false)}
        onTransfer={handleTransfer}
        envelopes={envelopes.map((e) => ({
          id: e.id,
          title: e.title,
          remainingCents: e.remainingCents,
        }))}
      />
    </div>
  );
}
