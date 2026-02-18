"use client";

import { addWeeks, format, startOfWeek } from "date-fns";
import { getWeekNumber } from "@/lib/envelopes/week-math";
import { IncomeVsSpendingChart } from "../IncomeVsSpendingChart";
import { SavingsChart } from "../SavingsChart";
import { SpendingByEnvelopeChart } from "../SpendingByEnvelopeChart";
import { SpendingDistributionChart } from "../SpendingDistributionChart";
import { SpendingTrendChart } from "../SpendingTrendChart";
import { SummaryStats } from "../SummaryStats";
import { WeeklyPivotTable } from "../WeeklyPivotTable";
import { useDemo } from "./DemoProvider";

const WEEK_OPTIONS = { weekStartsOn: 0 as const };

export function DemoAnalyticsPage() {
  const { state } = useDemo();

  const envelopes = state.envelopes;
  const allTransactions = [
    ...state.transactions,
    ...state.historicalTransactions,
  ];
  const allIncomeEntries = [...state.incomeEntries, ...state.historicalIncome];

  // -- Summary stats (current week) --
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

  // -- Spending by envelope --
  const spendingByEnvelope = envelopes
    .map((env) => ({
      envelopeId: env.id,
      title: env.title,
      spentCents: env.spentCents,
      budgetCents: env.weeklyBudgetCents,
      percentUsed:
        env.weeklyBudgetCents > 0
          ? Math.round((env.spentCents / env.weeklyBudgetCents) * 100)
          : 0,
    }))
    .sort((a, b) => b.percentUsed - a.percentUsed);

  // -- Compute week boundaries --
  const today = new Date();
  const currentWeekStart = startOfWeek(today, WEEK_OPTIONS);
  const currentWeekStartStr = format(currentWeekStart, "yyyy-MM-dd");

  // Find earliest date across all transactions
  let earliestDate = currentWeekStartStr;
  for (const tx of allTransactions) {
    if (tx.date < earliestDate) earliestDate = tx.date;
  }
  const earliestWeekStart = format(
    startOfWeek(new Date(`${earliestDate}T00:00:00`), WEEK_OPTIONS),
    "yyyy-MM-dd",
  );
  const nextWeekAfterCurrent = format(
    addWeeks(currentWeekStart, 1),
    "yyyy-MM-dd",
  );

  // -- Weekly totals (spending trend) --
  const weeklyTotals: {
    weekStart: string;
    weekLabel: string;
    totalSpentCents: number;
    totalBudgetCents: number;
  }[] = [];

  let iterWeek = earliestWeekStart;
  while (iterWeek < nextWeekAfterCurrent) {
    const iterWeekDate = new Date(`${iterWeek}T00:00:00`);
    const nextWeekDate = addWeeks(iterWeekDate, 1);
    const iterWeekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekTxs = allTransactions.filter(
      (t) => t.date >= iterWeek && t.date <= iterWeekEnd,
    );
    const totalSpent = weekTxs.reduce((sum, t) => sum + t.amountCents, 0);
    const weekNumber = getWeekNumber(iterWeekDate);

    weeklyTotals.push({
      weekStart: iterWeek,
      weekLabel: `Wk ${weekNumber}`,
      totalSpentCents: totalSpent,
      totalBudgetCents,
    });

    iterWeek = format(nextWeekDate, "yyyy-MM-dd");
  }

  // -- Weekly income --
  const weeklyIncome: {
    weekStart: string;
    weekLabel: string;
    totalIncomeCents: number;
  }[] = [];

  let incomeIterWeek = earliestWeekStart;
  while (incomeIterWeek < nextWeekAfterCurrent) {
    const iterWeekDate = new Date(`${incomeIterWeek}T00:00:00`);
    const nextWeekDate = addWeeks(iterWeekDate, 1);
    const iterWeekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekIncEntries = allIncomeEntries.filter(
      (e) => e.date >= incomeIterWeek && e.date <= iterWeekEnd,
    );
    const totalIncome = weekIncEntries.reduce(
      (sum, e) => sum + e.amountCents,
      0,
    );
    const weekNumber = getWeekNumber(iterWeekDate);

    weeklyIncome.push({
      weekStart: incomeIterWeek,
      weekLabel: `Wk ${weekNumber}`,
      totalIncomeCents: totalIncome,
    });

    incomeIterWeek = format(nextWeekDate, "yyyy-MM-dd");
  }

  // -- Pivot table rows --
  const pivotRows: {
    weekStart: string;
    weekLabel: string;
    cells: Record<string, number>;
    totalCents: number;
  }[] = [];

  let pivotIterWeek = earliestWeekStart;
  while (pivotIterWeek < nextWeekAfterCurrent) {
    const iterWeekDate = new Date(`${pivotIterWeek}T00:00:00`);
    const nextWeekDate = addWeeks(iterWeekDate, 1);
    const iterWeekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekTxs = allTransactions.filter(
      (t) => t.date >= pivotIterWeek && t.date <= iterWeekEnd,
    );

    if (weekTxs.length > 0) {
      const cells: Record<string, number> = {};
      for (const t of weekTxs) {
        cells[t.envelopeId] = (cells[t.envelopeId] ?? 0) + t.amountCents;
      }
      const pivotTotalCents = Object.values(cells).reduce(
        (sum, v) => sum + v,
        0,
      );
      const weekNumber = getWeekNumber(iterWeekDate);
      pivotRows.push({
        weekStart: pivotIterWeek,
        weekLabel: `Wk ${weekNumber}`,
        cells,
        totalCents: pivotTotalCents,
      });
    }

    pivotIterWeek = format(nextWeekDate, "yyyy-MM-dd");
  }
  pivotRows.reverse(); // newest first

  // -- Savings by week (completed weeks only) --
  const savingsByWeek: {
    weekStart: string;
    weekLabel: string;
    savingsCents: number;
    cumulativeCents: number;
  }[] = [];
  let cumulativeSavings = 0;
  let savingsIterWeek = earliestWeekStart;
  while (savingsIterWeek < currentWeekStartStr) {
    const iterWeekDate = new Date(`${savingsIterWeek}T00:00:00`);
    const nextWeekDate = addWeeks(iterWeekDate, 1);
    const iterWeekEnd = format(
      new Date(nextWeekDate.getTime() - 86_400_000),
      "yyyy-MM-dd",
    );

    const weekTxs = allTransactions.filter(
      (t) => t.date >= savingsIterWeek && t.date <= iterWeekEnd,
    );
    const weekSpent = weekTxs.reduce((sum, t) => sum + t.amountCents, 0);
    const weekSavings = Math.max(0, totalBudgetCents - weekSpent);
    cumulativeSavings += weekSavings;

    const weekNumber = getWeekNumber(iterWeekDate);
    savingsByWeek.push({
      weekStart: savingsIterWeek,
      weekLabel: `Wk ${weekNumber}`,
      savingsCents: weekSavings,
      cumulativeCents: cumulativeSavings,
    });

    savingsIterWeek = format(nextWeekDate, "yyyy-MM-dd");
  }

  const envelopeHeaders = envelopes.map((e) => ({ id: e.id, title: e.title }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. This Week */}
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

      {/* 2. Budget Utilization */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Budget Utilization
        </h2>
        <SpendingByEnvelopeChart data={spendingByEnvelope} />
      </section>

      {/* 3. Spending Distribution */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Spending Distribution
        </h2>
        <SpendingDistributionChart
          data={spendingByEnvelope.map((e) => ({
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
        <SpendingTrendChart data={weeklyTotals} />
      </section>

      {/* 5. Income vs Spending */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Income vs Spending
        </h2>
        <IncomeVsSpendingChart
          weeklyTotals={weeklyTotals}
          weeklyIncome={weeklyIncome}
          baseWeeklyIncomeCents={state.profile.averageWeeklyIncomeCents}
        />
      </section>

      {/* 6. Weekly Spending */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Weekly Spending
        </h2>
        <WeeklyPivotTable envelopes={envelopeHeaders} pivotRows={pivotRows} />
      </section>

      {/* 7. Savings Growth */}
      <section>
        <h2 className="text-lg font-semibold font-display text-primary mb-4">
          Savings Growth
        </h2>
        <SavingsChart data={savingsByWeek} />
      </section>
    </div>
  );
}
