"use client";

import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { formatCents } from "@/lib/envelopes/format";

const COLORS = [
  "#1b2a4a",
  "#b8860b",
  "#6b8e6f",
  "#d4c9b0",
  "#4a6fa5",
  "#8b6914",
  "#2d5016",
  "#7a6b52",
];

type SpendingDistributionChartProps = {
  data: { title: string; spentCents: number }[];
};

export function SpendingDistributionChart({
  data,
}: SpendingDistributionChartProps) {
  const filtered = data.filter((d) => d.spentCents > 0);

  if (filtered.length === 0) {
    return (
      <p className="text-center text-text-secondary py-8">
        No spending data to display.
      </p>
    );
  }

  const chartData = filtered.map((d) => ({
    name: d.title,
    value: d.spentCents,
  }));

  const total = filtered.reduce((sum, d) => sum + d.spentCents, 0);

  return (
    <ResponsiveContainer width="100%" height={350}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }: { name?: string; percent?: number }) =>
            `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
          }
        >
          {chartData.map((_, index) => (
            <Cell
              key={chartData[index].name}
              fill={COLORS[index % COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | undefined) => [
            formatCents(value ?? 0),
            "Spent",
          ]}
        />
        <Legend
          formatter={(value: string) => {
            const item = chartData.find((d) => d.name === value);
            if (!item) return value;
            return `${value} (${formatCents(item.value)})`;
          }}
        />
        {/* Center label showing total */}
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-text-primary"
        >
          <tspan x="50%" dy="-0.5em" fontSize={12} fill="#4a5568">
            Total
          </tspan>
          <tspan
            x="50%"
            dy="1.4em"
            fontSize={16}
            fontWeight="bold"
            fill="#1b2a4a"
          >
            {formatCents(total)}
          </tspan>
        </text>
      </PieChart>
    </ResponsiveContainer>
  );
}
