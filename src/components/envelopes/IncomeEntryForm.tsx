"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type IncomeEntryFormProps = {
  onSubmit: (data: {
    amountCents: number;
    description: string;
    date: string;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function IncomeEntryForm({
  onSubmit,
  onCancel,
  isSubmitting,
}: IncomeEntryFormProps) {
  const [amountDollars, setAmountDollars] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = Number.parseFloat(amountDollars);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Amount must be greater than $0.00.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (!date) {
      setError("Date is required.");
      return;
    }

    onSubmit({
      amountCents: Math.round(parsed * 100),
      description: description.trim(),
      date,
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1">
          <label
            htmlFor="income-amount"
            className="text-sm font-medium text-text-primary"
          >
            Amount ($)
          </label>
          <input
            id="income-amount"
            type="number"
            required
            min="0.01"
            step="0.01"
            value={amountDollars}
            onChange={(e) => setAmountDollars(e.target.value)}
            placeholder="0.00"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="income-description"
            className="text-sm font-medium text-text-primary"
          >
            Description
          </label>
          <input
            id="income-description"
            type="text"
            required
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., Sold old speaker"
            className={inputClasses}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label
            htmlFor="income-date"
            className="text-sm font-medium text-text-primary"
          >
            Date
          </label>
          <input
            id="income-date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className={inputClasses}
          />
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : "Add Income"}
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
