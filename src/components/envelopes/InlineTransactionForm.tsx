"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type InlineTransactionFormProps = {
  envelopeId: string;
  defaultDate: string;
  minDate: string;
  maxDate: string;
  onSubmit: (data: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function InlineTransactionForm({
  envelopeId,
  defaultDate,
  minDate,
  maxDate,
  onSubmit,
  onCancel,
  isSubmitting,
}: InlineTransactionFormProps) {
  const [date, setDate] = useState(defaultDate);
  const [costDollars, setCostDollars] = useState("");
  const [merchant, setMerchant] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!date) {
      setError("Date is required.");
      return;
    }

    const parsed = Number.parseFloat(costDollars);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Cost must be greater than $0.00.");
      return;
    }

    const amountCents = Math.round(parsed * 100);

    onSubmit({
      envelopeId,
      amountCents,
      date,
      ...(merchant.trim() ? { merchant: merchant.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    });
  }

  const inputClasses =
    "rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-2 focus:outline-offset-2 focus:outline-gold";

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 border-t border-border pt-3"
    >
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Date */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`inline-txn-date-${envelopeId}`}
            className="text-xs font-medium text-text-primary"
          >
            Date
          </label>
          <input
            id={`inline-txn-date-${envelopeId}`}
            type="date"
            required
            min={minDate}
            max={maxDate}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Cost */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`inline-txn-cost-${envelopeId}`}
            className="text-xs font-medium text-text-primary"
          >
            Cost ($)
          </label>
          <input
            id={`inline-txn-cost-${envelopeId}`}
            type="number"
            required
            min="0.01"
            step="0.01"
            value={costDollars}
            onChange={(e) => setCostDollars(e.target.value)}
            placeholder="0.00"
            className={inputClasses}
          />
        </div>

        {/* Merchant */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`inline-txn-merchant-${envelopeId}`}
            className="text-xs font-medium text-text-primary"
          >
            Merchant
          </label>
          <input
            id={`inline-txn-merchant-${envelopeId}`}
            type="text"
            maxLength={200}
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Kroger"
            className={inputClasses}
          />
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor={`inline-txn-description-${envelopeId}`}
            className="text-xs font-medium text-text-primary"
          >
            Description
          </label>
          <input
            id={`inline-txn-description-${envelopeId}`}
            type="text"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional note"
            className={inputClasses}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Adding..." : "Add"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
