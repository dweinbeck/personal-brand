"use client";

import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";
import type { EnvelopeWithStatus } from "@/lib/envelopes/types";
import { StatusBadge } from "./StatusBadge";

type EnvelopeCardProps = {
  envelope: EnvelopeWithStatus;
  isEditMode: boolean;
  isDeleting: boolean;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function EnvelopeCard({
  envelope,
  isEditMode,
  isDeleting,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
}: EnvelopeCardProps) {
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
      {/* Edit-mode delete button */}
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

      {/* Top row: title + status */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary truncate">
          {envelope.title}
        </h3>
        <StatusBadge status={envelope.status} />
      </div>

      {/* Middle: remaining amount */}
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
