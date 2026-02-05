type ConversationSummary = {
  id: string;
  messageCount: number;
  safetyBlocked: boolean;
  createdAt: string;
  firstMessage: string;
};

type Props = {
  conversations: ConversationSummary[];
};

export function UnansweredQuestions({ conversations }: Props) {
  const blocked = conversations.filter((c) => c.safetyBlocked);

  if (blocked.length === 0) {
    return (
      <p className="text-sm text-text-tertiary">
        No safety-blocked conversations in this period.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {blocked.map((conv) => (
        <div
          key={conv.id}
          className="rounded-lg border border-amber/30 bg-amber/5 p-3"
        >
          <p className="text-sm text-text-primary">{conv.firstMessage || "—"}</p>
          <p className="mt-1 text-xs text-text-tertiary">
            {new Date(conv.createdAt).toLocaleDateString()} &middot;{" "}
            {conv.messageCount} messages &middot; Blocked
          </p>
        </div>
      ))}
    </div>
  );
}
