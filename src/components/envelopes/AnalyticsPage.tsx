"use client";

import { useAnalytics, useEnvelopeProfile } from "@/lib/envelopes/hooks";
import { IncomeVsSpendingChart } from "./IncomeVsSpendingChart";
import { ReadOnlyBanner } from "./ReadOnlyBanner";
import { SavingsChart } from "./SavingsChart";
import { SpendingByEnvelopeChart } from "./SpendingByEnvelopeChart";
import { SpendingDistributionChart } from "./SpendingDistributionChart";
import { SpendingTrendChart } from "./SpendingTrendChart";
import { SummaryStats } from "./SummaryStats";
import { WeeklyPivotTable } from "./WeeklyPivotTable";

export function AnalyticsPage() {
  const { data, error, isLoading } = useAnalytics();
  const { profile } = useEnvelopeProfile();

  if (isLoading) {
    return (
      <div className="text-center py-12 text-text-secondary">
        Loading analytics...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-700">
        Failed to load analytics.
      </div>
    );
  }

  if (!data) return null;

  const isReadOnly = data?.billing?.mode === "readonly";

  return (
    <div className="space-y-8">
      {isReadOnly && <ReadOnlyBanner />}

      {/* 1. This Week */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          This Week
        </h2>
        <SummaryStats {...data.summary} />
      </section>

      {/* 2. Budget Utilization */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Budget Utilization
        </h2>
        <SpendingByEnvelopeChart data={data.spendingByEnvelope} />
      </section>

      {/* 3. Spending Distribution (NEW) */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Spending Distribution
        </h2>
        <SpendingDistributionChart
          data={data.spendingByEnvelope.map((e) => ({
            title: e.title,
            spentCents: e.spentCents,
          }))}
        />
      </section>

      {/* 4. Spending Trend */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Spending Trend
        </h2>
        <SpendingTrendChart data={data.weeklyTotals} />
      </section>

      {/* 5. Income vs Spending (NEW) */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Income vs Spending
        </h2>
        <IncomeVsSpendingChart
          weeklyTotals={data.weeklyTotals}
          weeklyIncome={data.weeklyIncome}
          baseWeeklyIncomeCents={profile?.averageWeeklyIncomeCents}
        />
      </section>

      {/* 6. Weekly Spending */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Weekly Spending
        </h2>
        <WeeklyPivotTable
          envelopes={data.envelopes}
          pivotRows={data.pivotRows}
        />
      </section>

      {/* 7. Savings Growth */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Savings Growth
        </h2>
        <SavingsChart data={data.savingsByWeek} />
      </section>
    </div>
  );
}
