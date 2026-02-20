import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mocks (must be before imports) -------------------------------------------

vi.mock("@/lib/auth/api-key", () => ({
  verifyApiKey: vi.fn(),
  apiKeyUnauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/gsd/capture", () => ({
  saveCapture: vi.fn(),
}));

// -- Imports ------------------------------------------------------------------

import { POST } from "@/app/api/gsd/capture/route";
import { apiKeyUnauthorizedResponse, verifyApiKey } from "@/lib/auth/api-key";
import { saveCapture } from "@/lib/gsd/capture";

// -- Typed mocks --------------------------------------------------------------

const mockVerifyApiKey = vi.mocked(verifyApiKey);
const mockApiKeyUnauthorizedResponse = vi.mocked(apiKeyUnauthorizedResponse);
const mockSaveCapture = vi.mocked(saveCapture);

// -- Helpers ------------------------------------------------------------------

function makeRequest(
  body?: unknown,
  headers?: Record<string, string>,
): Request {
  const init: RequestInit = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  };
  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }
  return new Request("http://localhost/api/gsd/capture", init);
}

function makeInvalidJsonRequest(): Request {
  return new Request("http://localhost/api/gsd/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json{{{",
  });
}

// -- Tests --------------------------------------------------------------------

describe("POST /api/gsd/capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authorized
    mockVerifyApiKey.mockReturnValue({ authorized: true });

    // Default: save succeeds
    mockSaveCapture.mockResolvedValue(undefined);

    // Default: unauthorized response helper
    mockApiKeyUnauthorizedResponse.mockImplementation((result) =>
      Response.json({ error: result.error }, { status: result.status }),
    );
  });

  // Test 1: Valid request with transcript and context
  it("returns 202 with queued status for valid request with transcript and context", async () => {
    const req = makeRequest(
      { transcript: "Build a new login page", context: "mobile app" },
      { "X-API-Key": "test-key" },
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.status).toBe("queued");
    expect(data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(mockSaveCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "dictation",
        transcript: "Build a new login page",
        context: "mobile app",
      }),
    );
  });

  // Test 2: Valid request with transcript only (no context)
  it("returns 202 for valid request with transcript only", async () => {
    const req = makeRequest(
      { transcript: "Fix the navigation bug" },
      { "X-API-Key": "test-key" },
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.status).toBe("queued");
    expect(data.id).toBeDefined();
    expect(mockSaveCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "dictation",
        transcript: "Fix the navigation bug",
        context: undefined,
      }),
    );
  });

  // Test 3: Missing API key
  it("returns 401 when API key is missing", async () => {
    mockVerifyApiKey.mockReturnValue({
      authorized: false,
      error: "Missing X-API-Key header.",
      status: 401,
    });

    const req = makeRequest({ transcript: "Hello" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Missing X-API-Key header.");
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 4: Invalid JSON body
  it("returns 400 for invalid JSON body", async () => {
    const req = makeInvalidJsonRequest();

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid JSON.");
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 5: Empty transcript
  it("returns 400 when transcript is empty", async () => {
    const req = makeRequest({ transcript: "" }, { "X-API-Key": "test-key" });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.length).toBeLessThan(200);
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 6: Transcript too long
  it("returns 400 when transcript exceeds 10,000 chars", async () => {
    const longTranscript = "a".repeat(10_001);
    const req = makeRequest(
      { transcript: longTranscript },
      { "X-API-Key": "test-key" },
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(data.error.length).toBeLessThan(200);
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 7: Firestore save failure
  it("returns 500 when Firestore save fails", async () => {
    mockSaveCapture.mockRejectedValue(new Error("Firestore unavailable"));

    const req = makeRequest(
      { transcript: "Some dictation" },
      { "X-API-Key": "test-key" },
    );

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to save capture.");
  });
});
