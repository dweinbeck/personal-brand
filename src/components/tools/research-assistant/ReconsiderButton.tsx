"use client";

import clsx from "clsx";
import { CREDIT_COSTS } from "@/lib/research-assistant/config";
import type { ResearchTier } from "@/lib/research-assistant/types";

// ── Props ──────────────────────────────────────────────────────

interface ReconsiderButtonProps {
  onReconsider: () => void;
  disabled: boolean;
  tier: ResearchTier;
  isReconsiderStreaming: boolean;
}

// ── Component ──────────────────────────────────────────────────

export function ReconsiderButton({
  onReconsider,
  disabled,
  tier,
  isReconsiderStreaming,
}: ReconsiderButtonProps) {
  const creditCost = CREDIT_COSTS.reconsider[tier];

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button
        type="button"
        onClick={onReconsider}
        disabled={disabled || isReconsiderStreaming}
        className={clsx(
          "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium",
          "transition-all duration-200",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "bg-gold/10 text-gold border border-gold",
          "hover:bg-gold/20 hover:shadow-md hover:shadow-[rgba(200,165,90,0.25)]",
          "hover:scale-[1.03] active:scale-[0.98]",
        )}
      >
        {isReconsiderStreaming ? (
          <>
            {/* Spinner */}
            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
            <span>Reconsidering...</span>
          </>
        ) : (
          <>
            {/* Refresh/exchange icon */}
            <svg
              className="h-4 w-4"
              viewBox="0 0 16 16"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M1.705 8.005a.75.75 0 0 1 .834.656 5.5 5.5 0 0 0 9.592 2.97l-1.204-1.204a.25.25 0 0 1 .177-.427h3.646a.25.25 0 0 1 .25.25v3.646a.25.25 0 0 1-.427.177l-1.071-1.071A7.002 7.002 0 0 1 1.05 8.84a.75.75 0 0 1 .656-.834ZM8 2.5a5.487 5.487 0 0 0-4.131 1.869l1.204 1.204A.25.25 0 0 1 4.896 6H1.25A.25.25 0 0 1 1 5.75V2.104a.25.25 0 0 1 .427-.177l1.071 1.071A7.002 7.002 0 0 1 14.95 7.16a.75.75 0 0 1-1.49.178A5.5 5.5 0 0 0 8 2.5Z" />
            </svg>
            <span>Reconsider</span>
            <span className="text-xs opacity-80">(+{creditCost} cr)</span>
          </>
        )}
      </button>

      <p className="text-xs text-text-tertiary">
        Each model reviews the other&apos;s response
      </p>
    </div>
  );
}
