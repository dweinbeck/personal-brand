import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mocks (must be before imports) -------------------------------------------

vi.mock("@/lib/auth/api-key", () => ({
  verifyApiKey: vi.fn(),
  apiKeyUnauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/gsd/capture", () => ({
  saveCapture: vi.fn(),
}));

vi.mock("@/lib/gsd/storage", () => ({
  uploadScreenshot: vi.fn(),
}));

// -- Imports ------------------------------------------------------------------

import { POST } from "@/app/api/gsd/capture/screenshot/route";
import { apiKeyUnauthorizedResponse, verifyApiKey } from "@/lib/auth/api-key";
import { saveCapture } from "@/lib/gsd/capture";
import { uploadScreenshot } from "@/lib/gsd/storage";

// -- Typed mocks --------------------------------------------------------------

const mockVerifyApiKey = vi.mocked(verifyApiKey);
const mockApiKeyUnauthorizedResponse = vi.mocked(apiKeyUnauthorizedResponse);
const mockSaveCapture = vi.mocked(saveCapture);
const mockUploadScreenshot = vi.mocked(uploadScreenshot);

// -- Helpers ------------------------------------------------------------------

function makeScreenshotRequest(file?: File | null, context?: string): Request {
  const formData = new FormData();
  if (file) {
    formData.append("screenshot", file);
  }
  if (context !== undefined) {
    formData.append("context", context);
  }
  return new Request("http://localhost/api/gsd/capture/screenshot", {
    method: "POST",
    body: formData,
  });
}

function makeTestFile(
  sizeBytes: number,
  type = "image/png",
  name = "test.png",
): File {
  const buffer = new Uint8Array(sizeBytes);
  return new File([buffer], name, { type });
}

// -- Tests --------------------------------------------------------------------

describe("POST /api/gsd/capture/screenshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authorized
    mockVerifyApiKey.mockReturnValue({ authorized: true });

    // Default: upload succeeds
    mockUploadScreenshot.mockResolvedValue(
      "gs://test-bucket/gsd-captures/test-id/screenshot.png",
    );

    // Default: save succeeds
    mockSaveCapture.mockResolvedValue(undefined);

    // Default: unauthorized response helper
    mockApiKeyUnauthorizedResponse.mockImplementation((result) =>
      Response.json({ error: result.error }, { status: result.status }),
    );
  });

  // Test 1: Valid PNG screenshot
  it("returns 202 with queued status for valid PNG screenshot", async () => {
    const file = makeTestFile(1024, "image/png", "screenshot.png");
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.status).toBe("queued");
    expect(data.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    );
    expect(mockUploadScreenshot).toHaveBeenCalledWith(
      data.id,
      expect.any(Buffer),
      "image/png",
    );
    expect(mockSaveCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "screenshot",
        screenshotUrl: "gs://test-bucket/gsd-captures/test-id/screenshot.png",
      }),
    );
  });

  // Test 2: Valid JPEG screenshot
  it("returns 202 for valid JPEG screenshot", async () => {
    const file = makeTestFile(2048, "image/jpeg", "photo.jpg");
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(data.status).toBe("queued");
    expect(data.id).toBeDefined();
    expect(mockUploadScreenshot).toHaveBeenCalledWith(
      data.id,
      expect.any(Buffer),
      "image/jpeg",
    );
  });

  // Test 3: Screenshot with optional context field
  it("returns 202 and passes context to saveCapture when provided", async () => {
    const file = makeTestFile(1024, "image/png", "screenshot.png");
    const req = makeScreenshotRequest(file, "Login page redesign");

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(202);
    expect(mockSaveCapture).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "screenshot",
        context: "Login page redesign",
      }),
    );
    expect(data.status).toBe("queued");
  });

  // Test 4: Missing API key
  it("returns 401 when API key is missing", async () => {
    mockVerifyApiKey.mockReturnValue({
      authorized: false,
      error: "Missing X-API-Key header.",
      status: 401,
    });

    const file = makeTestFile(1024, "image/png", "screenshot.png");
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe("Missing X-API-Key header.");
    expect(mockUploadScreenshot).not.toHaveBeenCalled();
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 5: No file in form data
  it("returns 400 when no file is provided", async () => {
    const req = makeScreenshotRequest(null);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("No screenshot provided.");
    expect(mockUploadScreenshot).not.toHaveBeenCalled();
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 6: File too large (>10MB)
  it("returns 413 when file exceeds 10MB", async () => {
    const file = makeTestFile(
      10 * 1024 * 1024 + 1,
      "image/png",
      "huge-screenshot.png",
    );
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(413);
    expect(data.error).toBe("File too large (10MB max).");
    expect(mockUploadScreenshot).not.toHaveBeenCalled();
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 7: Invalid content type
  it("returns 400 for non-image content type", async () => {
    const file = makeTestFile(1024, "text/plain", "notes.txt");
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe(
      "Invalid file type. Accepted: PNG, JPEG, HEIC, WebP.",
    );
    expect(mockUploadScreenshot).not.toHaveBeenCalled();
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 8: Cloud Storage upload failure
  it("returns 500 when Cloud Storage upload fails", async () => {
    mockUploadScreenshot.mockRejectedValue(new Error("Storage unavailable"));

    const file = makeTestFile(1024, "image/png", "screenshot.png");
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to upload screenshot.");
    expect(mockSaveCapture).not.toHaveBeenCalled();
  });

  // Test 9: Firestore save failure
  it("returns 500 when Firestore save fails", async () => {
    mockSaveCapture.mockRejectedValue(new Error("Firestore unavailable"));

    const file = makeTestFile(1024, "image/png", "screenshot.png");
    const req = makeScreenshotRequest(file);

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("Failed to save capture.");
  });
});
