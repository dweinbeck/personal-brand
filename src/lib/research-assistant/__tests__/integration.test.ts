import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Module mocks ────────────────────────────────────────────────

vi.mock("@/lib/auth/user", () => ({
  verifyUser: vi.fn(),
  unauthorizedResponse: vi.fn(
    (result: { error: string; status: number }) =>
      new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      }),
  ),
}));

vi.mock("@/lib/research-assistant/billing", () => ({
  debitForResearchAction: vi.fn(),
  finalizeResearchBilling: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/research-assistant/logger", () => ({
  createRequestLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }),
}));

vi.mock("@/lib/research-assistant/conversation-store", () => ({
  createConversation: vi.fn().mockResolvedValue("conv-123"),
  loadConversation: vi.fn(),
  appendMessages: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/research-assistant/streaming-controller", () => ({
  createParallelStream: vi.fn(() => {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode("event: complete\ndata: {}\n\n"));
        controller.close();
      },
    });
  }),
  createFollowUpStream: vi.fn(),
  createReconsiderStream: vi.fn(),
  formatSSEEvent: vi.fn(
    (event: string, data: unknown) =>
      `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
  ),
}));

vi.mock("@/lib/research-assistant/usage-logger", () => ({
  logResearchUsage: vi.fn().mockResolvedValue(undefined),
}));

// Mock AI SDK modules (required by transitive imports)
vi.mock("ai", () => ({ streamText: vi.fn() }));
vi.mock("@ai-sdk/openai", () => ({ openai: vi.fn() }));
vi.mock("@ai-sdk/google", () => ({ google: vi.fn() }));

// Mock admin auth
vi.mock("@/lib/auth/admin", () => ({
  verifyAdmin: vi.fn(),
  unauthorizedResponse: vi.fn(
    (result: { error: string; status: number }) =>
      new Response(JSON.stringify({ error: result.error }), {
        status: result.status,
        headers: { "Content-Type": "application/json" },
      }),
  ),
}));

// Mock Firestore for admin stats
vi.mock("@/lib/firebase", () => ({
  db: {
    collection: vi.fn(() => ({
      orderBy: vi.fn(() => ({
        limit: vi.fn(() => ({
          get: vi.fn().mockResolvedValue({
            docs: [
              {
                id: "log-1",
                data: () => ({
                  userId: "user-abc",
                  tier: "standard",
                  action: "prompt",
                  creditsCharged: 10,
                  geminiStatus: "success",
                  openaiStatus: "success",
                  createdAt: { toDate: () => new Date("2026-02-14") },
                }),
              },
              {
                id: "log-2",
                data: () => ({
                  userId: "user-def",
                  tier: "expert",
                  action: "reconsider",
                  creditsCharged: 10,
                  geminiStatus: "success",
                  openaiStatus: "error",
                  createdAt: { toDate: () => new Date("2026-02-13") },
                }),
              },
            ],
          }),
        })),
      })),
    })),
  },
}));

import { verifyAdmin } from "@/lib/auth/admin";
import { verifyUser } from "@/lib/auth/user";
import { debitForResearchAction } from "@/lib/research-assistant/billing";

const mockVerifyUser = vi.mocked(verifyUser);
const mockDebit = vi.mocked(debitForResearchAction);
const mockVerifyAdmin = vi.mocked(verifyAdmin);

// ── Helpers ─────────────────────────────────────────────────────

function createChatRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/tools/research-assistant/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createAdminRequest() {
  return new Request("http://localhost/api/admin/research-assistant/stats", {
    method: "GET",
    headers: { Authorization: "Bearer valid-admin-token" },
  });
}

// ── Tests ───────────────────────────────────────────────────────

describe("POST /api/tools/research-assistant/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockVerifyUser.mockResolvedValue({
      authorized: false,
      error: "No token",
      status: 401,
    });

    const { POST } = await import(
      "@/app/api/tools/research-assistant/chat/route"
    );
    const res = await POST(
      createChatRequest({ prompt: "test", tier: "standard" }),
    );

    expect(res.status).toBe(401);
  });

  it("returns 400 for invalid request body (missing prompt)", async () => {
    mockVerifyUser.mockResolvedValue({
      authorized: true,
      uid: "user-123",
      email: "test@test.com",
    });

    const { POST } = await import(
      "@/app/api/tools/research-assistant/chat/route"
    );
    const res = await POST(createChatRequest({ tier: "standard" }));

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid tier value", async () => {
    mockVerifyUser.mockResolvedValue({
      authorized: true,
      uid: "user-123",
      email: "test@test.com",
    });

    const { POST } = await import(
      "@/app/api/tools/research-assistant/chat/route"
    );
    const res = await POST(
      createChatRequest({ prompt: "test", tier: "invalid" }),
    );

    expect(res.status).toBe(400);
  });

  it("returns 402 when user has insufficient credits", async () => {
    mockVerifyUser.mockResolvedValue({
      authorized: true,
      uid: "user-123",
      email: "test@test.com",
    });

    const error = new Error("Insufficient credits") as Error & {
      statusCode: number;
    };
    error.statusCode = 402;
    mockDebit.mockRejectedValue(error);

    const { POST } = await import(
      "@/app/api/tools/research-assistant/chat/route"
    );
    const res = await POST(
      createChatRequest({ prompt: "test", tier: "standard" }),
    );

    expect(res.status).toBe(402);
    const body = await res.json();
    expect(body.code).toBe("INSUFFICIENT_CREDITS");
  });

  it("returns 200 SSE stream for valid request", async () => {
    mockVerifyUser.mockResolvedValue({
      authorized: true,
      uid: "user-123",
      email: "test@test.com",
    });
    mockDebit.mockResolvedValue({ usageId: "usage-1" });

    const { POST } = await import(
      "@/app/api/tools/research-assistant/chat/route"
    );
    const res = await POST(
      createChatRequest({ prompt: "Hello world", tier: "standard" }),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  });

  it("calls debit with correct tier tool key", async () => {
    mockVerifyUser.mockResolvedValue({
      authorized: true,
      uid: "user-123",
      email: "test@test.com",
    });
    mockDebit.mockResolvedValue({ usageId: "usage-2" });

    const { POST } = await import(
      "@/app/api/tools/research-assistant/chat/route"
    );
    await POST(createChatRequest({ prompt: "test prompt", tier: "expert" }));

    expect(mockDebit).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-123",
        tier: "expert",
        action: "prompt",
      }),
    );
  });
});

describe("GET /api/admin/research-assistant/stats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns 401 for non-admin users", async () => {
    mockVerifyAdmin.mockResolvedValue({
      authorized: false,
      error: "Forbidden.",
      status: 403,
    });

    const { GET } = await import(
      "@/app/api/admin/research-assistant/stats/route"
    );
    const res = await GET(createAdminRequest());

    expect(res.status).toBe(403);
  });

  it("returns usage stats for admin users", async () => {
    mockVerifyAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    const { GET } = await import(
      "@/app/api/admin/research-assistant/stats/route"
    );
    const res = await GET(createAdminRequest());

    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.stats.totalRequests).toBe(2);
    expect(body.stats.byTier.standard).toBe(1);
    expect(body.stats.byTier.expert).toBe(1);
    expect(body.stats.byAction.prompt).toBe(1);
    expect(body.stats.byAction.reconsider).toBe(1);
    expect(body.stats.totalCreditsSpent).toBe(20);
    expect(body.recentLogs).toHaveLength(2);
  });

  it("returns recent logs with truncated data", async () => {
    mockVerifyAdmin.mockResolvedValue({
      authorized: true,
      email: "admin@test.com",
    });

    const { GET } = await import(
      "@/app/api/admin/research-assistant/stats/route"
    );
    const res = await GET(createAdminRequest());
    const body = await res.json();

    expect(body.recentLogs[0].id).toBe("log-1");
    expect(body.recentLogs[0].tier).toBe("standard");
    expect(body.recentLogs[1].id).toBe("log-2");
    expect(body.recentLogs[1].action).toBe("reconsider");
  });
});
