"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type TransactionFormProps = {
  envelopes: { id: string; title: string }[];
  onSubmit: (data: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  initialValues?: {
    envelopeId: string;
    amountCents: number;
    date: string;
    merchant?: string;
    description?: string;
  };
};

export function TransactionForm({
  envelopes,
  onSubmit,
  onCancel,
  isSubmitting,
  initialValues,
}: TransactionFormProps) {
  const mode = initialValues ? "edit" : "create";

  const [envelopeId, setEnvelopeId] = useState(
    initialValues?.envelopeId ?? "",
  );
  const [costDollars, setCostDollars] = useState(
    initialValues ? (initialValues.amountCents / 100).toFixed(2) : "",
  );
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [merchant, setMerchant] = useState(initialValues?.merchant ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!envelopeId) {
      setError("Please select an envelope.");
      return;
    }

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
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {/* Envelope */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="txn-envelope"
            className="text-sm font-medium text-text-primary"
          >
            Envelope
          </label>
          <select
            id="txn-envelope"
            required
            value={envelopeId}
            onChange={(e) => setEnvelopeId(e.target.value)}
            className={inputClasses}
          >
            <option value="">Select envelope...</option>
            {envelopes.map((env) => (
              <option key={env.id} value={env.id}>
                {env.title}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="txn-date"
            className="text-sm font-medium text-text-primary"
          >
            Date
          </label>
          <input
            id="txn-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </div>

        {/* Cost */}
        <div className="flex flex-col gap-1">
          <label
            htmlFor="txn-cost"
            className="text-sm font-medium text-text-primary"
          >
            Cost ($)
          </label>
          <input
            id="txn-cost"
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
            htmlFor="txn-merchant"
            className="text-sm font-medium text-text-primary"
          >
            Merchant
          </label>
          <input
            id="txn-merchant"
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
            htmlFor="txn-description"
            className="text-sm font-medium text-text-primary"
          >
            Description
          </label>
          <input
            id="txn-description"
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
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Add Transaction"
              : "Save"}
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
