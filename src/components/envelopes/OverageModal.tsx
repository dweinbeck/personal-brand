"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { envelopeFetch } from "@/lib/envelopes/api";
import { formatCents } from "@/lib/envelopes/format";
import { DonorAllocationRow } from "./DonorAllocationRow";

export type OverageContext = {
  transactionId: string;
  envelopeId: string;
  envelopeTitle: string;
  overageAmountCents: number;
  donorEnvelopes: { id: string; title: string; remainingCents: number }[];
};

type OverageModalProps = {
  context: OverageContext | null;
  onClose: () => void;
  onAllocated: () => void;
  getToken: () => Promise<string>;
};

const HEADING_ID = "overage-modal-heading";

export function OverageModal({
  context,
  onClose,
  onAllocated,
  getToken,
}: OverageModalProps) {
  const [allocations, setAllocations] = useState<Map<string, number>>(
    new Map(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset allocations when context changes (new overage opened)
  useEffect(() => {
    if (context) {
      const initial = new Map<string, number>();
      for (const donor of context.donorEnvelopes) {
        initial.set(donor.id, 0);
      }
      setAllocations(initial);
      setServerError(null);
    }
  }, [context]);

  if (!context) return null;

  const totalAllocated = Array.from(allocations.values()).reduce(
    (sum, v) => sum + v,
    0,
  );
  const remaining = context.overageAmountCents - totalAllocated;

  function getDonorError(donorId: string): string | undefined {
    const donor = context?.donorEnvelopes.find((d) => d.id === donorId);
    if (!donor) return undefined;
    const amount = allocations.get(donorId) ?? 0;
    if (amount > donor.remainingCents) {
      return `Exceeds available ${formatCents(donor.remainingCents)}`;
    }
    return undefined;
  }

  const hasPerDonorErrors = context.donorEnvelopes.some(
    (d) => getDonorError(d.id) !== undefined,
  );

  const canSubmit =
    totalAllocated === context.overageAmountCents &&
    !hasPerDonorErrors &&
    !isSubmitting;

  function handleAllocationChange(donorId: string, cents: number) {
    setAllocations((prev) => {
      const next = new Map(prev);
      next.set(donorId, cents);
      return next;
    });
  }

  async function handleSubmit() {
    if (!context) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const token = await getToken();
      const entries = Array.from(allocations.entries()).filter(
        ([, cents]) => cents > 0,
      );
      const payload = {
        sourceTransactionId: context.transactionId,
        allocations: entries.map(([donorEnvelopeId, amountCents]) => ({
          donorEnvelopeId,
          amountCents,
        })),
      };
      await envelopeFetch("/api/envelopes/allocations", token, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onAllocated();
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to apply allocation.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      isOpen={context !== null}
      onClose={onClose}
      aria-labelledby={HEADING_ID}
    >
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6 pb-4">
          <h2
            id={HEADING_ID}
            className="font-display text-lg font-bold text-primary"
          >
            Cover Overage
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

        {/* Body */}
        <div className="flex flex-col gap-4 p-6">
          <p className="text-sm text-text-secondary">
            <span className="font-semibold text-text-primary">
              {context.envelopeTitle}
            </span>{" "}
            is over budget by{" "}
            <span className="font-semibold text-text-primary">
              {formatCents(context.overageAmountCents)}
            </span>
          </p>

          {context.donorEnvelopes.length === 0 ? (
            <p className="text-sm text-text-tertiary">
              No other envelopes have remaining funds to reallocate.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {context.donorEnvelopes.map((donor) => (
                <DonorAllocationRow
                  key={donor.id}
                  envelopeTitle={donor.title}
                  remainingCents={donor.remainingCents}
                  allocationCents={allocations.get(donor.id) ?? 0}
                  onAllocationChange={(cents) =>
                    handleAllocationChange(donor.id, cents)
                  }
                  error={getDonorError(donor.id)}
                />
              ))}
            </div>
          )}

          {serverError && (
            <p className="text-sm text-red-600" role="alert">
              {serverError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-border p-6 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-text-secondary">
              Allocated: {formatCents(totalAllocated)}
            </span>
            <span
              className={
                remaining === 0
                  ? "font-semibold text-sage"
                  : "font-semibold text-red-600"
              }
            >
              Remaining: {formatCents(remaining)}
            </span>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Skip for now
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {isSubmitting ? "Applying..." : "Apply"}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
