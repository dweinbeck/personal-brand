import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock the model-client module ──────────────────────────────
// createParallelStream calls createTierStreams internally.
// We mock it to return controllable fake stream results.

vi.mock("../model-client", () => ({
  createTierStreams: vi.fn(),
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

import { createTierStreams } from "../model-client";
import { createParallelStream, formatSSEEvent } from "../streaming-controller";

const mockCreateTierStreams = vi.mocked(createTierStreams);

// ── Helper: create a mock stream result ───────────────────────

function createMockStreamResult(chunks: string[], shouldError?: string) {
  // When shouldError is set, the textStream throws after yielding chunks.
  // The usage promise resolves normally because pipeModelStream catches
  // the textStream error before it ever awaits usage — a rejected usage
  // promise would cause an unhandled rejection in tests.
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

/** Wait for microtasks to flush (gives Promise.all .then() time to fire). */
function flushMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 10));
}

// ── Helper: read and parse SSE events from a ReadableStream ───

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

    // Parse SSE events from buffer
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

describe("streaming-controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── formatSSEEvent ─────────────────────────────────────────

  describe("formatSSEEvent", () => {
    it("produces valid SSE format", () => {
      const result = formatSSEEvent("test-event", { key: "value" });
      expect(result).toBe('event: test-event\ndata: {"key":"value"}\n\n');
    });

    it("serializes nested objects correctly", () => {
      const result = formatSSEEvent("data", { nested: { a: 1 } });
      expect(result).toBe('event: data\ndata: {"nested":{"a":1}}\n\n');
    });

    it("handles empty data objects", () => {
      const result = formatSSEEvent("complete", {});
      expect(result).toBe("event: complete\ndata: {}\n\n");
    });
  });

  // ── createParallelStream ───────────────────────────────────

  describe("createParallelStream", () => {
    it("returns a ReadableStream", () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult(["hello"]) as never,
        openai: createMockStreamResult(["world"]) as never,
      });

      const readable = createParallelStream("standard", "test");
      expect(readable).toBeInstanceOf(ReadableStream);
    });

    it("both models stream text events", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult(["Hello", " World"]) as never,
        openai: createMockStreamResult(["Hi", " there"]) as never,
      });

      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );

      const geminiTexts = events
        .filter((e) => e.event === "gemini")
        .map((e) => e.data.text);
      const openaiTexts = events
        .filter((e) => e.event === "openai")
        .map((e) => e.data.text);

      expect(geminiTexts).toEqual(["Hello", " World"]);
      expect(openaiTexts).toEqual(["Hi", " there"]);
    });

    it("stream ends with done events and complete event", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );

      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toContain("gemini-done");
      expect(eventTypes).toContain("openai-done");
      // complete must be the last event
      expect(eventTypes[eventTypes.length - 1]).toBe("complete");
    });

    it("done events contain usage data", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );

      const geminiDone = events.find((e) => e.event === "gemini-done");
      expect(geminiDone).toBeDefined();
      expect(geminiDone?.data.usage).toEqual({
        promptTokens: 5,
        completionTokens: 10,
        totalTokens: 15,
      });
    });

    // ── NFR-2.1: Error isolation ───────────────────────────

    it("one model error does not break the other (NFR-2.1)", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult(
          ["partial"],
          "Gemini API rate limit exceeded",
        ) as never,
        openai: createMockStreamResult(["Full", " response"]) as never,
      });

      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );

      // Gemini should have an error event
      const geminiError = events.find((e) => e.event === "gemini-error");
      expect(geminiError).toBeDefined();
      expect(geminiError?.data.message).toBe("Gemini API rate limit exceeded");

      // Gemini still streamed its partial text before error
      const geminiTexts = events
        .filter((e) => e.event === "gemini")
        .map((e) => e.data.text);
      expect(geminiTexts).toEqual(["partial"]);

      // OpenAI completed normally with all its text
      const openaiTexts = events
        .filter((e) => e.event === "openai")
        .map((e) => e.data.text);
      expect(openaiTexts).toEqual(["Full", " response"]);

      // OpenAI has a done event (not an error)
      expect(events.some((e) => e.event === "openai-done")).toBe(true);
      expect(events.some((e) => e.event === "openai-error")).toBe(false);

      // Stream still completes
      expect(events[events.length - 1].event).toBe("complete");
    });

    it("both models erroring still produces complete event", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult([], "Gemini failed") as never,
        openai: createMockStreamResult([], "OpenAI failed") as never,
      });

      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );

      expect(events.some((e) => e.event === "gemini-error")).toBe(true);
      expect(events.some((e) => e.event === "openai-error")).toBe(true);
      expect(events[events.length - 1].event).toBe("complete");
    });

    it("onComplete callback receives success when both models succeed", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });

      const onComplete = vi.fn();
      const readable = createParallelStream("standard", "test", {
        onComplete,
      });

      await readSSEStream(readable);
      // onComplete fires in Promise.all .then() after writer.close()
      await flushMicrotasks();

      expect(onComplete).toHaveBeenCalledWith("success");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("onComplete callback receives success when one model errors (partial success)", async () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult([], "Gemini failed") as never,
        openai: createMockStreamResult(["ok"]) as never,
      });

      const onComplete = vi.fn();
      const readable = createParallelStream("standard", "test", {
        onComplete,
      });

      await readSSEStream(readable);
      await flushMicrotasks();

      // Per-model errors are caught in pipeModelStream -- Promise.all
      // still resolves successfully, so onComplete gets "success"
      expect(onComplete).toHaveBeenCalledWith("success");
    });

    it("passes tier and prompt to createTierStreams", () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });

      createParallelStream("expert", "my query");

      expect(mockCreateTierStreams).toHaveBeenCalledWith(
        "expert",
        "my query",
        undefined,
      );
    });

    it("passes abortSignal to createTierStreams", () => {
      mockCreateTierStreams.mockReturnValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });

      const controller = new AbortController();
      createParallelStream("standard", "test", {
        abortSignal: controller.signal,
      });

      expect(mockCreateTierStreams).toHaveBeenCalledWith(
        "standard",
        "test",
        controller.signal,
      );
    });
  });
});
