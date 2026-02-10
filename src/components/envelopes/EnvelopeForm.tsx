"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";

type EnvelopeFormProps = {
  mode: "create" | "edit";
  initialValues?: {
    title: string;
    weeklyBudgetCents: number;
    rollover: boolean;
  };
  onSubmit: (data: {
    title: string;
    weeklyBudgetCents: number;
    rollover?: boolean;
  }) => void;
  onCancel: () => void;
  isSubmitting: boolean;
};

export function EnvelopeForm({
  mode,
  initialValues,
  onSubmit,
  onCancel,
  isSubmitting,
}: EnvelopeFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [budgetDollars, setBudgetDollars] = useState(
    initialValues ? (initialValues.weeklyBudgetCents / 100).toFixed(2) : "",
  );
  const [rollover, setRollover] = useState(initialValues?.rollover ?? false);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    const parsed = Number.parseFloat(budgetDollars);
    if (Number.isNaN(parsed) || parsed <= 0) {
      setError("Budget must be greater than $0.00.");
      return;
    }

    const cents = Math.round(parsed * 100);

    onSubmit({
      title: trimmedTitle,
      weeklyBudgetCents: cents,
      ...(mode === "edit" ? { rollover } : {}),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {/* Title */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="envelope-title"
          className="text-sm font-medium text-text-primary"
        >
          Title
        </label>
        <input
          id="envelope-title"
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Groceries"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-2 focus:outline-offset-2 focus:outline-gold"
        />
      </div>

      {/* Weekly Budget */}
      <div className="flex flex-col gap-1">
        <label
          htmlFor="envelope-budget"
          className="text-sm font-medium text-text-primary"
        >
          Weekly Budget ($)
        </label>
        <input
          id="envelope-budget"
          type="number"
          required
          min="0.01"
          step="0.01"
          value={budgetDollars}
          onChange={(e) => setBudgetDollars(e.target.value)}
          placeholder="50.00"
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-2 focus:outline-offset-2 focus:outline-gold"
        />
      </div>

      {/* Rollover (edit mode only) */}
      {mode === "edit" && (
        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={rollover}
            onChange={(e) => setRollover(e.target.checked)}
            className="rounded border-border text-gold focus:ring-gold"
          />
          Roll over unused budget to next week
        </label>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving..." : mode === "create" ? "Create" : "Save"}
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
