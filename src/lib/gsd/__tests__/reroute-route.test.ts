import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mocks (must be before imports) -------------------------------------------

vi.mock("@/lib/auth/admin", () => ({
  verifyAdmin: vi.fn(),
  unauthorizedResponse: vi.fn(),
}));

vi.mock("@/lib/gsd/capture", () => ({
  getCapture: vi.fn(),
  updateCaptureStatus: vi.fn(),
}));

vi.mock("@/lib/gsd/destinations/github", () => ({
  routeToGitHub: vi.fn(),
}));

vi.mock("@/lib/gsd/destinations/tasks", () => ({
  routeToTask: vi.fn(),
}));

vi.mock("@/lib/gsd/discord", () => ({
  alertCaptureRouted: vi.fn(),
  alertCaptureFailed: vi.fn(),
}));

// -- Imports ------------------------------------------------------------------

import { POST } from "@/app/api/admin/builder-inbox/[id]/reroute/route";
import { unauthorizedResponse, verifyAdmin } from "@/lib/auth/admin";
import { getCapture, updateCaptureStatus } from "@/lib/gsd/capture";
import { routeToGitHub } from "@/lib/gsd/destinations/github";
import { routeToTask } from "@/lib/gsd/destinations/tasks";
import { alertCaptureFailed, alertCaptureRouted } from "@/lib/gsd/discord";

// -- Typed mocks --------------------------------------------------------------

const mockVerifyAdmin = vi.mocked(verifyAdmin);
const mockUnauthorizedResponse = vi.mocked(unauthorizedResponse);
const mockGetCapture = vi.mocked(getCapture);
const mockUpdateCaptureStatus = vi.mocked(updateCaptureStatus);
const mockRouteToGitHub = vi.mocked(routeToGitHub);
const mockRouteToTask = vi.mocked(routeToTask);
const mockAlertCaptureRouted = vi.mocked(alertCaptureRouted);
const mockAlertCaptureFailed = vi.mocked(alertCaptureFailed);

// -- Helpers ------------------------------------------------------------------

function makeRequest(
  body: unknown,
  id = "capture-123",
): {
  request: Request;
  params: Promise<{ id: string }>;
} {
  const request = new Request(
    `http://localhost/api/admin/builder-inbox/${id}/reroute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  return { request, params: Promise.resolve({ id }) };
}

function makeInvalidJsonRequest(id = "capture-123"): {
  request: Request;
  params: Promise<{ id: string }>;
} {
  const request = new Request(
    `http://localhost/api/admin/builder-inbox/${id}/reroute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not-json{{{",
    },
  );
  return { request, params: Promise.resolve({ id }) };
}

function makeCaptureDoc(overrides?: Record<string, unknown>) {
  return {
    id: "capture-123",
    type: "dictation" as const,
    transcript: "Fix the login bug",
    status: "routed",
    routingResult: {
      category: "inbox",
      title: "Fix login bug",
      summary: "Fix the login bug that prevents users from signing in",
      priority: "medium",
      confidence: 0.8,
    },
    ...overrides,
  };
}

// -- Tests --------------------------------------------------------------------

