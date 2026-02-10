"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";
import type { EnvelopeWithStatus } from "@/lib/envelopes/types";
import { StatusBadge } from "./StatusBadge";

type EnvelopeCardProps = {
  envelope: EnvelopeWithStatus;
  isFirst: boolean;
  isLast: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
};

export function EnvelopeCard({
  envelope,
  isFirst,
  isLast,
  isDeleting,
  onEdit,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onMoveUp,
  onMoveDown,
}: EnvelopeCardProps) {
  if (isDeleting) {
    return (
      <Card
        variant="default"
        className="flex flex-col items-center justify-center gap-3"
      >
        <p className="text-sm font-medium text-text-primary">
          Delete &ldquo;{envelope.title}&rdquo;?
        </p>
        <p className="text-xs text-text-secondary">This cannot be undone.</p>
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={onConfirmDelete}>
            Confirm
          </Button>
          <Button variant="ghost" size="sm" onClick={onCancelDelete}>
            Cancel
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="default" className="flex flex-col gap-3">
      {/* Top row: title + status */}
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-primary truncate">
          {envelope.title}
        </h3>
        <StatusBadge status={envelope.status} />
      </div>

      {/* Middle: remaining amount */}
      <div>
        <p className="text-2xl font-bold text-text-primary">
          {formatCents(envelope.remainingCents)}
        </p>
        <p className="text-sm text-text-secondary">
          of {formatCents(envelope.weeklyBudgetCents)} budget
        </p>
      </div>

      {/* Bottom row: actions */}
      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            Delete
          </Button>
        </div>
        <div className="flex gap-1">
          {!isFirst && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveUp}
              aria-label={`Move ${envelope.title} up`}
            >
              ↑
            </Button>
          )}
          {!isLast && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMoveDown}
              aria-label={`Move ${envelope.title} down`}
            >
              ↓
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
