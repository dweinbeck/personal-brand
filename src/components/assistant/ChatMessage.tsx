import { MarkdownRenderer } from "./MarkdownRenderer";
import { FeedbackButtons } from "./FeedbackButtons";

type ChatMessageProps = {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  conversationId: string;
};

export function ChatMessage({
  role,
  content,
  messageId,
  conversationId,
}: ChatMessageProps) {
  const isUser = role === "user";

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
            <p className="text-sm leading-relaxed">{content}</p>
          ) : (
            <MarkdownRenderer content={content} />
          )}
        </div>
        {!isUser && content && (
          <div className="mt-1 flex items-center">
            <FeedbackButtons
              conversationId={conversationId}
              messageId={messageId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