describe("POST /api/admin/builder-inbox/[id]/reroute", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authorized
    mockVerifyAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    // Default: capture exists
    mockGetCapture.mockResolvedValue(makeCaptureDoc());

    // Default: destination handlers succeed
    mockRouteToGitHub.mockResolvedValue(
      "https://github.com/owner/repo/issues/42",
    );
    mockRouteToTask.mockResolvedValue("task-id-123");

    // Default: status update succeeds
    mockUpdateCaptureStatus.mockResolvedValue(undefined);

    // Default: alerts resolve
    mockAlertCaptureRouted.mockReturnValue(undefined);
    mockAlertCaptureFailed.mockReturnValue(undefined);

    // Default: unauthorized response helper
    mockUnauthorizedResponse.mockImplementation((result) =>
      Response.json({ error: result.error }, { status: result.status }),
    );
  });

  // Test 1: Successful reroute to GitHub
  it("routes to GitHub and returns real issue URL", async () => {
    const { request, params } = makeRequest({ destination: "github_issue" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("rerouted");
    expect(data.destinationRef).toBe("https://github.com/owner/repo/issues/42");
    expect(data.destination).toBe("github_issue");

    expect(mockRouteToGitHub).toHaveBeenCalledWith(
      expect.objectContaining({ category: "github_issue" }),
    );
    expect(mockUpdateCaptureStatus).toHaveBeenCalledWith("capture-123", {
      status: "routed",
      destination: "github_issue",
      destinationRef: "https://github.com/owner/repo/issues/42",
    });
    expect(mockAlertCaptureRouted).toHaveBeenCalled();
  });

  // Test 2: Successful reroute to Tasks
  it("routes to Tasks and returns real task ID", async () => {
    const { request, params } = makeRequest({ destination: "task" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("rerouted");
    expect(data.destinationRef).toBe("task-id-123");
    expect(data.destination).toBe("task");

    expect(mockRouteToTask).toHaveBeenCalledWith(
      expect.objectContaining({ category: "task" }),
    );
    expect(mockUpdateCaptureStatus).toHaveBeenCalledWith("capture-123", {
      status: "routed",
      destination: "task",
      destinationRef: "task-id-123",
    });
  });

  // Test 3: Reroute to Inbox (no handler)
  it("routes to inbox without calling any destination handler", async () => {
    const { request, params } = makeRequest({ destination: "inbox" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe("rerouted");
    expect(data.destinationRef).toBe("inbox");
    expect(data.destination).toBe("inbox");

    expect(mockRouteToGitHub).not.toHaveBeenCalled();
    expect(mockRouteToTask).not.toHaveBeenCalled();
    expect(mockUpdateCaptureStatus).toHaveBeenCalledWith("capture-123", {
      status: "routed",
      destination: "inbox",
      destinationRef: "inbox",
    });
  });

  // Test 4: Capture not found (404)
  it("returns 404 when capture does not exist", async () => {
    mockGetCapture.mockResolvedValue(null);
    const { request, params } = makeRequest({ destination: "github_issue" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(404);
    expect(data.error).toBe("Capture not found.");
    expect(mockRouteToGitHub).not.toHaveBeenCalled();
    expect(mockUpdateCaptureStatus).not.toHaveBeenCalled();
  });

  // Test 5: Destination handler failure (500)
  it("returns 500 and marks capture as failed when handler throws", async () => {
    mockRouteToGitHub.mockRejectedValue(new Error("GITHUB_PAT not configured"));
    const { request, params } = makeRequest({ destination: "github_issue" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe("GITHUB_PAT not configured");
    expect(mockUpdateCaptureStatus).toHaveBeenCalledWith("capture-123", {
      status: "failed",
      error: "GITHUB_PAT not configured",
    });
    expect(mockAlertCaptureFailed).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "GITHUB_PAT not configured",
        captureId: "capture-123",
      }),
    );
  });

  // Test 6: Missing routingResult fallback
  it("constructs RoutingOutput from transcript when routingResult is missing", async () => {
    mockGetCapture.mockResolvedValue(makeCaptureDoc({ routingResult: null }));
    const { request, params } = makeRequest({ destination: "github_issue" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.destinationRef).toBe("https://github.com/owner/repo/issues/42");
    expect(mockRouteToGitHub).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "github_issue",
        title: "Fix the login bug",
        confidence: 1.0,
        priority: "medium",
      }),
    );
  });

  // Test 7: Unauthorized (401)
  it("returns unauthorized response when admin check fails", async () => {
    mockVerifyAdmin.mockResolvedValue({
      authorized: false,
      error: "Missing or invalid Authorization header.",
      status: 401,
    });
    const { request, params } = makeRequest({ destination: "github_issue" });

    await POST(request, { params });

    expect(mockUnauthorizedResponse).toHaveBeenCalled();
    expect(mockRouteToGitHub).not.toHaveBeenCalled();
    expect(mockGetCapture).not.toHaveBeenCalled();
  });

  // Test 8: Invalid JSON body (400)
  it("returns 400 for invalid JSON body", async () => {
    const { request, params } = makeInvalidJsonRequest();

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe("Invalid JSON.");
    expect(mockGetCapture).not.toHaveBeenCalled();
  });

  // Test 9: Invalid destination (400)
  it("returns 400 for invalid destination value", async () => {
    const { request, params } = makeRequest({ destination: "email" });

    const res = await POST(request, { params });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBeDefined();
    expect(mockGetCapture).not.toHaveBeenCalled();
  });
});
