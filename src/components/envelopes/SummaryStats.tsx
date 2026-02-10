"use client";

import clsx from "clsx";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";

type SummaryStatsProps = {
  totalSpentCents: number;
  totalBudgetCents: number;
  totalRemainingCents: number;
  onTrackCount: number;
  totalEnvelopeCount: number;
};

export function SummaryStats({
  totalSpentCents,
  totalBudgetCents,
  totalRemainingCents,
  onTrackCount,
  totalEnvelopeCount,
}: SummaryStatsProps) {
  const allOnTrack = onTrackCount === totalEnvelopeCount;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <Card className="text-center">
        <p className="text-xs text-text-secondary">Total Spent</p>
        <p className="text-lg font-semibold font-display text-primary">
          {formatCents(totalSpentCents)}
        </p>
      </Card>

      <Card className="text-center">
        <p className="text-xs text-text-secondary">Total Budget</p>
        <p className="text-lg font-semibold font-display text-primary">
          {formatCents(totalBudgetCents)}
        </p>
      </Card>

      <Card className="text-center">
        <p className="text-xs text-text-secondary">Remaining</p>
        <p
          className={clsx(
            "text-lg font-semibold font-display",
            totalRemainingCents >= 0 ? "text-sage" : "text-red-700",
          )}
        >
          {formatCents(totalRemainingCents)}
        </p>
      </Card>

      <Card className="text-center">
        <p className="text-xs text-text-secondary">Status</p>
        <p
          className={clsx(
            "text-lg font-semibold font-display",
            allOnTrack ? "text-sage" : "text-amber-600",
          )}
        >
          {allOnTrack ? "On Track" : `${onTrackCount}/${totalEnvelopeCount}`}
        </p>
      </Card>
    </div>
  );
}
