"use client";

import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";

type KeyMetricsCardProps = {
  totalRemainingCents: number;
  totalBudgetCents: number;
  totalSpentCents: number;
  onTrackCount: number;
  totalCount: number;
};

export function KeyMetricsCard({
  totalRemainingCents,
  totalBudgetCents,
  totalSpentCents,
  onTrackCount,
  totalCount,
}: KeyMetricsCardProps) {
  return (
    <Card variant="default" className="mb-6">
      <h3 className="font-display font-bold text-primary mb-4">Key Metrics</h3>
      <div className="grid grid-cols-3 gap-4">
        {/* Remaining budget */}
        <div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCents(totalRemainingCents)}
          </p>
          <p className="text-sm text-text-secondary">
            of {formatCents(totalBudgetCents)} budget
          </p>
        </div>

        {/* Total spent */}
        <div>
          <p className="text-2xl font-bold text-text-primary">
            {formatCents(totalSpentCents)}
          </p>
          <p className="text-sm text-text-secondary">
            of {formatCents(totalBudgetCents)} Total Spend Target
          </p>
        </div>

        {/* Envelopes on track */}
        <div>
          <p className="text-2xl font-bold text-text-primary">
            {onTrackCount} of {totalCount}
          </p>
          <p className="text-sm text-text-secondary">envelopes on track</p>
        </div>
      </div>
    </Card>
  );
}
