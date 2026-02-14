import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

function createSlowMockStreamResult(chunks: string[], delayMs: number) {
  return {
    textStream: (async function* () {
      for (const chunk of chunks) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        yield chunk;
      }
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

describe("streaming-controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  describe("createParallelStream", () => {
    it("returns a ReadableStream", () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult(["hello"]) as never,
        openai: createMockStreamResult(["world"]) as never,
      });
      const readable = createParallelStream("standard", "test");
      expect(readable).toBeInstanceOf(ReadableStream);
    });

    it("both models stream text events", async () => {
      mockCreateTierStreams.mockResolvedValue({
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
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });
      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );
      const eventTypes = events.map((e) => e.event);
      expect(eventTypes).toContain("gemini-done");
      expect(eventTypes).toContain("openai-done");
      expect(eventTypes[eventTypes.length - 1]).toBe("complete");
    });

    it("done events contain usage data", async () => {
      mockCreateTierStreams.mockResolvedValue({
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

    it("one model error does not break the other (NFR-2.1)", async () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult(
          ["partial"],
          "Gemini API rate limit exceeded",
        ) as never,
        openai: createMockStreamResult(["Full", " response"]) as never,
      });
      const events = await readSSEStream(
        createParallelStream("standard", "test"),
      );
      const geminiError = events.find((e) => e.event === "gemini-error");
      expect(geminiError).toBeDefined();
      expect(geminiError?.data.message).toBe("Gemini API rate limit exceeded");
      const geminiTexts = events
        .filter((e) => e.event === "gemini")
        .map((e) => e.data.text);
      expect(geminiTexts).toEqual(["partial"]);
      const openaiTexts = events
        .filter((e) => e.event === "openai")
        .map((e) => e.data.text);
      expect(openaiTexts).toEqual(["Full", " response"]);
      expect(events.some((e) => e.event === "openai-done")).toBe(true);
      expect(events.some((e) => e.event === "openai-error")).toBe(false);
      expect(events[events.length - 1].event).toBe("complete");
    });

    it("both models erroring still produces complete event", async () => {
      mockCreateTierStreams.mockResolvedValue({
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
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });
      const onComplete = vi.fn();
      const readable = createParallelStream("standard", "test", { onComplete });
      await readSSEStream(readable);
      await flushMicrotasks();
      expect(onComplete).toHaveBeenCalledWith("success");
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it("onComplete callback receives success when one model errors (partial success)", async () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult([], "Gemini failed") as never,
        openai: createMockStreamResult(["ok"]) as never,
      });
      const onComplete = vi.fn();
      const readable = createParallelStream("standard", "test", { onComplete });
      await readSSEStream(readable);
      await flushMicrotasks();
      expect(onComplete).toHaveBeenCalledWith("success");
    });

    it("passes tier and prompt to createTierStreams", async () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });
      await readSSEStream(createParallelStream("expert", "my query"));
      expect(mockCreateTierStreams).toHaveBeenCalledWith(
        "expert",
        "my query",
        expect.any(AbortSignal),
      );
    });

    it("passes combined AbortSignal (user + timeout) to createTierStreams", async () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });
      const controller = new AbortController();
      await readSSEStream(
        createParallelStream("standard", "test", {
          abortSignal: controller.signal,
        }),
      );
      const passedSignal = mockCreateTierStreams.mock.calls[0][2];
      expect(passedSignal).toBeInstanceOf(AbortSignal);
      expect(passedSignal).not.toBe(controller.signal);
    });

    it("uses timeout-only signal when no user abortSignal provided", async () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });
      await readSSEStream(createParallelStream("standard", "test"));
      const passedSignal = mockCreateTierStreams.mock.calls[0][2];
      expect(passedSignal).toBeInstanceOf(AbortSignal);
      expect(passedSignal).not.toBeUndefined();
    });
  });

  describe("heartbeat events", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    it("sends heartbeat events during streaming", async () => {
      vi.useFakeTimers();
      mockCreateTierStreams.mockResolvedValue({
        gemini: createSlowMockStreamResult(
          ["Hello", " World"],
          10_000,
        ) as never,
        openai: createSlowMockStreamResult(["Hi", " there"], 10_000) as never,
      });
      const readable = createParallelStream("standard", "test");
      const reader = readable.getReader();
      const decoder = new TextDecoder();
      const events: Array<{ event: string; data: Record<string, unknown> }> =
        [];
      let streamDone = false;
      while (!streamDone) {
        await vi.advanceTimersByTimeAsync(5_000);
        const result = await Promise.race([
          reader.read(),
          vi.advanceTimersByTimeAsync(15_000).then(() => reader.read()),
        ]);
        if (result.done) {
          streamDone = true;
          break;
        }
        const text = decoder.decode(result.value, { stream: true });
        const lines = text.split("\n");
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
      await vi.advanceTimersByTimeAsync(20_000);
      const heartbeats = events.filter((e) => e.event === "heartbeat");
      expect(heartbeats.length).toBeGreaterThanOrEqual(1);
      expect(heartbeats[0].data.ts).toBeDefined();
      expect(typeof heartbeats[0].data.ts).toBe("number");
    });

    it("does not send heartbeat events for fast-completing streams", async () => {
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult(["a"]) as never,
        openai: createMockStreamResult(["b"]) as never,
      });
      const readable = createParallelStream("standard", "test");
      const events = await readSSEStream(readable);
      const heartbeats = events.filter((e) => e.event === "heartbeat");
      expect(heartbeats.length).toBe(0);
    });
  });

  describe("streaming timeout", () => {
    it("uses standard tier timeout (60s) for standard tier", async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });
      await readSSEStream(createParallelStream("standard", "test"));
      expect(timeoutSpy).toHaveBeenCalledWith(60_000);
      timeoutSpy.mockRestore();
    });

    it("uses expert tier timeout (120s) for expert tier", async () => {
      const timeoutSpy = vi.spyOn(AbortSignal, "timeout");
      mockCreateTierStreams.mockResolvedValue({
        gemini: createMockStreamResult([]) as never,
        openai: createMockStreamResult([]) as never,
      });
      await readSSEStream(createParallelStream("expert", "test"));
      expect(timeoutSpy).toHaveBeenCalledWith(120_000);
      timeoutSpy.mockRestore();
    });

    it("onComplete receives failed when createTierStreams rejects", async () => {
      mockCreateTierStreams.mockRejectedValue(
        new Error("All retries exhausted"),
      );
      const onComplete = vi.fn();
      const readable = createParallelStream("standard", "test", { onComplete });
      const events = await readSSEStream(readable);
      await flushMicrotasks();
      const errorEvent = events.find((e) => e.event === "error");
      expect(errorEvent).toBeDefined();
      expect(onComplete).toHaveBeenCalledWith("failed");
    });
  });
});
