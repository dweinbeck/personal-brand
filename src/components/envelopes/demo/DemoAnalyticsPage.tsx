"use client";

import { Card } from "@/components/ui/Card";
import { SummaryStats } from "../SummaryStats";
import { useDemo } from "./DemoProvider";

export function DemoAnalyticsPage() {
  const { state } = useDemo();

  const envelopes = state.envelopes;
  const totalSpentCents = envelopes.reduce((sum, e) => sum + e.spentCents, 0);
  const totalBudgetCents = envelopes.reduce(
    (sum, e) => sum + e.weeklyBudgetCents,
    0,
  );
  const totalRemainingCents = envelopes.reduce(
    (sum, e) => sum + e.remainingCents,
    0,
  );
  const onTrackCount = envelopes.filter((e) => e.status === "On Track").length;

  // Group transactions by envelope for a simple breakdown
  const spendingByEnvelope = envelopes.map((env) => ({
    title: env.title,
    spentCents: env.spentCents,
    budgetCents: env.weeklyBudgetCents,
    remainingCents: env.remainingCents,
    status: env.status,
    percentUsed:
      env.weeklyBudgetCents > 0
        ? Math.round((env.spentCents / env.weeklyBudgetCents) * 100)
        : 0,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          This Week
        </h2>
        <SummaryStats
          totalSpentCents={totalSpentCents}
          totalBudgetCents={totalBudgetCents}
          totalRemainingCents={totalRemainingCents}
          onTrackCount={onTrackCount}
          totalEnvelopeCount={envelopes.length}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Spending by Envelope
        </h2>
        <div className="space-y-3">
          {spendingByEnvelope.map((item) => (
            <Card key={item.title} variant="default" className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">
                  {item.title}
                </span>
                <span className="text-xs text-text-secondary">
                  {item.percentUsed}% used
                </span>
              </div>
              <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    item.status === "Over"
                      ? "bg-red-500"
                      : item.status === "Watch"
                        ? "bg-amber-500"
                        : "bg-sage"
                  }`}
                  style={{ width: `${Math.min(item.percentUsed, 100)}%` }}
                />
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <Card variant="default" className="p-6 text-center">
          <p className="text-sm text-text-secondary">
            Full analytics with weekly trends, savings charts, and spending
            pivot tables are available in the full version.
          </p>
          <a
            href="/envelopes"
            className="mt-2 inline-block text-sm font-medium text-primary underline hover:text-primary/80"
          >
            Sign in to access full analytics
          </a>
        </Card>
      </section>
    </div>
  );
}
