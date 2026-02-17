"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCents } from "@/lib/envelopes/format";

type SpendingByEnvelopeChartProps = {
  data: {
    title: string;
    spentCents: number;
    budgetCents: number;
    percentUsed: number;
  }[];
};

export function SpendingByEnvelopeChart({
  data,
}: SpendingByEnvelopeChartProps) {
  if (data.length === 0 || data.every((d) => d.spentCents === 0)) {
    return (
      <p className="text-center text-text-secondary py-8">
        No spending data for this week.
      </p>
    );
  }

  const chartData = data.map((d) => ({
    title: d.title,
    spent: d.spentCents,
    unspent: Math.max(0, d.budgetCents - d.spentCents),
    percentUsed: d.percentUsed,
    budgetCents: d.budgetCents,
  }));

  const chartHeight = Math.max(200, data.length * 50);

  return (
    <ResponsiveContainer width="100%" height={chartHeight}>
      <BarChart layout="vertical" data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="rgba(27,42,74,0.1)"
          horizontal={false}
        />
        <XAxis
          type="number"
          tickFormatter={(v) => formatCents(v)}
          tick={{ fontSize: 12, fill: "#4a5568" }}
        />
        <YAxis
          type="category"
          dataKey="title"
          width={120}
          tick={{ fontSize: 12, fill: "#4a5568" }}
        />
        <Tooltip
          formatter={(value: number, name: string) => [
            formatCents(value),
            name === "spent" ? "Spent" : "Remaining",
          ]}
          labelFormatter={(label: string) => {
            const item = chartData.find((d) => d.title === label);
            if (!item) return label;
            return `${label} (${item.percentUsed}% of ${formatCents(item.budgetCents)})`;
          }}
        />
        <Bar
          dataKey="spent"
          stackId="budget"
          fill="#1b2a4a"
          name="spent"
          radius={[0, 0, 0, 0]}
        />
        <Bar
          dataKey="unspent"
          stackId="budget"
          fill="#d4c9b0"
          name="unspent"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
