import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock the model-client module ──────────────────────────────
vi.mock("../model-client", () => ({
  createTierStreams: vi.fn(),
  createTierStreamsWithMessages: vi.fn(),
}));

vi.mock("../token-budget", () => ({
  checkTokenBudget: vi.fn(),
}));

// Also mock the AI SDK since model-client imports from it
vi.mock("ai", () => ({
  streamText: vi.fn(),
}));
vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(),
}));
vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(),
}));

import type { Timestamp } from "firebase-admin/firestore";
import { createTierStreamsWithMessages } from "../model-client";
import {
  createFollowUpStream,
  createReconsiderStream,
} from "../streaming-controller";
import { checkTokenBudget } from "../token-budget";
import type { MessageDoc } from "../types";

const mockCreateTierStreamsWithMessages = vi.mocked(
  createTierStreamsWithMessages,
);
const mockCheckTokenBudget = vi.mocked(checkTokenBudget);

// ── Helpers ──────────────────────────────────────────────────

function createMockStreamResult(chunks: string[], shouldError?: string) {
  return {
    textStream: (async function* () {
      for (const chunk of chunks) {
        yield chunk;
      }
      if (shouldError) throw new Error(shouldError);
    })(),
    usage: Promise.resolve({
      promptTokens: 5,
      completionTokens: 10,
      totalTokens: 15,
    }),
    finishReason: Promise.resolve("stop" as const),
  };
}

function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

async function readSSEStream(
  readable: ReadableStream<Uint8Array>,
): Promise<Array<{ event: string; data: Record<string, unknown> }>> {
  const reader = readable.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  const events: Array<{ event: string; data: Record<string, unknown> }> = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    let currentEvent = "";
    for (const line of lines) {
      if (line.startsWith("event: ")) {
        currentEvent = line.slice(7);
      } else if (line.startsWith("data: ") && currentEvent) {
        events.push({
          event: currentEvent,
          data: JSON.parse(line.slice(6)) as Record<string, unknown>,
        });
        currentEvent = "";
      }
    }
  }
  return events;
}

// ── Fake Timestamp for MessageDoc ────────────────────────────

const fakeTimestamp = {
  toDate: () => new Date(),
  seconds: 0,
  nanoseconds: 0,
  toMillis: () => 0,
  isEqual: () => true,
  valueOf: () => "0",
} as unknown as Timestamp;

// ── Test message history ─────────────────────────────────────

function createTestMessages(): MessageDoc[] {
  return [
    {
      role: "user",
      content: "What is quantum computing?",
      createdAt: fakeTimestamp,
      turnNumber: 1,
      action: "prompt",
    },
    {
      role: "gemini",
      content: "Gemini says quantum computing uses qubits.",
      createdAt: fakeTimestamp,
      turnNumber: 1,
      action: "prompt",
    },
    {
      role: "openai",
      content: "OpenAI says quantum computing leverages superposition.",
      createdAt: fakeTimestamp,
      turnNumber: 1,
      action: "prompt",
    },
  ];
}

// ── Default budget mock ──────────────────────────────────────

function mockBudgetWithinLimits() {
  mockCheckTokenBudget.mockReturnValue({
    withinBudget: true,
    totalTokens: 100,
    maxTokens: 180_000,
    remainingTokens: 179_900,
  });
}

function mockBudgetExceeded() {
  mockCheckTokenBudget.mockReturnValue({
    withinBudget: false,
    totalTokens: 200_000,
    maxTokens: 180_000,
    remainingTokens: 0,
  });
}

// ── Tests ────────────────────────────────────────────────────

