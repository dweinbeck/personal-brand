"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";
import type { EnvelopeWithStatus } from "@/lib/envelopes/types";
import { StatusBadge } from "./StatusBadge";

type EnvelopeCardProps = {
  envelope: EnvelopeWithStatus;
  isEditMode: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
};

export function EnvelopeCard({
  envelope,
  isEditMode,
  isDeleting,
  onEdit,
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

  const cardContent = (
    <Card
      variant="default"
      className={`relative flex min-h-[180px] flex-col gap-3${
        !isEditMode ? " cursor-pointer transition-shadow hover:shadow-md" : ""
      }`}
    >
      {/* Edit-mode action buttons */}
      {isEditMode && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex h-6 w-6 items-center justify-center rounded-full text-primary hover:bg-gold-light hover:text-primary"
            aria-label={`Edit ${envelope.title}`}
          >
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
            onClick={onDelete}
            className="flex h-6 w-6 items-center justify-center rounded-full text-red-500 hover:bg-red-50 hover:text-red-700"
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
        </div>
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
        {envelope.rolloverSurplusCents > 0 && (
          <p className="text-xs text-sage mt-0.5">
            +{formatCents(envelope.rolloverSurplusCents)} rollover
          </p>
        )}
      </div>
    </Card>
  );

  // In edit mode, card is not clickable (edit/delete buttons take priority)
  if (isEditMode) {
    return cardContent;
  }

  return (
    <Link href={`/envelopes/${envelope.id}`} className="block">
      {cardContent}
    </Link>
  );
}
