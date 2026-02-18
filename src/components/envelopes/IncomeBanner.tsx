"use client";

import { formatCents } from "@/lib/envelopes/format";

type IncomeBannerProps = {
  totalCents: number;
  allocatedCents: number;
  entries: { id: string; amountCents: number; description: string }[];
  onDelete?: (id: string) => void;
};

export function IncomeBanner({
  totalCents,
  allocatedCents,
  entries,
  onDelete,
}: IncomeBannerProps) {
  if (totalCents <= 0) return null;

  const unallocatedCents = totalCents - allocatedCents;

  return (
    <div className="rounded-xl border border-sage/20 bg-sage/5 px-4 py-3">
      <p className="text-sm font-semibold text-sage">
        Extra Income This Week: {formatCents(totalCents)}
      </p>
      {allocatedCents > 0 && (
        <p className="text-xs text-sage/70 mt-1">
          Allocated: {formatCents(allocatedCents)} | Unallocated:{" "}
          {formatCents(unallocatedCents)}
        </p>
      )}
      {entries.length > 0 && (
        <ul className="mt-2 space-y-1">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-2 text-sm text-sage/80"
            >
              <span>
                {entry.description} &mdash; {formatCents(entry.amountCents)}
              </span>
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
                  className="text-red-400 hover:text-red-600 text-xs font-bold"
                  aria-label={`Delete ${entry.description}`}
                >
                  &times;
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
