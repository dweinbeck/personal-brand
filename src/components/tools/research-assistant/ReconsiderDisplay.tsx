"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import { getModelDisplayNames } from "@/lib/research-assistant/config";
import type {
  ModelResponse,
  ResearchTier,
} from "@/lib/research-assistant/types";
import { CopyButton } from "./CopyButton";

// ── Props ──────────────────────────────────────────────────────

interface ReconsiderDisplayProps {
  geminiResponse: ModelResponse;
  openaiResponse: ModelResponse;
  tier: ResearchTier;
}

// ── Status indicator ───────────────────────────────────────────

function StatusBadge({ status }: { status: ModelResponse["status"] }) {
  switch (status) {
    case "connecting":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-tertiary">
          <span className="inline-block h-2 w-2 rounded-full bg-text-tertiary animate-pulse" />
          Connecting
        </span>
      );
    case "streaming":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gold">
          <span className="inline-block h-2 w-2 rounded-full bg-gold animate-pulse" />
          Streaming
        </span>
      );
    case "complete":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b8e6f]">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.75.75 0 0 1 1.06-1.06L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
          </svg>
          Complete
        </span>
      );
    case "error":
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#8B1E3F]">
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06Z" />
          </svg>
          Error
        </span>
      );
    default:
      return null;
  }
}

// ── Reconsider panel ──────────────────────────────────────────

function ReconsiderPanel({
  response,
  displayName,
}: {
  response: ModelResponse;
  displayName: string;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new text arrives during streaming.
  const textLength = response.text.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: textLength is a trigger dependency for auto-scroll
  useEffect(() => {
    if (textRef.current && response.status === "streaming") {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [textLength, response.status]);

  return (
    <article className="flex flex-col rounded-lg border border-border overflow-hidden border-l-4 border-l-gold">
      {/* Header */}
      <header className="flex items-center justify-between bg-primary px-4 py-2.5">
        <h3 className="text-sm font-medium text-white">
          {displayName}{" "}
          <span className="text-gold opacity-80">&mdash; Reconsidered</span>
        </h3>
        <StatusBadge status={response.status} />
      </header>

      {/* Body */}
      <section
        ref={textRef}
        className="flex-1 overflow-y-auto p-4 min-h-[150px] max-h-[300px] sm:min-h-[200px] sm:max-h-[500px] bg-gold/[0.02]"
        aria-live="polite"
        aria-busy={response.status === "streaming"}
      >
        {response.text ? (
          <div className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed">
            {response.text}
          </div>
        ) : response.status === "idle" ? (
          <p className="text-sm text-text-tertiary italic">
            Waiting for reconsidered response...
          </p>
        ) : null}

        {/* Error message */}
        {response.error && (
          <div className="mt-3 rounded-md border border-[#8B1E3F]/20 bg-[#8B1E3F]/5 p-3">
            <p className="text-sm text-[#8B1E3F]">{response.error}</p>
          </div>
        )}
      </section>

      {/* Footer — copy button + token usage */}
      {(response.text ||
        (response.status === "complete" && response.usage)) && (
        <footer className="flex items-center justify-between border-t border-border px-4 py-2">
          {response.text && <CopyButton text={response.text} />}
          {response.status === "complete" && response.usage && (
            <span className="text-xs text-text-tertiary">
              Tokens: {response.usage.promptTokens.toLocaleString()} in /{" "}
              {response.usage.completionTokens.toLocaleString()} out
            </span>
          )}
        </footer>
      )}
    </article>
  );
}

// ── Main component ─────────────────────────────────────────────

export function ReconsiderDisplay({
  geminiResponse,
  openaiResponse,
  tier,
}: ReconsiderDisplayProps) {
  // Return null when both responses are idle with no content
  const hasContent =
    geminiResponse.text.length > 0 ||
    openaiResponse.text.length > 0 ||
    geminiResponse.status !== "idle" ||
    openaiResponse.status !== "idle";

  if (!hasContent) {
    return null;
  }

  const [geminiName, openaiName] = getModelDisplayNames(tier);

  return (
    <div className={clsx("grid gap-4", "grid-cols-1 md:grid-cols-2")}>
      <ReconsiderPanel response={geminiResponse} displayName={geminiName} />
      <ReconsiderPanel response={openaiResponse} displayName={openaiName} />
    </div>
  );
}
