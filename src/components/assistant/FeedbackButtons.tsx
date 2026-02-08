"use client";

import { useState } from "react";

type FeedbackButtonsProps = {
  conversationId: string;
  messageId: string;
};

export function FeedbackButtons({
  conversationId,
  messageId,
}: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState<"up" | "down" | null>(null);

  async function handleFeedback(rating: "up" | "down") {
    setSubmitted(rating);
    try {
      await fetch("/api/assistant/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, messageId, rating }),
      });
    } catch {
      // Silently fail — feedback is non-critical
    }
  }

  if (submitted) {
    return (
      <span className="text-xs text-text-tertiary ml-2">
        {submitted === "up"
          ? "Thanks for the feedback!"
          : "Thanks — I'll try to improve."}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1 ml-2">
      <button
        type="button"
        onClick={() => handleFeedback("up")}
        className="rounded p-1 text-text-tertiary hover:text-sage hover:bg-sage/10 transition-colors"
        aria-label="Helpful response"
        title="Helpful"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M1 8.998a1 1 0 0 1 1-1h3v9H2a1 1 0 0 1-1-1v-7Zm5.5 8.5h7.167a2.5 2.5 0 0 0 2.45-2.012l1.083-5.416A1.5 1.5 0 0 0 15.73 8.5H11V3.5a2 2 0 0 0-2-2h-.25a.75.75 0 0 0-.68.436L5.5 7.998v9.5Z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={() => handleFeedback("down")}
        className="rounded p-1 text-text-tertiary hover:text-amber hover:bg-amber/10 transition-colors"
        aria-label="Not helpful response"
        title="Not helpful"
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          className="h-3.5 w-3.5"
          aria-hidden="true"
        >
          <path d="M19 11.002a1 1 0 0 1-1 1h-3v-9h3a1 1 0 0 1 1 1v7Zm-5.5-8.5H6.333a2.5 2.5 0 0 0-2.45 2.012L2.8 9.93a1.5 1.5 0 0 0 1.47 1.822H9v5a2 2 0 0 0 2 2h.25a.75.75 0 0 0 .68-.436l2.57-5.562v-9.5Z" />
        </svg>
      </button>
    </div>
  );
}
