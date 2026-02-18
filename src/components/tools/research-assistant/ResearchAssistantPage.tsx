"use client";

import clsx from "clsx";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import type { LoadedExchange } from "@/lib/hooks/use-research-chat";
import { useResearchChat } from "@/lib/hooks/use-research-chat";
import { getModelDisplayNames } from "@/lib/research-assistant/config";
import type {
  ResearchChatState,
  ResearchTier,
} from "@/lib/research-assistant/types";
import { ChatInterface } from "./ChatInterface";
import { ConversationHistory } from "./ConversationHistory";
import { FollowUpInput } from "./FollowUpInput";
import { ReconsiderButton } from "./ReconsiderButton";
import { ReconsiderDisplay } from "./ReconsiderDisplay";
import { ResponseDisplay } from "./ResponseDisplay";

// ── Session history (in-memory only, clears on refresh) ──────

interface SessionEntry {
  id: string;
  prompt: string;
  tier: ResearchTier;
  timestamp: number;
  geminiDisplayName: string;
  openaiDisplayName: string;
  state: ResearchChatState;
}

// ── Loaded exchange display ──────────────────────────────────

function LoadedExchangeDisplay({ exchange }: { exchange: LoadedExchange }) {
  const [gemName, oaName] = getModelDisplayNames(exchange.tier);
  const exchangeState: ResearchChatState = {
    gemini: {
      text: exchange.geminiText,
      status: "complete",
      error: undefined,
      usage: exchange.geminiUsage,
    },
    openai: {
      text: exchange.openaiText,
      status: "complete",
      error: undefined,
      usage: exchange.openaiUsage,
    },
    overallStatus: "complete",
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs text-text-tertiary">
        <span className="font-medium text-text-secondary">
          {exchange.prompt.slice(0, 100)}
          {exchange.prompt.length > 100 ? "..." : ""}
        </span>
        <span className="uppercase tracking-wide">{exchange.tier}</span>
      </div>
      <ResponseDisplay
        state={exchangeState}
        geminiDisplayName={gemName}
        openaiDisplayName={oaName}
      />
      {(exchange.geminiReconsiderText || exchange.openaiReconsiderText) && (
        <ReconsiderDisplay
          geminiResponse={{
            text: exchange.geminiReconsiderText ?? "",
            status: exchange.geminiReconsiderText ? "complete" : "idle",
            error: undefined,
            usage: undefined,
          }}
          openaiResponse={{
            text: exchange.openaiReconsiderText ?? "",
            status: exchange.openaiReconsiderText ? "complete" : "idle",
            error: undefined,
            usage: undefined,
          }}
          tier={exchange.tier}
        />
      )}
    </div>
  );
}

// ── Inner content (rendered inside AuthGuard) ───────────────────

