"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/envelopes/format";

type IncomeVsSpendingChartProps = {
  weeklyTotals: {
    weekLabel: string;
    totalSpentCents: number;
    totalBudgetCents: number;
  }[];
  weeklyIncome: { weekLabel: string; totalIncomeCents: number }[];
  baseWeeklyIncomeCents?: number;
};

export function IncomeVsSpendingChart({
  weeklyTotals,
  weeklyIncome,
  baseWeeklyIncomeCents,
}: IncomeVsSpendingChartProps) {
  if (weeklyTotals.length === 0) {
    return (
      <p className="text-center text-text-secondary py-8">
        Income and spending comparison will appear after your first week.
      </p>
    );
  }

  // Merge weeklyTotals and weeklyIncome by weekLabel
  const chartData = weeklyTotals.map((wt) => {
    const income = weeklyIncome.find((wi) => wi.weekLabel === wt.weekLabel);
    const extraIncome = income?.totalIncomeCents ?? 0;
    const base = baseWeeklyIncomeCents ?? 0;
    return {
      weekLabel: wt.weekLabel,
      income: base + extraIncome,
      spending: wt.totalSpentCents,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,42,74,0.1)" />
        <XAxis dataKey="weekLabel" tick={{ fontSize: 12, fill: "#4a5568" }} />
        <YAxis
          tickFormatter={(v) => formatCents(v)}
          tick={{ fontSize: 12, fill: "#4a5568" }}
        />
        <Tooltip
          formatter={(value: number | undefined, name: string | undefined) => [
            formatCents(value ?? 0),
            name === "income" ? "Income" : "Spending",
          ]}
        />
        <Legend
          formatter={(value: string) =>
            value === "income" ? "Income" : "Spending"
          }
        />
        <Bar
          dataKey="income"
          fill="#6b8e6f"
          name="income"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="spending"
          fill="#1b2a4a"
          name="spending"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
