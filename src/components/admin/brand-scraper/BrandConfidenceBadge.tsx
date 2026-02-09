"use client";

type ConfidenceLevel = "high" | "medium" | "low";

const styleMap: Record<ConfidenceLevel, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-600 border-red-200",
};

function scoreToLevel(score: number): ConfidenceLevel {
  if (score >= 0.85) return "high";
  if (score >= 0.6) return "medium";
  return "low";
}

type BrandConfidenceBadgeProps = {
  score: number;
};

/**
 * Displays a numeric 0-1 confidence score as a colored percentage pill badge.
 *
 * - >= 85%: emerald (high)
 * - >= 60%: amber (medium)
 * - < 60%: red (low)
 */
export function BrandConfidenceBadge({ score }: BrandConfidenceBadgeProps) {
  const level = scoreToLevel(score);
  const percentage = `${Math.round(score * 100)}%`;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styleMap[level]}`}
      title={`${percentage} confidence`}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {percentage}
    </span>
  );
}
