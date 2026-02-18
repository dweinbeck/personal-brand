"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { envelopeFetch } from "@/lib/envelopes/api";
import { formatCents } from "@/lib/envelopes/format";

type IncomeAllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAllocated: () => void;
  unallocatedCents: number;
  envelopes: { id: string; title: string }[];
  getToken: () => Promise<string>;
};

const HEADING_ID = "income-allocation-modal-heading";

export function IncomeAllocationModal({
  isOpen,
  onClose,
  onAllocated,
  unallocatedCents,
  envelopes,
  getToken,
}: IncomeAllocationModalProps) {
  const [envelopeId, setEnvelopeId] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEnvelopeId("");
      setAmountDollars("");
      setIsSubmitting(false);
      setServerError(null);
    }
  }, [isOpen]);

  const maxDollars = unallocatedCents / 100;
  const amountCents = Math.round(Number.parseFloat(amountDollars || "0") * 100);
  const isAmountValid = amountCents > 0 && amountCents <= unallocatedCents;

  const canSubmit = envelopeId !== "" && isAmountValid && !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const token = await getToken();
      await envelopeFetch("/api/envelopes/income-allocations", token, {
        method: "POST",
        body: JSON.stringify({ envelopeId, amountCents }),
      });
      onAllocated();
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to allocate income.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} aria-labelledby={HEADING_ID}>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border p-6 pb-4">
          <h2
            id={HEADING_ID}
            className="font-display text-lg font-bold text-primary"
          >
            Allocate Income
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
          {/* Available income banner */}
          <div className="rounded-lg bg-sage/10 px-3 py-2">
            <p className="text-sm font-semibold text-sage">
              Available Income: {formatCents(unallocatedCents)}
            </p>
          </div>

          {/* Destination Envelope */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="allocation-envelope"
              className="text-sm font-medium text-text-primary"
            >
              Envelope
            </label>
            <select
              id="allocation-envelope"
              value={envelopeId}
              onChange={(e) => setEnvelopeId(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Select envelope...</option>
              {envelopes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="allocation-amount"
              className="text-sm font-medium text-text-primary"
            >
              Amount ($)
            </label>
            <input
              id="allocation-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxDollars > 0 ? maxDollars : undefined}
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              placeholder="0.00"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
            <p className="text-xs text-text-secondary">
              Max: {formatCents(unallocatedCents)}
            </p>
          </div>

          {/* Error display */}
          {serverError && (
            <p className="text-sm text-red-600" role="alert">
              {serverError}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-border p-6 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Allocating..." : "Allocate"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
