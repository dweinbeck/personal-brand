"use client";

import { useRef, useEffect } from "react";

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
};

export function ChatInput({ value, onChange, onSubmit, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [value]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSubmit();
      }
    }
  }

  return (
    <div className="border-t border-border bg-surface px-4 py-3 sm:px-6 safe-area-bottom">
      <div className="flex items-end gap-2">
        <label htmlFor="chat-input" className="sr-only">
          Type your message
        </label>
        <textarea
          ref={textareaRef}
          id="chat-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Dan's work, projects, or skills..."
          rows={1}
          maxLength={1000}
          disabled={isLoading}
          className="flex-1 resize-none rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20 disabled:opacity-50 transition-colors"
          aria-label="Chat message input"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={!value.trim() || isLoading}
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary text-white transition-all duration-200 hover:bg-primary-hover disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-95"
          aria-label="Send message"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
      <p className="mt-1.5 text-[11px] text-text-tertiary">
        Press Enter to send, Shift+Enter for new line. Max 1000 characters.
      </p>
    </div>
  );
}
