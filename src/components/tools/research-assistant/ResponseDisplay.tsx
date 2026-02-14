"use client";

import clsx from "clsx";
import { useEffect, useRef } from "react";
import type {
  ModelResponse,
  ResearchChatState,
} from "@/lib/research-assistant/types";

// ── Props ──────────────────────────────────────────────────────

interface ResponseDisplayProps {
  state: ResearchChatState;
  geminiDisplayName: string;
  openaiDisplayName: string;
}

// ── Status indicator ───────────────────────────────────────────

function StatusBadge({ status }: { status: ModelResponse["status"] }) {
  switch (status) {
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

// ── Model panel ────────────────────────────────────────────────

function ModelPanel({
  response,
  displayName,
}: {
  response: ModelResponse;
  displayName: string;
}) {
  const textRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new text arrives during streaming.
  // textLength is an intentional trigger dep so the effect fires on each chunk.
  const textLength = response.text.length;
  // biome-ignore lint/correctness/useExhaustiveDependencies: textLength is a trigger dependency for auto-scroll
  useEffect(() => {
    if (textRef.current && response.status === "streaming") {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [textLength, response.status]);

  return (
    <article className="flex flex-col rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between bg-primary px-4 py-2.5">
        <h3 className="text-sm font-medium text-white">{displayName}</h3>
        <StatusBadge status={response.status} />
      </header>

      {/* Body */}
      <section
        ref={textRef}
        className="flex-1 overflow-y-auto p-4 min-h-[200px] max-h-[500px]"
        aria-live="polite"
        aria-busy={response.status === "streaming"}
      >
        {response.text ? (
          <div className="whitespace-pre-wrap text-sm text-text-primary leading-relaxed">
            {response.text}
          </div>
        ) : response.status === "idle" ? (
          <p className="text-sm text-text-tertiary italic">
            Waiting for response...
          </p>
        ) : null}

        {/* Error message */}
        {response.error && (
          <div className="mt-3 rounded-md border border-[#8B1E3F]/20 bg-[#8B1E3F]/5 p-3">
            <p className="text-sm text-[#8B1E3F]">{response.error}</p>
          </div>
        )}
      </section>

      {/* Footer — token usage (visible only when complete) */}
      {response.status === "complete" && response.usage && (
        <footer className="border-t border-border px-4 py-2 text-xs text-text-tertiary">
          Tokens: {response.usage.promptTokens.toLocaleString()} in /{" "}
          {response.usage.completionTokens.toLocaleString()} out
        </footer>
      )}
    </article>
  );
}

// ── Main component ─────────────────────────────────────────────

export function ResponseDisplay({
  state,
  geminiDisplayName,
  openaiDisplayName,
}: ResponseDisplayProps) {
  const hasContent =
    state.gemini.text.length > 0 ||
    state.openai.text.length > 0 ||
    state.overallStatus === "streaming";

  // Empty state — no panels shown
  if (state.overallStatus === "idle" && !hasContent) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-16 px-4">
        <p className="text-sm text-text-tertiary text-center">
          Submit a prompt above to compare models side-by-side
        </p>
      </div>
    );
  }

  return (
    <div className={clsx("grid gap-4", "grid-cols-1 md:grid-cols-2")}>
      <ModelPanel response={state.gemini} displayName={geminiDisplayName} />
      <ModelPanel response={state.openai} displayName={openaiDisplayName} />
    </div>
  );
}
