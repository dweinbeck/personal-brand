"use client";

import { formatCents } from "@/lib/envelopes/format";

export function SavingsBanner({ savingsCents }: { savingsCents: number }) {
  if (savingsCents <= 0) return null;

  return (
    <div className="mb-6 rounded-xl border border-sage/20 bg-sage/5 px-4 py-3">
      <p className="text-sm text-sage">
        <span className="font-semibold">{formatCents(savingsCents)}</span> saved
        across all envelopes so far.
      </p>
    </div>
  );
}
