"use client";

const SUGGESTED_PROMPTS = [
  "Show me your best AI projects",
  "What's your background and experience?",
  "How can I hire or work with you?",
  "What are you building right now?",
  "Tell me about your consulting services",
];

type SuggestedPromptsProps = {
  onSelect: (prompt: string) => void;
};

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-8 px-4">
      <p className="text-sm text-text-tertiary">Try asking about:</p>
      <div className="flex flex-wrap justify-center gap-2 max-w-lg">
        {SUGGESTED_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => onSelect(prompt)}
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm text-text-secondary transition-all duration-200 hover:border-gold/40 hover:bg-gold-light hover:text-text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
}
