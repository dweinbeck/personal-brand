"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";
import type { ConversationSummary } from "@/lib/research-assistant/types";

// ── Props ──────────────────────────────────────────────────────

interface ConversationHistoryProps {
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  currentConversationId: string | null;
  getIdToken: () => Promise<string>;
  refreshTrigger?: string | null;
}

// ── Relative time helper ────────────────────────────────────────

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;

  if (diffMs < 0 || diffMs < 60_000) return "just now";

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) return `${minutes} min ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

// ── Loading skeleton ─────────────────────────────────────────────

function ConversationSkeleton() {
  return (
    <div className="space-y-3 px-3 py-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton items
          key={i}
          className="animate-pulse space-y-2 rounded-md border border-border p-3"
        >
          <div className="h-3.5 w-3/4 rounded bg-border" />
          <div className="flex items-center gap-2">
            <div className="h-3 w-14 rounded bg-border" />
            <div className="h-3 w-16 rounded bg-border" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Component ──────────────────────────────────────────────────

export function ConversationHistory({
  onSelectConversation,
  onNewConversation,
  currentConversationId,
  getIdToken,
  refreshTrigger,
}: ConversationHistoryProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const idToken = await getIdToken();
      const response = await fetch(
        "/api/tools/research-assistant/conversations",
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to load conversations (${response.status})`);
      }

      const data = (await response.json()) as {
        conversations: ConversationSummary[];
      };
      setConversations(data.conversations);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load conversations",
      );
    } finally {
      setIsLoading(false);
    }
  }, [getIdToken]);

  // Fetch on mount and when refreshTrigger changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is an intentional trigger dependency
  useEffect(() => {
    void fetchConversations();
  }, [fetchConversations, refreshTrigger]);

  return (
    <div className="flex h-full flex-col border-r border-border bg-[rgba(27,42,74,0.02)]">
      {/* New conversation button */}
      <div className="border-b border-border p-3">
        <button
          type="button"
          onClick={onNewConversation}
          className={clsx(
            "flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium",
            "transition-all duration-200",
            "bg-gradient-to-b from-primary to-primary-hover text-white",
            "border border-gold/40 shadow-sm",
            "hover:shadow-md hover:shadow-[rgba(200,165,90,0.20)]",
            "hover:scale-[1.02] active:scale-[0.98]",
            "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
          )}
        >
          {/* Plus icon */}
          <svg
            className="h-4 w-4"
            viewBox="0 0 16 16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M7.75 2a.75.75 0 0 1 .75.75V7h4.25a.75.75 0 0 1 0 1.5H8.5v4.25a.75.75 0 0 1-1.5 0V8.5H2.75a.75.75 0 0 1 0-1.5H7V2.75A.75.75 0 0 1 7.75 2Z" />
          </svg>
          New Conversation
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <ConversationSkeleton />
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-xs text-[#8B1E3F]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchConversations()}
              className="mt-2 text-xs text-gold underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-sm text-text-tertiary">No conversations yet</p>
            <p className="mt-1 text-xs text-text-tertiary">
              Start a new conversation above
            </p>
          </div>
        ) : (
          <ul className="space-y-1 p-2">
            {conversations.map((conv) => {
              const isActive = conv.id === currentConversationId;
              return (
                <li key={conv.id}>
                  <button
                    type="button"
                    onClick={() => onSelectConversation(conv.id)}
                    className={clsx(
                      "w-full rounded-md px-3 py-2.5 text-left transition-all duration-150",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-gold",
                      isActive
                        ? "border border-gold bg-gold/5"
                        : "border border-transparent hover:border-border hover:bg-[rgba(27,42,74,0.04)]",
                    )}
                  >
                    {/* Title */}
                    <p
                      className={clsx(
                        "truncate text-sm font-medium leading-snug",
                        isActive ? "text-text-primary" : "text-text-secondary",
                      )}
                      title={conv.title}
                    >
                      {conv.title.length > 60
                        ? `${conv.title.slice(0, 60)}...`
                        : conv.title}
                    </p>

                    {/* Metadata row */}
                    <div className="mt-1 flex items-center gap-2">
                      {/* Tier badge */}
                      <span
                        className={clsx(
                          "inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium leading-none",
                          conv.tier === "expert"
                            ? "bg-[#8B1E3F]/10 text-[#8B1E3F]"
                            : "bg-primary/10 text-primary",
                        )}
                      >
                        {conv.tier === "expert" ? "Expert" : "Standard"}
                      </span>

                      {/* Relative time */}
                      <span className="text-[10px] text-text-tertiary">
                        {formatRelativeTime(conv.updatedAt)}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
