import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRequestLogger, log } from "../logger";

describe("logger", () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    delete process.env.FIREBASE_PROJECT_ID;
  });

  // ── log() ──────────────────────────────────────────────────────

  describe("log", () => {
    it("writes structured JSON to stdout via console.log", () => {
      log({
        severity: "INFO",
        message: "test message",
        component: "research-assistant",
      });

      expect(consoleSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.severity).toBe("INFO");
      expect(output.message).toBe("test message");
      expect(output.component).toBe("research-assistant");
    });

    it("includes timestamp in ISO format", () => {
      log({
        severity: "INFO",
        message: "timestamp test",
        component: "research-assistant",
      });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.timestamp).toBeDefined();
      // Verify it parses as a valid date
      expect(Number.isNaN(new Date(output.timestamp).getTime())).toBe(false);
    });

    it("includes extra fields in output", () => {
      log({
        severity: "WARNING",
        message: "with extras",
        component: "research-assistant",
        userId: "user-123",
        tier: "expert",
        promptLength: 42,
      });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.userId).toBe("user-123");
      expect(output.tier).toBe("expert");
      expect(output.promptLength).toBe(42);
    });
  });

  // ── createRequestLogger() ──────────────────────────────────────

  describe("createRequestLogger", () => {
    it("includes trace field when X-Cloud-Trace-Context header present", () => {
      process.env.FIREBASE_PROJECT_ID = "test-project";
      const request = new Request("http://localhost", {
        headers: { "X-Cloud-Trace-Context": "abc123/456;o=1" },
      });

      const logger = createRequestLogger(request);
      logger.info("test");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output["logging.googleapis.com/trace"]).toBe(
        "projects/test-project/traces/abc123",
      );
    });

    it("omits trace field when header is absent", () => {
      process.env.FIREBASE_PROJECT_ID = "test-project";
      const request = new Request("http://localhost");

      const logger = createRequestLogger(request);
      logger.info("no trace");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output["logging.googleapis.com/trace"]).toBeUndefined();
    });

    it("omits trace field when FIREBASE_PROJECT_ID is not set", () => {
      // Ensure no project ID
      delete process.env.FIREBASE_PROJECT_ID;
      const request = new Request("http://localhost", {
        headers: { "X-Cloud-Trace-Context": "abc123/456;o=1" },
      });

      const logger = createRequestLogger(request);
      logger.info("no project id");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output["logging.googleapis.com/trace"]).toBeUndefined();
    });

    it("info method maps to INFO severity", () => {
      const request = new Request("http://localhost");
      const logger = createRequestLogger(request);

      logger.info("info message");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.severity).toBe("INFO");
      expect(output.message).toBe("info message");
      expect(output.component).toBe("research-assistant");
    });

    it("warn method maps to WARNING severity", () => {
      const request = new Request("http://localhost");
      const logger = createRequestLogger(request);

      logger.warn("warn message");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.severity).toBe("WARNING");
      expect(output.message).toBe("warn message");
    });

    it("error method maps to ERROR severity", () => {
      const request = new Request("http://localhost");
      const logger = createRequestLogger(request);

      logger.error("error message");

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.severity).toBe("ERROR");
      expect(output.message).toBe("error message");
    });

    it("passes extra fields through to log output", () => {
      const request = new Request("http://localhost");
      const logger = createRequestLogger(request);

      logger.info("with extras", { latencyMs: 150, tokenCount: 500 });

      const output = JSON.parse(consoleSpy.mock.calls[0][0] as string);
      expect(output.latencyMs).toBe(150);
      expect(output.tokenCount).toBe(500);
    });
  });
});
