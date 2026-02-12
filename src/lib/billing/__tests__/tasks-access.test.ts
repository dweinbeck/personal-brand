import { format, startOfWeek } from "date-fns";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockDebit = vi.fn();

// Minimal Firestore mock: collection -> doc -> { get, set, update }
const mockDocSnap = { exists: false, data: () => undefined };
const mockTxnGet = vi.fn().mockResolvedValue(mockDocSnap);
const mockTxnSet = vi.fn();
const mockDocUpdate = vi.fn().mockResolvedValue(undefined);

const mockDocRef = { update: mockDocUpdate };
const mockDoc = vi.fn().mockReturnValue(mockDocRef);
const mockCollection = vi.fn().mockReturnValue({ doc: mockDoc });

const mockRunTransaction = vi.fn(async (fn: (txn: unknown) => unknown) =>
  fn({ get: mockTxnGet, set: mockTxnSet }),
);

vi.mock("@/lib/firebase", () => ({
  db: {
    collection: (...args: unknown[]) => mockCollection(...args),
    runTransaction: (...args: unknown[]) =>
      mockRunTransaction(
        ...(args as [Parameters<typeof mockRunTransaction>[0]]),
      ),
  },
}));

vi.mock("@/lib/billing/firestore", () => ({
  debitForToolUse: (...args: unknown[]) => mockDebit(...args),
}));

// Import AFTER vi.mock calls so the module picks up mocked dependencies
const { checkTasksAccess } = await import("../tasks");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const currentWeekStart = format(
  startOfWeek(new Date(), { weekStartsOn: 0 }),
  "yyyy-MM-dd",
);

const TEST_UID = "test-user-123";
const TEST_EMAIL = "test@example.com";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("checkTasksAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock snap to "no doc"
    mockTxnGet.mockResolvedValue({ exists: false, data: () => undefined });
  });

  it("returns readwrite with free_week reason for first-ever access", async () => {
    // No existing billing doc -> transaction creates one with firstAccessWeekStart = currentWeekStart
    mockTxnGet.mockResolvedValue({ exists: false, data: () => undefined });

    const result = await checkTasksAccess(TEST_UID, TEST_EMAIL);

    expect(result).toEqual({
      mode: "readwrite",
      weekStart: currentWeekStart,
      reason: "free_week",
    });
    // Should have called collection("tasks_billing")
    expect(mockCollection).toHaveBeenCalledWith("tasks_billing");
  });

  it("returns readwrite for already-paid week", async () => {
    mockTxnGet.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: TEST_UID,
        firstAccessWeekStart: "2025-01-05", // some past week
        paidWeeks: {
          [currentWeekStart]: {
            usageId: "existing-usage",
            creditsCharged: 100,
            chargedAt: { seconds: 0, nanoseconds: 0 },
          },
        },
      }),
    });

    const result = await checkTasksAccess(TEST_UID, TEST_EMAIL);

    expect(result).toEqual({
      mode: "readwrite",
      weekStart: currentWeekStart,
    });
    // Should NOT have called debitForToolUse (already paid)
    expect(mockDebit).not.toHaveBeenCalled();
  });

  it("returns readwrite after successful charge", async () => {
    mockTxnGet.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: TEST_UID,
        firstAccessWeekStart: "2025-01-05",
        paidWeeks: {}, // no payment for current week
      }),
    });

    mockDebit.mockResolvedValue({
      usageId: "new-usage-id",
      creditsCharged: 100,
    });

    const result = await checkTasksAccess(TEST_UID, TEST_EMAIL);

    expect(result).toEqual({
      mode: "readwrite",
      weekStart: currentWeekStart,
    });
    // Should have called debitForToolUse
    expect(mockDebit).toHaveBeenCalledOnce();
    // Should have recorded paidWeek via doc update
    expect(mockDocUpdate).toHaveBeenCalledOnce();
  });

  it("returns readonly with unpaid reason when credits insufficient", async () => {
    mockTxnGet.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: TEST_UID,
        firstAccessWeekStart: "2025-01-05",
        paidWeeks: {},
      }),
    });

    const error402 = Object.assign(new Error("Insufficient credits"), {
      statusCode: 402,
    });
    mockDebit.mockRejectedValue(error402);

    const result = await checkTasksAccess(TEST_UID, TEST_EMAIL);

    expect(result).toEqual({
      mode: "readonly",
      weekStart: currentWeekStart,
      reason: "unpaid",
    });
  });

  it("returns readonly when tool config is missing", async () => {
    mockTxnGet.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: TEST_UID,
        firstAccessWeekStart: "2025-01-05",
        paidWeeks: {},
      }),
    });

    mockDebit.mockRejectedValue(new Error("Unknown tool: tasks_app"));

    const result = await checkTasksAccess(TEST_UID, TEST_EMAIL);

    expect(result).toEqual({
      mode: "readonly",
      weekStart: currentWeekStart,
      reason: "unpaid",
    });
  });

  it("uses correct idempotency key format", async () => {
    mockTxnGet.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: TEST_UID,
        firstAccessWeekStart: "2025-01-05",
        paidWeeks: {},
      }),
    });

    mockDebit.mockResolvedValue({
      usageId: "usage-for-key-check",
      creditsCharged: 100,
    });

    await checkTasksAccess(TEST_UID, TEST_EMAIL);

    expect(mockDebit).toHaveBeenCalledWith({
      uid: TEST_UID,
      email: TEST_EMAIL,
      toolKey: "tasks_app",
      idempotencyKey: expect.stringMatching(/^tasks_week_\d{4}-\d{2}-\d{2}$/),
    });
  });
});