function ResearchAssistantContent({
  initialConversationId,
}: {
  initialConversationId?: string;
}) {
  const { user } = useAuth();

  // AuthGuard guarantees user is non-null here.
  // getIdToken returns a Promise<string> for the SSE hook to attach as a Bearer token.
  const getIdToken = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }, [user]);

  const {
    state,
    sendMessage,
    isStreaming,
    sendFollowUp,
    sendReconsider,
    conversationId,
    reconsiderState,
    isReconsiderStreaming,
    canReconsider,
    loadConversation,
    loadedExchanges,
    loadedPrompt,
    isLoadingConversation,
  } = useResearchChat(getIdToken);

  // Track the current tier for display name derivation.
  // ChatInterface manages its own tier state and passes it via onSubmit.
  // We mirror it here so ResponseDisplay always shows the correct model names.
  const [currentTier, setCurrentTier] = useState<ResearchTier>("standard");

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Ref to the main content area for scrolling
  const mainRef = useRef<HTMLElement>(null);

  // Load initial conversation from URL if provided
  // biome-ignore lint/correctness/useExhaustiveDependencies: only run once on mount
  useEffect(() => {
    if (initialConversationId) {
      loadConversation(initialConversationId);
    }
  }, []);

  // Scroll to bottom when a conversation finishes loading
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally narrow dependency on conversationId and loading state
  useEffect(() => {
    if (conversationId && !isLoadingConversation && !isStreaming) {
      setTimeout(() => {
        if (mainRef.current) {
          mainRef.current.scrollTop = mainRef.current.scrollHeight;
        }
      }, 100);
    }
  }, [conversationId, isLoadingConversation]);

  // ── Session history ──────────────────────────────────────────
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);
  const lastPromptRef = useRef("");

  // Save to history when a response completes (or errors with partial content).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally narrow dependency on overallStatus transition
  useEffect(() => {
    if (
      (state.overallStatus === "complete" || state.overallStatus === "error") &&
      (state.gemini.text.length > 0 || state.openai.text.length > 0)
    ) {
      const [gemName, oaName] = getModelDisplayNames(currentTier);
      setSessionHistory((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          prompt: lastPromptRef.current,
          tier: currentTier,
          timestamp: Date.now(),
          geminiDisplayName: gemName,
          openaiDisplayName: oaName,
          state: { ...state },
        },
      ]);
    }
  }, [state.overallStatus]);

  const handleSubmit = useCallback(
    (prompt: string, tier: ResearchTier) => {
      lastPromptRef.current = prompt;
      setCurrentTier(tier);
      sendMessage(prompt, tier);
      // Close mobile sidebar when starting a new conversation
      setSidebarOpen(false);
    },
    [sendMessage],
  );

  const handleNewConversation = useCallback(() => {
    loadConversation("");
    setSessionHistory([]);
    setSidebarOpen(false);
  }, [loadConversation]);

  const handleSelectConversation = useCallback(
    (id: string) => {
      loadConversation(id);
      setSessionHistory([]);
      setSidebarOpen(false);
    },
    [loadConversation],
  );

  const [geminiDisplayName, openaiDisplayName] =
    getModelDisplayNames(currentTier);

  // Show/hide logic for Phase 3 components
  const showReconsiderButton = canReconsider;
  const showReconsiderDisplay =
    reconsiderState.gemini.text.length > 0 ||
    reconsiderState.openai.text.length > 0 ||
    reconsiderState.overallStatus !== "idle";
  const showFollowUp = state.overallStatus === "complete";

  // Determine if we have responses to show (either from streaming or loaded conversation)
  const hasCurrentResponse =
    state.gemini.text.length > 0 ||
    state.openai.text.length > 0 ||
    state.overallStatus !== "idle";

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/30 lg:hidden cursor-default"
          onClick={() => setSidebarOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSidebarOpen(false);
          }}
          tabIndex={-1}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "z-40 flex-shrink-0 overflow-hidden transition-all duration-300",
          // Mobile: off-canvas drawer
          "fixed inset-y-0 left-0 lg:relative lg:inset-auto",
          sidebarOpen
            ? "w-[280px] translate-x-0"
            : "w-0 -translate-x-full lg:w-[250px] lg:translate-x-0",
        )}
      >
        <ConversationHistory
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          currentConversationId={conversationId}
          getIdToken={getIdToken}
          refreshTrigger={conversationId}
        />
      </aside>

      {/* Main content */}
      <main ref={mainRef} className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <header className="mb-8 flex items-center gap-3">
            {/* Mobile hamburger toggle */}
            <button
              type="button"
              onClick={() => setSidebarOpen((prev) => !prev)}
              className={clsx(
                "inline-flex items-center justify-center rounded-md p-2 lg:hidden",
                "border border-border text-text-secondary",
                "hover:bg-[rgba(27,42,74,0.04)] hover:text-text-primary",
                "transition-colors duration-150",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold",
              )}
              aria-label="Toggle conversation history"
            >
              <svg
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            <div>
              <h1 className="mb-2 text-2xl font-bold text-primary font-display">
                Research
              </h1>
              <p className="text-text-secondary text-sm">
                Compare responses from two AI models side-by-side.
              </p>
            </div>
          </header>

          {/* Loading state */}
          {isLoadingConversation && (
            <div className="flex items-center justify-center py-12">
              <div className="text-text-secondary text-sm">
                Loading conversation...
              </div>
            </div>
          )}

          <div className="space-y-6">
            {/* Loaded conversation history (prior exchanges from Firestore) */}
            {loadedExchanges.length > 0 && (
              <section className="space-y-6">
                <h2 className="text-sm font-medium text-text-secondary border-b border-border pb-2">
                  Conversation Thread
                </h2>
                {loadedExchanges.map((exchange, index) => (
                  <LoadedExchangeDisplay
                    key={`loaded-${exchange.action}-${index}`}
                    exchange={exchange}
                  />
                ))}
              </section>
            )}

            {/* Loaded prompt display (shows what the user originally asked for the current exchange) */}
            {loadedPrompt && hasCurrentResponse && (
              <div className="flex items-center gap-2 text-xs text-text-tertiary">
                <span className="font-medium text-text-secondary">
                  {loadedPrompt.slice(0, 100)}
                  {loadedPrompt.length > 100 ? "..." : ""}
                </span>
              </div>
            )}

            <ChatInterface onSubmit={handleSubmit} isStreaming={isStreaming} />

            {hasCurrentResponse && (
              <ResponseDisplay
                state={state}
                geminiDisplayName={geminiDisplayName}
                openaiDisplayName={openaiDisplayName}
              />
            )}

            {/* Reconsider button -- visible when both initial responses are complete */}
            {showReconsiderButton && (
              <ReconsiderButton
                onReconsider={sendReconsider}
                disabled={!canReconsider}
                isReconsiderStreaming={isReconsiderStreaming}
                tier={currentTier}
              />
            )}

            {/* Reconsider display -- visible when reconsider has content */}
            {showReconsiderDisplay && (
              <ReconsiderDisplay
                geminiResponse={reconsiderState.gemini}
                openaiResponse={reconsiderState.openai}
                tier={currentTier}
              />
            )}

            {/* Follow-up input -- visible when initial responses are complete */}
            {showFollowUp && (
              <FollowUpInput
                onSendFollowUp={sendFollowUp}
                disabled={isStreaming || isReconsiderStreaming}
                tier={currentTier}
              />
            )}

            {/* Session history -- conversation thread (oldest first, excludes current) */}
            {sessionHistory.length > 1 && (
              <section className="space-y-6">
                <h2 className="text-sm font-medium text-text-secondary border-b border-border pb-2">
                  {loadedExchanges.length > 0
                    ? "New Exchanges"
                    : "Conversation Thread"}
                </h2>
                {sessionHistory.slice(0, -1).map((entry) => (
                  <div key={entry.id} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-text-tertiary">
                      <span className="font-medium text-text-secondary">
                        {entry.prompt.slice(0, 100)}
                        {entry.prompt.length > 100 ? "..." : ""}
                      </span>
                      <span className="uppercase tracking-wide">
                        {entry.tier}
                      </span>
                    </div>
                    <ResponseDisplay
                      state={entry.state}
                      geminiDisplayName={entry.geminiDisplayName}
                      openaiDisplayName={entry.openaiDisplayName}
                    />
                  </div>
                ))}
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

// ── Exported page component with auth guard ─────────────────────

export function ResearchAssistantPage({
  initialConversationId,
}: {
  initialConversationId?: string;
}) {
  return (
    <AuthGuard>
      <ResearchAssistantContent initialConversationId={initialConversationId} />
    </AuthGuard>
  );
}
