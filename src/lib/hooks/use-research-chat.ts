"use client";

import { useCallback, useRef, useState } from "react";
import { SSE_EVENTS } from "../research-assistant/config";
import type {
  ModelResponse,
  ResearchChatState,
  ResearchTier,
} from "../research-assistant/types";

// ── Initial state ──────────────────────────────────────────────

const INITIAL_MODEL_RESPONSE: ModelResponse = {
  text: "",
  status: "idle",
  error: undefined,
  usage: undefined,
};

const INITIAL_STATE: ResearchChatState = {
  gemini: { ...INITIAL_MODEL_RESPONSE },
  openai: { ...INITIAL_MODEL_RESPONSE },
  overallStatus: "idle",
};

// ── Hook ───────────────────────────────────────────────────────

export function useResearchChat(getIdToken: () => Promise<string>) {
  const [state, setState] = useState<ResearchChatState>(INITIAL_STATE);
  const abortControllerRef = useRef<AbortController | null>(null);

  const processSSEEvent = useCallback(
    (eventName: string, data: Record<string, unknown>) => {
      switch (eventName) {
        case SSE_EVENTS.GEMINI:
          setState((prev) => ({
            ...prev,
            gemini: {
              ...prev.gemini,
              text: prev.gemini.text + (data.text as string),
              status: "streaming",
            },
          }));
          break;

        case SSE_EVENTS.OPENAI:
          setState((prev) => ({
            ...prev,
            openai: {
              ...prev.openai,
              text: prev.openai.text + (data.text as string),
              status: "streaming",
            },
          }));
          break;

        case SSE_EVENTS.GEMINI_DONE:
          setState((prev) => ({
            ...prev,
            gemini: {
              ...prev.gemini,
              status: "complete",
              usage: data.usage as ModelResponse["usage"],
            },
          }));
          break;

        case SSE_EVENTS.OPENAI_DONE:
          setState((prev) => ({
            ...prev,
            openai: {
              ...prev.openai,
              status: "complete",
              usage: data.usage as ModelResponse["usage"],
            },
          }));
          break;

        case SSE_EVENTS.GEMINI_ERROR:
          setState((prev) => ({
            ...prev,
            gemini: {
              ...prev.gemini,
              status: "error",
              error: data.message as string,
            },
          }));
          break;

        case SSE_EVENTS.OPENAI_ERROR:
          setState((prev) => ({
            ...prev,
            openai: {
              ...prev.openai,
              status: "error",
              error: data.message as string,
            },
          }));
          break;

        case SSE_EVENTS.COMPLETE:
          setState((prev) => ({
            ...prev,
            overallStatus: "complete",
          }));
          break;

        case SSE_EVENTS.ERROR:
          setState((prev) => ({
            ...prev,
            overallStatus: "error",
          }));
          break;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (prompt: string, tier: ResearchTier): Promise<void> => {
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Reset state
      setState({
        gemini: { ...INITIAL_MODEL_RESPONSE },
        openai: { ...INITIAL_MODEL_RESPONSE },
        overallStatus: "streaming",
      });

      let idToken: string;
      try {
        idToken = await getIdToken();
      } catch {
        setState((prev) => ({ ...prev, overallStatus: "error" }));
        return;
      }

      let response: Response;
      try {
        response = await fetch("/api/tools/research-assistant/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({ prompt, tier }),
          signal: controller.signal,
        });
      } catch (err) {
        // Abort is not an error from the user's perspective
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({ ...prev, overallStatus: "error" }));
        return;
      }

      // Handle non-SSE error responses
      if (!response.ok) {
        try {
          const body = (await response.json()) as { error?: string };
          setState((prev) => ({
            ...prev,
            overallStatus: "error",
            gemini: {
              ...prev.gemini,
              status: "error",
              error: body.error ?? `Request failed (${response.status})`,
            },
            openai: {
              ...prev.openai,
              status: "error",
              error: body.error ?? `Request failed (${response.status})`,
            },
          }));
        } catch {
          setState((prev) => ({
            ...prev,
            overallStatus: "error",
          }));
        }
        return;
      }

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        setState((prev) => ({
          ...prev,
          overallStatus: "error",
        }));
        return;
      }

      // Read the SSE stream
      if (!response.body) {
        setState((prev) => ({ ...prev, overallStatus: "error" }));
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete last line

          let currentEvent = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.slice(7).trim();
            } else if (line.startsWith("data: ") && currentEvent) {
              try {
                const data = JSON.parse(line.slice(6)) as Record<
                  string,
                  unknown
                >;
                processSSEEvent(currentEvent, data);
              } catch {
                // Skip malformed JSON lines
              }
              currentEvent = "";
            } else if (line === "") {
              currentEvent = ""; // Reset on blank line (SSE event boundary)
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({ ...prev, overallStatus: "error" }));
      }
    },
    [getIdToken, processSSEEvent],
  );

  const isStreaming: boolean = state.overallStatus === "streaming";

  return {
    state,
    sendMessage,
    isStreaming,
  };
}
