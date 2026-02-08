import { CitationList } from "./CitationList";
import { ConfidenceBadge } from "./ConfidenceBadge";
import { FeedbackButtons } from "./FeedbackButtons";
import { MarkdownRenderer } from "./MarkdownRenderer";

type ChatMessageProps = {
  role: "user" | "assistant";
  parts: Array<{
    type: string;
    text?: string;
    sourceId?: string;
    url?: string;
    title?: string;
  }>;
  metadata?: { confidence?: "low" | "medium" | "high" };
  messageId: string;
  conversationId: string;
};

export function ChatMessage({
  role,
  parts,
  metadata,
  messageId,
  conversationId,
}: ChatMessageProps) {
  const isUser = role === "user";

  const textContent = parts
    .filter((p) => p.type === "text")
    .map((p) => p.text ?? "")
    .join("");

  const citations = parts
    .filter((p) => p.type === "source-url")
    .map((p) => ({
      sourceId: p.sourceId ?? "",
      url: p.url ?? "",
      title: p.title,
    }));

  return (
    <div
      className={`flex gap-3 px-4 py-3 sm:px-6 ${isUser ? "flex-row-reverse" : ""}`}
      role="log"
      aria-label={`${isUser ? "You" : "Assistant"} said`}
    >
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          isUser
            ? "bg-gold-light text-text-primary border border-gold/40"
            : "bg-primary text-white"
        }`}
        aria-hidden="true"
      >
        {isUser ? "You" : "DW"}
      </div>

      {/* Message bubble */}
      <div className={`max-w-[80%] ${isUser ? "" : ""}`}>
        <div
          className={`rounded-2xl px-4 py-3 ${
            isUser
              ? "bg-primary text-white rounded-tr-sm"
              : "bg-surface border border-border rounded-tl-sm shadow-sm"
          }`}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{textContent}</p>
          ) : (
            <MarkdownRenderer content={textContent} />
          )}
        </div>
        {!isUser && textContent && (
          <div className="mt-1 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              {metadata?.confidence && (
                <ConfidenceBadge level={metadata.confidence} />
              )}
              <FeedbackButtons
                conversationId={conversationId}
                messageId={messageId}
              />
            </div>
            <CitationList citations={citations} />
          </div>
        )}
      </div>
    </div>
  );
}
