export function TypingIndicator() {
  return (
    <output
      className="flex items-center gap-1.5 px-4 py-3"
      aria-label="Assistant is typing"
    >
      <span className="sr-only">Assistant is typing</span>
      <span className="typing-dot h-2 w-2 rounded-full bg-text-tertiary" />
      <span className="typing-dot h-2 w-2 rounded-full bg-text-tertiary [animation-delay:0.15s]" />
      <span className="typing-dot h-2 w-2 rounded-full bg-text-tertiary [animation-delay:0.3s]" />
    </output>
  );
}
