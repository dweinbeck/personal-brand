import type { AnalyticsData } from "@/lib/assistant/analytics";

type Props = {
  data: AnalyticsData;
  period: string;
};

export function AssistantAnalytics({ data, period }: Props) {
  const feedbackTotal = data.feedbackUp + data.feedbackDown;
  const satisfactionRate =
    feedbackTotal > 0
      ? Math.round((data.feedbackUp / feedbackTotal) * 100)
      : null;

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Conversations"
        value={data.totalConversations}
        sub={period}
      />
      <StatCard label="Total Messages" value={data.totalMessages} sub={period} />
      <StatCard
        label="Safety Blocked"
        value={data.safetyBlockedCount}
        sub="injection attempts"
      />
      <StatCard
        label="Satisfaction"
        value={satisfactionRate !== null ? `${satisfactionRate}%` : "N/A"}
        sub={`${feedbackTotal} ratings`}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
      <p className="text-xs font-medium text-text-tertiary uppercase tracking-wide">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
      <p className="mt-0.5 text-xs text-text-tertiary">{sub}</p>
    </div>
  );
}
