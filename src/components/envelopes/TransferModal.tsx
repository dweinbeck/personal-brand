"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { envelopeFetch } from "@/lib/envelopes/api";
import { formatCents } from "@/lib/envelopes/format";

type TransferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onTransferred: () => void;
  envelopes: { id: string; title: string; remainingCents: number }[];
  getToken: () => Promise<string>;
};

const HEADING_ID = "transfer-modal-heading";

export function TransferModal({
  isOpen,
  onClose,
  onTransferred,
  envelopes,
  getToken,
}: TransferModalProps) {
  const [fromEnvelopeId, setFromEnvelopeId] = useState("");
  const [toEnvelopeId, setToEnvelopeId] = useState("");
  const [amountDollars, setAmountDollars] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFromEnvelopeId("");
      setToEnvelopeId("");
      setAmountDollars("");
      setNote("");
      setIsSubmitting(false);
      setServerError(null);
    }
  }, [isOpen]);

  // Clear toEnvelopeId if it matches the newly selected source
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
  const isAmountValid = amountCents > 0 && amountCents <= maxCents;

  const canSubmit =
    fromEnvelopeId !== "" &&
    toEnvelopeId !== "" &&
    isAmountValid &&
    !isSubmitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const token = await getToken();
      await envelopeFetch("/api/envelopes/transfers", token, {
        method: "POST",
        body: JSON.stringify({
          fromEnvelopeId,
          toEnvelopeId,
          amountCents,
          note: note.trim() || undefined,
        }),
      });
      onTransferred();
      onClose();
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to transfer funds.",
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

        {/* Body */}
        <div className="flex flex-col gap-4 p-6">
          {/* From Envelope */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="transfer-from"
              className="text-sm font-medium text-text-primary"
            >
              From Envelope
            </label>
            <select
              id="transfer-from"
              value={fromEnvelopeId}
              onChange={(e) => setFromEnvelopeId(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Select source...</option>
              {sourceEnvelopes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title} (remaining: {formatCents(e.remainingCents)})
                </option>
              ))}
            </select>
          </div>

          {/* To Envelope */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="transfer-to"
              className="text-sm font-medium text-text-primary"
            >
              To Envelope
            </label>
            <select
              id="transfer-to"
              value={toEnvelopeId}
              onChange={(e) => setToEnvelopeId(e.target.value)}
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            >
              <option value="">Select target...</option>
              {targetEnvelopes.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="transfer-amount"
              className="text-sm font-medium text-text-primary"
            >
              Amount ($)
            </label>
            <input
              id="transfer-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={maxDollars > 0 ? maxDollars : undefined}
              value={amountDollars}
              onChange={(e) => setAmountDollars(e.target.value)}
              placeholder="0.00"
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
            {selectedSource && (
              <p className="text-xs text-text-secondary">
                Max: {formatCents(maxCents)}
              </p>
            )}
          </div>

          {/* Note */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="transfer-note"
              className="text-sm font-medium text-text-primary"
            >
              Note (optional)
            </label>
            <input
              id="transfer-note"
              type="text"
              maxLength={200}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Reason for transfer..."
              className="rounded-lg border border-border bg-white px-3 py-2 text-sm"
            />
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
            {isSubmitting ? "Transferring..." : "Transfer"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
