"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatCents } from "@/lib/envelopes/format";
import { computeDisposableIncomeCents } from "@/lib/envelopes/kpi-math";
import type { EnvelopeProfileInput } from "@/lib/envelopes/types";

type KpiBoxProps = {
  profile: EnvelopeProfileInput | null | undefined;
  isLoading: boolean;
  onEdit: () => void;
};

function MetricDisplay({
  label,
  value,
  isLoading,
}: {
  label: string;
  value: string;
  isLoading: boolean;
}) {
  return (
    <div className="text-center">
      <p className="text-xs text-text-secondary mb-1">{label}</p>
      {isLoading ? (
        <div className="h-6 w-20 mx-auto rounded bg-border/40 animate-pulse" />
      ) : (
        <p className="text-lg font-semibold text-text-primary">{value}</p>
      )}
    </div>
  );
}

export function KpiBox({ profile, isLoading, onEdit }: KpiBoxProps) {
  const hasProfile = profile !== null && profile !== undefined;

  const income = hasProfile
    ? formatCents(profile.averageWeeklyIncomeCents)
    : "--";
  const bills = hasProfile
    ? formatCents(profile.averageWeeklyBillsCents)
    : "--";
  const disposable = hasProfile
    ? formatCents(
        computeDisposableIncomeCents(
          profile.averageWeeklyIncomeCents,
          profile.averageWeeklyBillsCents,
        ),
      )
    : "--";
  const savings = hasProfile
    ? formatCents(profile.targetWeeklySavingsCents)
    : "--";

  return (
    <Card variant="default" className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-text-primary">
          Key Metrics (Per Week)
        </h3>
        <Button variant="secondary" size="sm" onClick={onEdit}>
          Edit
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricDisplay
          label="Avg. Income"
          value={income}
          isLoading={isLoading}
        />
        <MetricDisplay label="Avg. Bills" value={bills} isLoading={isLoading} />
        <MetricDisplay
          label="Disposable Income"
          value={disposable}
          isLoading={isLoading}
        />
        <MetricDisplay
          label="Target Savings"
          value={savings}
          isLoading={isLoading}
        />
      </div>
    </Card>
  );
}
