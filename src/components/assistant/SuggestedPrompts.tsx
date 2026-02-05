"use client";

const SUGGESTED_PROMPTS = [
  "Best AI projects",
  "Background & experience",
  "Hiring & collaboration",
  "Current projects",
];

type SuggestedPromptsProps = {
  onSelect: (prompt: string) => void;
};

export function SuggestedPrompts({ onSelect }: SuggestedPromptsProps) {
  return (
    <div className="flex flex-col items-center gap-3 py-4 px-4">
      <p className="text-xs text-text-tertiary">Try asking about:</p>
      <div className="flex flex-wrap justify-center gap-2">
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
