"use client";

import clsx from "clsx";
import { type FormEvent, type KeyboardEvent, useRef, useState } from "react";
import type { ResearchTier } from "@/lib/research-assistant/types";
import { CreditBalanceDisplay } from "./CreditBalanceDisplay";

// ── Props ──────────────────────────────────────────────────────

interface ChatInterfaceProps {
  onSubmit: (prompt: string, tier: ResearchTier) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

// ── Constants ──────────────────────────────────────────────────

const MAX_PROMPT_LENGTH = 10000;

const TIER_OPTIONS: {
  value: ResearchTier;
  label: string;
  credits: number;
}[] = [
  { value: "standard", label: "Standard", credits: 10 },
  { value: "expert", label: "Expert", credits: 20 },
];

// ── Component ──────────────────────────────────────────────────

export function ChatInterface({
  onSubmit,
  isStreaming,
  disabled = false,
}: ChatInterfaceProps) {
  const [prompt, setPrompt] = useState("");
  const [tier, setTier] = useState<ResearchTier>("standard");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const trimmedPrompt = prompt.trim();
  const canSubmit = !isStreaming && !disabled && trimmedPrompt.length > 0;
  const isNearLimit = prompt.length > MAX_PROMPT_LENGTH * 0.9;
  const isOverLimit = prompt.length > MAX_PROMPT_LENGTH;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || isOverLimit) return;
    onSubmit(trimmedPrompt, tier);
    setPrompt("");
    // Refocus textarea after submit
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (canSubmit && !isOverLimit) {
        onSubmit(trimmedPrompt, tier);
        setPrompt("");
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Prompt input area — placed first for mobile-first layout */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask both models anything..."
          disabled={isStreaming || disabled}
          rows={3}
          maxLength={MAX_PROMPT_LENGTH}
          className={clsx(
            "block w-full resize-y rounded-lg border px-4 py-3 text-sm",
            "transition-colors duration-200",
            "placeholder:text-text-tertiary",
            "focus:border-gold focus:ring-1 focus:ring-gold focus:outline-none",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "min-h-[80px] max-h-[240px]",
            isOverLimit
              ? "border-[#8B1E3F] focus:border-[#8B1E3F] focus:ring-[#8B1E3F]"
              : "border-border",
          )}
        />

        {/* Character count (shown when near limit) */}
        {isNearLimit && (
          <span
            className={clsx(
              "absolute bottom-2 right-3 text-xs",
              isOverLimit ? "text-[#8B1E3F] font-medium" : "text-text-tertiary",
            )}
          >
            {prompt.length.toLocaleString()}/
            {MAX_PROMPT_LENGTH.toLocaleString()}
          </span>
        )}
      </div>

      {/* Tier toggle + balance + submit — stacked on mobile, side-by-side on sm+ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Tier toggle + credit balance — full width on mobile */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="flex items-center gap-1 rounded-lg bg-[rgba(27,42,74,0.04)] p-1 w-full sm:w-fit">
            {TIER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                disabled={isStreaming || disabled}
                onClick={() => setTier(option.value)}
                className={clsx(
                  "flex-1 sm:flex-none",
                  "relative rounded-md px-4 py-2 text-sm font-medium transition-all duration-200",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  tier === option.value
                    ? option.value === "expert"
                      ? "bg-[#8B1E3F] text-white shadow-sm"
                      : "bg-primary text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary",
                )}
              >
                {option.label}
                <span
                  className={clsx(
                    "ml-1.5 text-xs",
                    tier === option.value ? "opacity-80" : "text-text-tertiary",
                  )}
                >
                  ({option.credits} cr)
                </span>
              </button>
            ))}
          </div>
          <CreditBalanceDisplay />
        </div>

        {/* Submit + hint */}
        <div className="flex items-center justify-between gap-2 sm:justify-end">
          <p className="hidden text-xs text-text-tertiary sm:block">
            Enter to send, Shift+Enter for new line
          </p>
          <button
            type="submit"
            disabled={!canSubmit || isOverLimit}
            className={clsx(
              "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium",
              "transition-all duration-200",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "bg-gradient-to-b from-primary to-primary-hover text-white",
              "border border-gold/40 shadow-lg shadow-[rgba(27,42,74,0.20)]",
              "hover:shadow-xl hover:shadow-[rgba(200,165,90,0.20)]",
              "hover:scale-[1.03] active:scale-[0.98]",
            )}
          >
            {isStreaming ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Streaming...
              </>
            ) : (
              "Compare"
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