describe("streaming-controller phase 3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockBudgetWithinLimits();
  });

  // ── createFollowUpStream ─────────────────────────────────

  describe("createFollowUpStream", () => {
    it("streams both models with standard SSE events (gemini, openai)", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["Follow-up", " from Gemini"]) as never,
        openai: createMockStreamResult(["Follow-up", " from OpenAI"]) as never,
      });

      const events = await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "Can you explain more?",
        }),
      );

      const geminiTexts = events
        .filter((e) => e.event === "gemini")
        .map((e) => e.data.text);
      const openaiTexts = events
        .filter((e) => e.event === "openai")
        .map((e) => e.data.text);

      expect(geminiTexts).toEqual(["Follow-up", " from Gemini"]);
      expect(openaiTexts).toEqual(["Follow-up", " from OpenAI"]);
    });

    it("calls createTierStreamsWithMessages with system prompt", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "More details?",
        }),
      );

      expect(mockCreateTierStreamsWithMessages).toHaveBeenCalledWith(
        "standard",
        expect.objectContaining({
          system:
            "You are a research assistant. Provide thorough, evidence-based answers with clear reasoning. When citing information, note the source or basis for your claims.",
        }),
      );
    });

    it("each model gets only its own assistant responses (filter by role)", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "Follow up",
        }),
      );

      const callArgs = mockCreateTierStreamsWithMessages.mock.calls[0];
      const opts = callArgs[1];

      // Gemini messages should contain user messages + gemini's assistant response
      // but NOT openai's response
      const geminiMsgs = opts.geminiMessages;
      const geminiContents = geminiMsgs.map(
        (m: { content: string }) => m.content,
      );
      expect(geminiContents).toContain("What is quantum computing?");
      expect(geminiContents).toContain(
        "Gemini says quantum computing uses qubits.",
      );
      expect(geminiContents).not.toContain(
        "OpenAI says quantum computing leverages superposition.",
      );

      // OpenAI messages should contain user messages + openai's assistant response
      // but NOT gemini's response
      const openaiMsgs = opts.openaiMessages;
      const openaiContents = openaiMsgs.map(
        (m: { content: string }) => m.content,
      );
      expect(openaiContents).toContain("What is quantum computing?");
      expect(openaiContents).toContain(
        "OpenAI says quantum computing leverages superposition.",
      );
      expect(openaiContents).not.toContain(
        "Gemini says quantum computing uses qubits.",
      );
    });

    it("follow-up prompt is appended as last user message in each model's messages", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "What about error correction?",
        }),
      );

      const callArgs = mockCreateTierStreamsWithMessages.mock.calls[0];
      const opts = callArgs[1];

      // Last message in gemini messages should be the follow-up prompt
      const lastGeminiMsg = opts.geminiMessages[opts.geminiMessages.length - 1];
      expect(lastGeminiMsg).toEqual({
        role: "user",
        content: "What about error correction?",
      });

      // Last message in openai messages should be the follow-up prompt
      const lastOpenaiMsg = opts.openaiMessages[opts.openaiMessages.length - 1];
      expect(lastOpenaiMsg).toEqual({
        role: "user",
        content: "What about error correction?",
      });
    });

    it("uses standard SSE event names (gemini-done, openai-done, complete)", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      const events = await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "Follow up",
        }),
      );

      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toContain("gemini-done");
      expect(eventTypes).toContain("openai-done");
      expect(eventTypes[eventTypes.length - 1]).toBe("complete");
    });

    it("calls onComplete with both model texts", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["Gemini ", "answer"]) as never,
        openai: createMockStreamResult(["OpenAI ", "answer"]) as never,
      });

      const onComplete = vi.fn();
      const readable = createFollowUpStream({
        tier: "standard",
        messages: createTestMessages(),
        followUpPrompt: "Follow up",
        onComplete,
      });

      await readSSEStream(readable);
      await flushMicrotasks();

      expect(onComplete).toHaveBeenCalledWith({
        geminiText: "Gemini answer",
        openaiText: "OpenAI answer",
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("returns error stream when token budget exceeded", async () => {
      mockBudgetExceeded();

      const events = await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "Follow up",
        }),
      );

      expect(mockCreateTierStreamsWithMessages).not.toHaveBeenCalled();

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.data.message).toContain("token budget exceeded");
    });
  });

  // ── createReconsiderStream ───────────────────────────────

  describe("createReconsiderStream", () => {
    it("streams both models with reconsider SSE events", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult([
          "Revised ",
          "Gemini response",
        ]) as never,
        openai: createMockStreamResult([
          "Revised ",
          "OpenAI response",
        ]) as never,
      });

      const events = await readSSEStream(
        createReconsiderStream({
          tier: "standard",
          originalPrompt: "What is AI?",
          geminiResponse: "Gemini original",
          openaiResponse: "OpenAI original",
        }),
      );

      const geminiTexts = events
        .filter((e) => e.event === "gemini-reconsider")
        .map((e) => e.data.text);
      const openaiTexts = events
        .filter((e) => e.event === "openai-reconsider")
        .map((e) => e.data.text);

      expect(geminiTexts).toEqual(["Revised ", "Gemini response"]);
      expect(openaiTexts).toEqual(["Revised ", "OpenAI response"]);
    });

    it("Gemini sees OpenAI's response as peer context and vice versa", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      await readSSEStream(
        createReconsiderStream({
          tier: "standard",
          originalPrompt: "What is AI?",
          geminiResponse: "Gemini says AI is...",
          openaiResponse: "OpenAI says AI is...",
        }),
      );

      const callArgs = mockCreateTierStreamsWithMessages.mock.calls[0];
      const opts = callArgs[1];

      // Gemini's messages: original prompt -> Gemini's own response (as assistant) -> peer prompt with OpenAI's response
      const geminiMsgs = opts.geminiMessages;
      expect(geminiMsgs[0]).toEqual({
        role: "user",
        content: "What is AI?",
      });
      expect(geminiMsgs[1]).toEqual({
        role: "assistant",
        content: "Gemini says AI is...",
      });
      // Last message should contain OpenAI's response as peer context
      const geminiPeerMsg = geminiMsgs[2].content as string;
      expect(geminiPeerMsg).toContain("OpenAI says AI is...");

      // OpenAI's messages: original prompt -> OpenAI's own response (as assistant) -> peer prompt with Gemini's response
      const openaiMsgs = opts.openaiMessages;
      expect(openaiMsgs[0]).toEqual({
        role: "user",
        content: "What is AI?",
      });
      expect(openaiMsgs[1]).toEqual({
        role: "assistant",
        content: "OpenAI says AI is...",
      });
      // Last message should contain Gemini's response as peer context
      const openaiPeerMsg = openaiMsgs[2].content as string;
      expect(openaiPeerMsg).toContain("Gemini says AI is...");
    });

    it("uses reconsider SSE event names (gemini-reconsider-done, openai-reconsider-done)", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      const events = await readSSEStream(
        createReconsiderStream({
          tier: "standard",
          originalPrompt: "What is AI?",
          geminiResponse: "Gemini response",
          openaiResponse: "OpenAI response",
        }),
      );

      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toContain("gemini-reconsider-done");
      expect(eventTypes).toContain("openai-reconsider-done");
      expect(eventTypes[eventTypes.length - 1]).toBe("complete");
    });

    it("calls onComplete with both reconsider texts", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["Revised ", "Gemini"]) as never,
        openai: createMockStreamResult(["Revised ", "OpenAI"]) as never,
      });

      const onComplete = vi.fn();
      const readable = createReconsiderStream({
        tier: "standard",
        originalPrompt: "What is AI?",
        geminiResponse: "Gemini response",
        openaiResponse: "OpenAI response",
        onComplete,
      });

      await readSSEStream(readable);
      await flushMicrotasks();

      expect(onComplete).toHaveBeenCalledWith({
        geminiText: "Revised Gemini",
        openaiText: "Revised OpenAI",
      });
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("returns error stream when token budget exceeded", async () => {
      mockBudgetExceeded();

      const events = await readSSEStream(
        createReconsiderStream({
          tier: "standard",
          originalPrompt: "What is AI?",
          geminiResponse: "Gemini response",
          openaiResponse: "OpenAI response",
        }),
      );

      expect(mockCreateTierStreamsWithMessages).not.toHaveBeenCalled();

      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(errorEvent?.data.message).toContain("token budget exceeded");
    });

    it("RECONSIDER_PROMPT_TEMPLATE used correctly — messages contain peer model name and response", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      await readSSEStream(
        createReconsiderStream({
          tier: "standard",
          originalPrompt: "What is AI?",
          geminiResponse: "Gemini original answer",
          openaiResponse: "OpenAI original answer",
        }),
      );

      const callArgs = mockCreateTierStreamsWithMessages.mock.calls[0];
      const opts = callArgs[1];

      // Gemini's peer prompt should reference the OpenAI display name and its response
      const geminiPeerPrompt = opts.geminiMessages[2].content as string;
      // Standard tier OpenAI display name is "GPT-5.2 Instant"
      expect(geminiPeerPrompt).toContain("GPT-5.2 Instant");
      expect(geminiPeerPrompt).toContain("OpenAI original answer");
      expect(geminiPeerPrompt).toContain(
        "Please reconsider your response in light of this alternative perspective",
      );

      // OpenAI's peer prompt should reference the Gemini display name and its response
      const openaiPeerPrompt = opts.openaiMessages[2].content as string;
      // Standard tier Gemini display name is "Gemini 2.5 Flash"
      expect(openaiPeerPrompt).toContain("Gemini 2.5 Flash");
      expect(openaiPeerPrompt).toContain("Gemini original answer");
      expect(openaiPeerPrompt).toContain(
        "Please reconsider your response in light of this alternative perspective",
      );
    });
  });

  // ── Error handling ───────────────────────────────────────

  describe("error handling", () => {
    it("one model fails during follow-up, other continues (per-model error isolation)", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(
          ["partial"],
          "Gemini rate limited",
        ) as never,
        openai: createMockStreamResult([
          "Full ",
          "follow-up response",
        ]) as never,
      });

      const events = await readSSEStream(
        createFollowUpStream({
          tier: "standard",
          messages: createTestMessages(),
          followUpPrompt: "Follow up",
        }),
      );

      // Gemini should have streamed partial text then errored
      const geminiTexts = events
        .filter((e) => e.event === "gemini")
        .map((e) => e.data.text);
      expect(geminiTexts).toEqual(["partial"]);

      const geminiError = events.find((e) => e.event === "gemini-error");
      expect(geminiError).toBeDefined();
      expect(geminiError?.data.message).toBe("Gemini rate limited");

      // OpenAI should have completed successfully
      const openaiTexts = events
        .filter((e) => e.event === "openai")
        .map((e) => e.data.text);
      expect(openaiTexts).toEqual(["Full ", "follow-up response"]);
      expect(events.some((e) => e.event === "openai-done")).toBe(true);
      expect(events.some((e) => e.event === "openai-error")).toBe(false);

      // Stream should complete normally
      expect(events[events.length - 1].event).toBe("complete");
    });

    it("one model fails during reconsider, other continues (per-model error isolation)", async () => {
      mockCreateTierStreamsWithMessages.mockResolvedValue({
        gemini: createMockStreamResult(["Revised ", "Gemini answer"]) as never,
        openai: createMockStreamResult(
          [],
          "OpenAI service unavailable",
        ) as never,
      });

      const events = await readSSEStream(
        createReconsiderStream({
          tier: "standard",
          originalPrompt: "What is AI?",
          geminiResponse: "Gemini response",
          openaiResponse: "OpenAI response",
        }),
      );

      // Gemini should have completed successfully with reconsider events
      const geminiTexts = events
        .filter((e) => e.event === "gemini-reconsider")
        .map((e) => e.data.text);
      expect(geminiTexts).toEqual(["Revised ", "Gemini answer"]);
      expect(events.some((e) => e.event === "gemini-reconsider-done")).toBe(
        true,
      );
      expect(events.some((e) => e.event === "gemini-reconsider-error")).toBe(
        false,
      );

      // OpenAI should have errored with reconsider error event
      const openaiError = events.find(
        (e) => e.event === "openai-reconsider-error",
      );
      expect(openaiError).toBeDefined();
      expect(openaiError?.data.message).toBe("OpenAI service unavailable");

      // Stream should still complete
      expect(events[events.length - 1].event).toBe("complete");
    });
  });
});
