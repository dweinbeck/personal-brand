"use client";

import { formatCents } from "@/lib/envelopes/format";

type DonorAllocationRowProps = {
  envelopeTitle: string;
  remainingCents: number;
  allocationCents: number;
  onAllocationChange: (cents: number) => void;
  error?: string;
};

export function DonorAllocationRow({
  envelopeTitle,
  remainingCents,
  allocationCents,
  onAllocationChange,
  error,
}: DonorAllocationRowProps) {
  const maxDollars = remainingCents / 100;
  const displayValue =
    allocationCents > 0 ? (allocationCents / 100).toFixed(2) : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value;
    if (raw === "") {
      onAllocationChange(0);
      return;
    }
    const parsed = Number.parseFloat(raw);
    if (Number.isNaN(parsed) || parsed < 0) return;
    onAllocationChange(Math.round(parsed * 100));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text-primary">
            {envelopeTitle}
          </p>
          <p className="text-xs text-text-tertiary">
            {formatCents(remainingCents)} remaining
          </p>
        </div>
        <input
          type="number"
          step="0.01"
          min="0"
          max={maxDollars}
          value={displayValue}
          onChange={handleChange}
          placeholder="0.00"
          aria-label={`Allocate from ${envelopeTitle}`}
          className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-right text-sm text-text-primary placeholder:text-text-tertiary focus:outline-2 focus:outline-offset-2 focus:outline-gold"
        />
      </div>
      {error && (
        <p className="text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
