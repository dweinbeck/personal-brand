import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock AI SDK providers and streamText ──────────────────────
// vi.mock is hoisted, so factories must be self-contained (no outer variables).

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn(
    (modelId: string) => ({ provider: "openai", modelId }) as never,
  ),
}));

vi.mock("@ai-sdk/google", () => ({
  google: vi.fn(
    (modelId: string) => ({ provider: "google", modelId }) as never,
  ),
}));

vi.mock("ai", () => ({
  streamText: vi.fn(),
}));

// Import after mocks are set up
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { streamText } from "ai";
import {
  createModelStream,
  createModelStreamWithRetry,
  createTierStreams,
} from "../model-client";

// Cast to mocked types for assertion convenience
const mockOpenai = vi.mocked(openai);
const mockGoogle = vi.mocked(google);
const mockStreamText = vi.mocked(streamText);

// ── Helper: create a fake streamText result ───────────────────

function createFakeStreamResult() {
  return {
    textStream: (async function* () {
      yield "hello";
    })(),
    usage: Promise.resolve({
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30,
    }),
    finishReason: Promise.resolve("stop" as const),
  };
}

describe("model-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockStreamText.mockReturnValue(createFakeStreamResult() as never);
  });

  // ── createTierStreams ──────────────────────────────────────

  describe("createTierStreams", () => {
    it("returns gemini and openai stream results", async () => {
      const result = await createTierStreams("standard", "test prompt");
      expect(result.gemini).toBeDefined();
      expect(result.openai).toBeDefined();
    });

    it("calls streamText twice (once per model)", async () => {
      await createTierStreams("standard", "test prompt");
      expect(mockStreamText).toHaveBeenCalledTimes(2);
    });

    it("uses correct models for standard tier", async () => {
      await createTierStreams("standard", "test prompt");

      // Google should be called with gemini-2.5-flash
      expect(mockGoogle).toHaveBeenCalledWith("gemini-2.5-flash");
      // OpenAI should be called with gpt-5.2-chat-latest
      expect(mockOpenai).toHaveBeenCalledWith("gpt-5.2-chat-latest");
    });

    it("uses correct models for expert tier", async () => {
      await createTierStreams("expert", "test prompt");

      // Google should be called with gemini-3-pro-preview
      expect(mockGoogle).toHaveBeenCalledWith("gemini-3-pro-preview");
      // OpenAI should be called with gpt-5.2
      expect(mockOpenai).toHaveBeenCalledWith("gpt-5.2");
    });

    it("passes prompt to streamText for both models", async () => {
      await createTierStreams("standard", "my research query");

      for (const call of mockStreamText.mock.calls) {
        expect(call[0]).toMatchObject({ prompt: "my research query" });
      }
    });

    it("passes abortSignal to both streamText calls", async () => {
      const controller = new AbortController();
      await createTierStreams("standard", "test", controller.signal);

      for (const call of mockStreamText.mock.calls) {
        expect(call[0]).toMatchObject({
          abortSignal: controller.signal,
        });
      }
    });

    it("works without abortSignal (optional parameter)", async () => {
      await createTierStreams("standard", "test");

      for (const call of mockStreamText.mock.calls) {
        expect(call[0].abortSignal).toBeUndefined();
      }
    });
  });

  // ── createModelStreamWithRetry ────────────────────────────

  describe("createModelStreamWithRetry", () => {
    it("returns result on first attempt when no error", async () => {
      const fakeResult = createFakeStreamResult();
      mockStreamText.mockReturnValue(fakeResult as never);

      const result = await createModelStreamWithRetry(
        { provider: "openai", modelId: "gpt-5.2", displayName: "GPT-5.2" },
        "test prompt",
      );

      expect(result).toBe(fakeResult);
      expect(mockStreamText).toHaveBeenCalledTimes(1);
    });

    it("retries on 429 error and succeeds", async () => {
      vi.useFakeTimers();

      const fakeResult = createFakeStreamResult();
      mockStreamText
        .mockImplementationOnce(() => {
          throw new Error("429 Too Many Requests");
        })
        .mockReturnValue(fakeResult as never);

      const promise = createModelStreamWithRetry(
        { provider: "openai", modelId: "gpt-5.2", displayName: "GPT-5.2" },
        "test prompt",
      );

      await vi.advanceTimersByTimeAsync(2_000);

      const result = await promise;
      expect(result).toBe(fakeResult);
      expect(mockStreamText).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("retries on rate limit error message", async () => {
      vi.useFakeTimers();

      const fakeResult = createFakeStreamResult();
      mockStreamText
        .mockImplementationOnce(() => {
          throw new Error("rate limit exceeded");
        })
        .mockReturnValue(fakeResult as never);

      const promise = createModelStreamWithRetry(
        {
          provider: "google",
          modelId: "gemini-2.5-flash",
          displayName: "Gemini",
        },
        "test",
      );

      await vi.advanceTimersByTimeAsync(2_000);

      const result = await promise;
      expect(result).toBe(fakeResult);
      expect(mockStreamText).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });

    it("throws non-429 errors immediately without retry", async () => {
      mockStreamText.mockImplementation(() => {
        throw new Error("Authentication failed");
      });

      await expect(
        createModelStreamWithRetry(
          { provider: "openai", modelId: "gpt-5.2", displayName: "GPT-5.2" },
          "test",
        ),
      ).rejects.toThrow("Authentication failed");

      expect(mockStreamText).toHaveBeenCalledTimes(1);
    });

    it("throws after MAX_RETRIES exhausted on 429", async () => {
      vi.useFakeTimers();

      mockStreamText.mockImplementation(() => {
        throw new Error("429 Too Many Requests");
      });

      let caughtError: unknown;
      const promise = createModelStreamWithRetry(
        { provider: "openai", modelId: "gpt-5.2", displayName: "GPT-5.2" },
        "test",
      ).catch((err: unknown) => {
        caughtError = err;
      });

      // Advance through all retry delays
      await vi.advanceTimersByTimeAsync(10_000);
      await promise;

      expect(caughtError).toBeInstanceOf(Error);
      expect((caughtError as Error).message).toBe("429 Too Many Requests");

      // 1 initial + 3 retries = 4 total attempts
      expect(mockStreamText).toHaveBeenCalledTimes(4);

      vi.useRealTimers();
    });
  });

  // ── createModelStream ──────────────────────────────────────

  describe("createModelStream", () => {
    it("calls streamText with the correct model and prompt", () => {
      createModelStream(
        { provider: "openai", modelId: "gpt-5.2", displayName: "GPT-5.2" },
        "test prompt",
      );

      expect(mockOpenai).toHaveBeenCalledWith("gpt-5.2");
      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({ prompt: "test prompt" }),
      );
    });

    it("passes abortSignal to streamText", () => {
      const controller = new AbortController();
      createModelStream(
        {
          provider: "google",
          modelId: "gemini-2.5-flash",
          displayName: "Gemini 2.5 Flash",
        },
        "test",
        controller.signal,
      );

      expect(mockStreamText).toHaveBeenCalledWith(
        expect.objectContaining({ abortSignal: controller.signal }),
      );
    });

    it("returns the streamText result", () => {
      const fakeResult = createFakeStreamResult();
      mockStreamText.mockReturnValue(fakeResult as never);

      const result = createModelStream(
        {
          provider: "openai",
          modelId: "gpt-5.2-chat-latest",
          displayName: "GPT-5.2 Instant",
        },
        "test",
      );

      expect(result).toBe(fakeResult);
    });
  });
});
