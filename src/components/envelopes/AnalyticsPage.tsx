"use client";

import { useAnalytics } from "@/lib/envelopes/hooks";
import { SavingsChart } from "./SavingsChart";
import { SummaryStats } from "./SummaryStats";
import { WeeklyPivotTable } from "./WeeklyPivotTable";

export function AnalyticsPage() {
  const { data, error, isLoading } = useAnalytics();

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

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          This Week
        </h2>
        <SummaryStats {...data.summary} />
      </section>

      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Weekly Spending
        </h2>
        <WeeklyPivotTable
          envelopes={data.envelopes}
          pivotRows={data.pivotRows}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Savings Growth
        </h2>
        <SavingsChart data={data.savingsByWeek} />
      </section>
    </div>
  );
}
