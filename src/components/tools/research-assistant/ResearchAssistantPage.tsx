"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useResearchChat } from "@/lib/hooks/use-research-chat";
import { getModelDisplayNames } from "@/lib/research-assistant/config";
import type {
  ResearchChatState,
  ResearchTier,
} from "@/lib/research-assistant/types";
import { ChatInterface } from "./ChatInterface";
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

// ── Inner content (rendered inside AuthGuard) ───────────────────

function ResearchAssistantContent() {
  const { user } = useAuth();

  // AuthGuard guarantees user is non-null here.
  // getIdToken returns a Promise<string> for the SSE hook to attach as a Bearer token.
  const getIdToken = useCallback(async () => {
    if (!user) throw new Error("Not authenticated");
    return user.getIdToken();
  }, [user]);

  const { state, sendMessage, isStreaming } = useResearchChat(getIdToken);

  // Track the current tier for display name derivation.
  // ChatInterface manages its own tier state and passes it via onSubmit.
  // We mirror it here so ResponseDisplay always shows the correct model names.
  const [currentTier, setCurrentTier] = useState<ResearchTier>("standard");

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
        {
          id: crypto.randomUUID(),
          prompt: lastPromptRef.current,
          tier: currentTier,
          timestamp: Date.now(),
          geminiDisplayName: gemName,
          openaiDisplayName: oaName,
          state: { ...state },
        },
        ...prev,
      ]);
    }
  }, [state.overallStatus]);

  const handleSubmit = useCallback(
    (prompt: string, tier: ResearchTier) => {
      lastPromptRef.current = prompt;
      setCurrentTier(tier);
      sendMessage(prompt, tier);
    },
    [sendMessage],
  );

  const [geminiDisplayName, openaiDisplayName] =
    getModelDisplayNames(currentTier);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="mb-2 text-2xl font-bold text-primary font-display">
          Research Assistant
        </h1>
        <p className="text-text-secondary text-sm">
          Compare responses from two AI models side-by-side.
        </p>
      </header>

      <div className="space-y-6">
        <ChatInterface onSubmit={handleSubmit} isStreaming={isStreaming} />

        <ResponseDisplay
          state={state}
          geminiDisplayName={geminiDisplayName}
          openaiDisplayName={openaiDisplayName}
        />

        {/* Session history — previous prompts/responses (newest first) */}
        {sessionHistory.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-sm font-medium text-text-secondary border-b border-border pb-2">
              Previous in this session
            </h2>
            {sessionHistory.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-text-tertiary">
                  <span className="font-medium text-text-secondary">
                    {entry.prompt.slice(0, 100)}
                    {entry.prompt.length > 100 ? "..." : ""}
                  </span>
                  <span className="uppercase tracking-wide">{entry.tier}</span>
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
  );
}

// ── Exported page component with auth guard ─────────────────────

export function ResearchAssistantPage() {
  return (
    <AuthGuard>
      <ResearchAssistantContent />
    </AuthGuard>
  );
}
