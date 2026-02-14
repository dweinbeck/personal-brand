"use client";

import clsx from "clsx";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import { CREDIT_COSTS } from "@/lib/research-assistant/config";
import type { ResearchTier } from "@/lib/research-assistant/types";

// ── Props ──────────────────────────────────────────────────────

interface FollowUpInputProps {
  onSendFollowUp: (prompt: string) => void;
  disabled: boolean;
  tier: ResearchTier;
}

// ── Component ──────────────────────────────────────────────────

export function FollowUpInput({
  onSendFollowUp,
  disabled,
  tier,
}: FollowUpInputProps) {
  const [prompt, setPrompt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedPrompt = prompt.trim();
  const canSubmit = !disabled && trimmedPrompt.length > 0;
  const creditCost = CREDIT_COSTS["follow-up"][tier];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    onSendFollowUp(trimmedPrompt);
    setPrompt("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit) {
        onSendFollowUp(trimmedPrompt);
        setPrompt("");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a follow-up question..."
          disabled={disabled}
          rows={2}
          className={clsx(
            "block w-full resize-none rounded-lg border border-border px-4 py-2.5 text-sm",
            "transition-colors duration-200",
            "placeholder:text-text-tertiary",
            "focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        />
      </div>

      <button
        type="submit"
        disabled={!canSubmit}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
          "transition-all duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "bg-gradient-to-b from-primary to-primary-hover text-white",
          "border border-gold/40 shadow-sm",
          "hover:shadow-md hover:shadow-[rgba(200,165,90,0.20)]",
          "hover:scale-[1.02] active:scale-[0.98]",
        )}
      >
        {disabled ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        ) : (
          /* Send arrow icon */
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M.989 8 .064 2.68a1.342 1.342 0 0 1 1.85-1.462l13.402 5.744a1.13 1.13 0 0 1 0 2.076L1.913 14.782a1.343 1.343 0 0 1-1.85-1.463L.99 8Zm.603-4.45L2.38 7.25h4.87a.75.75 0 0 1 0 1.5H2.38l-.788 3.7L13.929 8 1.592 3.55Z" />
          </svg>
        )}
        <span>Send</span>
        <span className="text-xs opacity-80">({creditCost} cr)</span>
      </button>
    </form>
  );
}
