"use client";

type StatusConfig = {
  label: string;
  colorClass: string;
  dotColor: string;
  animate: boolean;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  queued: {
    label: "Queued",
    colorClass: "text-text-tertiary",
    dotColor: "bg-text-tertiary",
    animate: true,
  },
  processing: {
    label: "Analyzing",
    colorClass: "text-amber-600",
    dotColor: "bg-amber-500",
    animate: true,
  },
  succeeded: {
    label: "Complete",
    colorClass: "text-emerald-600",
    dotColor: "bg-emerald-500",
    animate: false,
  },
  partial: {
    label: "Partial Results",
    colorClass: "text-amber-600",
    dotColor: "bg-amber-500",
    animate: false,
  },
  failed: {
    label: "Failed",
    colorClass: "text-red-600",
    dotColor: "bg-red-500",
    animate: false,
  },
};

const DEFAULT_CONFIG: StatusConfig = {
  label: "",
  colorClass: "text-text-secondary",
  dotColor: "bg-text-secondary",
  animate: false,
};

type JobStatusIndicatorProps = {
  status: string;
  isPolling: boolean;
  isTimedOut: boolean;
  error: string | null;
};

/**
 * Displays the current job status with a colored dot indicator.
 * Active states (queued/processing) show a pulsing dot animation.
 */
export function JobStatusIndicator({
  status,
  isPolling,
  isTimedOut,
  error,
}: JobStatusIndicatorProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;
  const label = config.label || status;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span
          className={`inline-block h-2 w-2 rounded-full ${config.dotColor} ${config.animate ? "animate-pulse" : ""}`}
          aria-hidden="true"
        />
        <span className={`text-sm font-medium ${config.colorClass}`}>
          {label}
        </span>
        {isPolling && (
          <span className="text-xs text-text-tertiary">Polling...</span>
        )}
      </div>
      {isTimedOut && (
        <p className="text-xs text-amber-600">
          Job is taking longer than expected.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
