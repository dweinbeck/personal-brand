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

// ── SSE stream reader ─────────────────────────────────────────

async function readSSEResponse(
  response: Response,
  processEvent: (eventName: string, data: Record<string, unknown>) => void,
) {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7).trim();
      } else if (line.startsWith("data: ") && currentEvent) {
        try {
          const data = JSON.parse(line.slice(6)) as Record<string, unknown>;
          processEvent(currentEvent, data);
        } catch {
          // Skip malformed JSON lines
        }
        currentEvent = "";
      } else if (line === "") {
        currentEvent = "";
      }
    }
  }
}

// ── Hook ───────────────────────────────────────────────────────

export function useResearchChat(getIdToken: () => Promise<string>) {
  const [state, setState] = useState<ResearchChatState>(INITIAL_STATE);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [reconsiderState, setReconsiderState] = useState<ResearchChatState>({
    ...INITIAL_STATE,
  });
  const [isReconsiderStreaming, setIsReconsiderStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const tierRef = useRef<ResearchTier>("standard");

  // ── SSE event processors ─────────────────────────────────────

  const processSSEEvent = useCallback(
    (eventName: string, data: Record<string, unknown>) => {
      switch (eventName) {
        case SSE_EVENTS.CONVERSATION_ID:
          setConversationId(data.id as string);
          break;

        case SSE_EVENTS.GEMINI:
          setState((prev) => ({
            ...prev,
            overallStatus:
              prev.overallStatus === "connecting"
                ? "streaming"
                : prev.overallStatus,
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
            overallStatus:
              prev.overallStatus === "connecting"
                ? "streaming"
                : prev.overallStatus,
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

        case SSE_EVENTS.HEARTBEAT:
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

        // Reconsider events
        case SSE_EVENTS.GEMINI_RECONSIDER:
          setReconsiderState((prev) => ({
            ...prev,
            overallStatus: "streaming",
            gemini: {
              ...prev.gemini,
              text: prev.gemini.text + (data.text as string),
              status: "streaming",
            },
          }));
          break;

        case SSE_EVENTS.OPENAI_RECONSIDER:
          setReconsiderState((prev) => ({
            ...prev,
            overallStatus: "streaming",
            openai: {
              ...prev.openai,
              text: prev.openai.text + (data.text as string),
              status: "streaming",
            },
          }));
          break;

        case SSE_EVENTS.GEMINI_RECONSIDER_DONE:
          setReconsiderState((prev) => ({
            ...prev,
            gemini: {
              ...prev.gemini,
              status: "complete",
              usage: data.usage as ModelResponse["usage"],
            },
          }));
          break;

        case SSE_EVENTS.OPENAI_RECONSIDER_DONE:
          setReconsiderState((prev) => ({
            ...prev,
            openai: {
              ...prev.openai,
              status: "complete",
              usage: data.usage as ModelResponse["usage"],
            },
          }));
          break;

        case SSE_EVENTS.GEMINI_RECONSIDER_ERROR:
          setReconsiderState((prev) => ({
            ...prev,
            gemini: {
              ...prev.gemini,
              status: "error",
              error: data.message as string,
            },
          }));
          break;

        case SSE_EVENTS.OPENAI_RECONSIDER_ERROR:
          setReconsiderState((prev) => ({
            ...prev,
            openai: {
              ...prev.openai,
              status: "error",
              error: data.message as string,
            },
          }));
          break;
      }
    },
    [],
  );

  // ── Shared fetch + SSE read ──────────────────────────────────

  const fetchSSE = useCallback(
    async (
      body: Record<string, unknown>,
      signal: AbortSignal,
    ): Promise<Response | null> => {
      let idToken: string;
      try {
        idToken = await getIdToken();
      } catch {
        setState((prev) => ({ ...prev, overallStatus: "error" }));
        return null;
      }

      let response: Response;
      try {
        response = await fetch("/api/tools/research-assistant/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify(body),
          signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError")
          return null;
        setState((prev) => ({ ...prev, overallStatus: "error" }));
        return null;
      }

      if (!response.ok) {
        try {
          const errBody = (await response.json()) as { error?: string };
          setState((prev) => ({
            ...prev,
            overallStatus: "error",
            gemini: {
              ...prev.gemini,
              status: "error",
              error: errBody.error ?? `Request failed (${response.status})`,
            },
            openai: {
              ...prev.openai,
              status: "error",
              error: errBody.error ?? `Request failed (${response.status})`,
            },
          }));
        } catch {
          setState((prev) => ({ ...prev, overallStatus: "error" }));
        }
        return null;
      }

      const contentType = response.headers.get("Content-Type") ?? "";
      if (!contentType.includes("text/event-stream")) {
        setState((prev) => ({ ...prev, overallStatus: "error" }));
        return null;
      }

      return response;
    },
    [getIdToken],
  );

  // ── sendMessage (initial prompt) ─────────────────────────────

  const sendMessage = useCallback(
    async (prompt: string, tier: ResearchTier): Promise<void> => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;
      tierRef.current = tier;

      // Reset all state for new conversation
      setConversationId(null);
      setReconsiderState({ ...INITIAL_STATE });
      setIsReconsiderStreaming(false);
      setState({
        gemini: { ...INITIAL_MODEL_RESPONSE, status: "connecting" },
        openai: { ...INITIAL_MODEL_RESPONSE, status: "connecting" },
        overallStatus: "connecting",
      });

      const response = await fetchSSE(
        { prompt, tier, action: "prompt" },
        controller.signal,
      );
      if (!response) return;

      try {
        await readSSEResponse(response, processSSEEvent);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({ ...prev, overallStatus: "error" }));
      }
    },
    [fetchSSE, processSSEEvent],
  );

  // ── sendFollowUp ─────────────────────────────────────────────

  const sendFollowUp = useCallback(
    async (prompt: string): Promise<void> => {
      if (
        state.overallStatus === "connecting" ||
        state.overallStatus === "streaming" ||
        isReconsiderStreaming
      )
        return;
      if (!conversationId) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Reset initial response state for follow-up (displays in same panels)
      setReconsiderState({ ...INITIAL_STATE });
      setState({
        gemini: { ...INITIAL_MODEL_RESPONSE, status: "connecting" },
        openai: { ...INITIAL_MODEL_RESPONSE, status: "connecting" },
        overallStatus: "connecting",
      });

      const response = await fetchSSE(
        {
          prompt,
          tier: tierRef.current,
          action: "follow-up",
          conversationId,
        },
        controller.signal,
      );
      if (!response) return;

      try {
        await readSSEResponse(response, processSSEEvent);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setState((prev) => ({ ...prev, overallStatus: "error" }));
      }
    },
    [
      state.overallStatus,
      isReconsiderStreaming,
      conversationId,
      fetchSSE,
      processSSEEvent,
    ],
  );

  // ── sendReconsider ───────────────────────────────────────────

  const sendReconsider = useCallback(async (): Promise<void> => {
    if (
      state.overallStatus === "connecting" ||
      state.overallStatus === "streaming" ||
      isReconsiderStreaming
    )
      return;
    if (!conversationId) return;
    if (
      state.gemini.status !== "complete" ||
      state.openai.status !== "complete"
    )
      return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Reset reconsider state, keep initial responses
    setReconsiderState({
      gemini: { ...INITIAL_MODEL_RESPONSE, status: "connecting" },
      openai: { ...INITIAL_MODEL_RESPONSE, status: "connecting" },
      overallStatus: "connecting",
    });
    setIsReconsiderStreaming(true);

    const response = await fetchSSE(
      {
        prompt: "",
        tier: tierRef.current,
        action: "reconsider",
        conversationId,
      },
      controller.signal,
    );

    if (!response) {
      setIsReconsiderStreaming(false);
      return;
    }

    try {
      await readSSEResponse(response, (eventName, data) => {
        processSSEEvent(eventName, data);
        // Track when reconsider streaming completes
        if (
          eventName === SSE_EVENTS.COMPLETE ||
          eventName === SSE_EVENTS.ERROR
        ) {
          setIsReconsiderStreaming(false);
          setReconsiderState((prev) => ({
            ...prev,
            overallStatus:
              eventName === SSE_EVENTS.COMPLETE ? "complete" : "error",
          }));
        }
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setIsReconsiderStreaming(false);
        return;
      }
      setIsReconsiderStreaming(false);
      setReconsiderState((prev) => ({ ...prev, overallStatus: "error" }));
    }
  }, [
    state.overallStatus,
    state.gemini.status,
    state.openai.status,
    isReconsiderStreaming,
    conversationId,
    fetchSSE,
    processSSEEvent,
  ]);

  // ── loadConversation ─────────────────────────────────────────

  const loadConversation = useCallback((id: string) => {
    setConversationId(id || null);
  }, []);

  // ── Derived state ────────────────────────────────────────────

  const isStreaming: boolean =
    state.overallStatus === "connecting" || state.overallStatus === "streaming";

  const canReconsider: boolean =
    state.gemini.status === "complete" &&
    state.openai.status === "complete" &&
    !isStreaming &&
    !isReconsiderStreaming &&
    conversationId !== null;

  return {
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
  };
}
