"use client";

import { useCallback, useState } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from "@/context/AuthContext";
import { useResearchChat } from "@/lib/hooks/use-research-chat";
import { getModelDisplayNames } from "@/lib/research-assistant/config";
import type { ResearchTier } from "@/lib/research-assistant/types";
import { ChatInterface } from "./ChatInterface";
import { ResponseDisplay } from "./ResponseDisplay";

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

  const handleSubmit = useCallback(
    (prompt: string, tier: ResearchTier) => {
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
