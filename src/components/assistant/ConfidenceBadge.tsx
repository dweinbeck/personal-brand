export type Confidence = "high" | "medium" | "low";

type ConfidenceBadgeProps = {
  level: Confidence;
};

const styleMap: Record<Confidence, string> = {
  high: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-red-50 text-red-600 border-red-200",
};

const labelMap: Record<Confidence, string> = {
  high: "High confidence",
  medium: "Medium confidence",
  low: "Low confidence",
};

export function ConfidenceBadge({ level }: ConfidenceBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${styleMap[level]}`}
      title={labelMap[level]}
    >
      <span
        className="h-1.5 w-1.5 rounded-full bg-current"
        aria-hidden="true"
      />
      {labelMap[level]}
    </span>
  );
}
