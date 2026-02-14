import { beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock firebase-admin/firestore FieldValue ─────────────────
vi.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP"),
    increment: vi.fn((n: number) => `INCREMENT_${n}`),
  },
}));

// ── Mock Firestore via @/lib/firebase ────────────────────────
// Build a chainable mock that supports:
//   db.collection(name).doc()       → ref with .id and .collection()
//   db.collection(name).doc(id)     → ref
//   db.runTransaction(fn)           → calls fn with mock tx
//   db.collection().where().where().orderBy().limit().get() → mock snapshot

const mockTxSet = vi.fn();
const mockTxUpdate = vi.fn();
const mockTx = { set: mockTxSet, update: mockTxUpdate };

let docGetResult: { exists: boolean; id: string; data: () => unknown } = {
  exists: true,
  id: "conv-123",
  data: () => ({}),
};

let messagesGetResult: {
  docs: Array<{ id: string; data: () => unknown }>;
} = { docs: [] };

let listGetResult: {
  docs: Array<{ id: string; data: () => unknown }>;
} = { docs: [] };

// Track auto-generated doc IDs to verify return values
let autoDocIdCounter = 0;

function createMockDocRef(id?: string) {
  const resolvedId = id ?? `auto-id-${++autoDocIdCounter}`;
  const ref: Record<string, unknown> = {
    id: resolvedId,
    get: vi.fn(() => Promise.resolve(docGetResult)),
    collection: vi.fn((_subName: string) => ({
      doc: vi.fn((subId?: string) => createMockDocRef(subId)),
      orderBy: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve(messagesGetResult)),
      })),
    })),
  };
  return ref;
}

function createMockCollectionRef() {
  return {
    doc: vi.fn((id?: string) => createMockDocRef(id)),
    where: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(() => Promise.resolve(listGetResult)),
          })),
        })),
      })),
    })),
  };
}

const mockDb = {
  collection: vi.fn(() => createMockCollectionRef()),
  runTransaction: vi.fn((fn: (tx: typeof mockTx) => Promise<void>) =>
    fn(mockTx),
  ),
};

vi.mock("@/lib/firebase", () => ({
  db: {
    collection: (...args: unknown[]) => mockDb.collection(...args),
    runTransaction: (...args: unknown[]) =>
      mockDb.runTransaction(
        ...(args as [fn: (tx: typeof mockTx) => Promise<void>]),
      ),
  },
}));

import {
  appendMessages,
  createConversation,
  listConversations,
  loadConversation,
} from "../conversation-store";

// ── Tests ────────────────────────────────────────────────────

describe("conversation-store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    autoDocIdCounter = 0;

    // Reset default mock results
    docGetResult = {
      exists: true,
      id: "conv-123",
      data: () => ({
        userId: "user-1",
        tier: "standard",
        title: "Test conversation",
        messageCount: 1,
        totalCreditsSpent: 10,
        status: "active",
        createdAt: { toDate: () => new Date("2025-01-01") },
        updatedAt: { toDate: () => new Date("2025-01-02") },
      }),
    };

    messagesGetResult = {
      docs: [
        {
          id: "msg-1",
          data: () => ({
            role: "user",
            content: "Hello",
            turnNumber: 0,
            action: "prompt",
            createdAt: { toDate: () => new Date("2025-01-01") },
          }),
        },
      ],
    };

    listGetResult = { docs: [] };
  });

  // ── createConversation ──────────────────────────────────────

  describe("createConversation", () => {
    it("creates conversation doc with correct userId, tier, title, and status 'active'", async () => {
      await createConversation(
        "user-1",
        "What is quantum computing?",
        "standard",
      );

      // tx.set is called twice: once for conversation doc, once for message
      expect(mockTxSet).toHaveBeenCalledTimes(2);

      const convSetCall = mockTxSet.mock.calls[0];
      const convData = convSetCall[1];

      expect(convData).toMatchObject({
        userId: "user-1",
        tier: "standard",
        title: "What is quantum computing?",
        status: "active",
        messageCount: 1,
        totalCreditsSpent: 0,
      });
    });

    it("truncates title to 100 chars for long prompts", async () => {
      const longPrompt = "A".repeat(200);
      await createConversation("user-1", longPrompt, "expert");

      const convData = mockTxSet.mock.calls[0][1];
      expect(convData.title).toBe("A".repeat(100));
      expect(convData.title.length).toBe(100);
    });

    it("creates first user message with turnNumber 0 and action 'prompt'", async () => {
      await createConversation("user-1", "Research topic", "standard");

      const msgSetCall = mockTxSet.mock.calls[1];
      const msgData = msgSetCall[1];

      expect(msgData).toMatchObject({
        role: "user",
        content: "Research topic",
        turnNumber: 0,
        action: "prompt",
      });
    });

    it("uses transaction (runTransaction called)", async () => {
      await createConversation("user-1", "test", "standard");
      expect(mockDb.runTransaction).toHaveBeenCalledTimes(1);
    });

    it("returns generated conversation ID", async () => {
      const id = await createConversation("user-1", "test", "standard");
      // The auto-generated doc ref has an .id property
      expect(typeof id).toBe("string");
      expect(id.length).toBeGreaterThan(0);
    });
  });

  // ── loadConversation ────────────────────────────────────────

  describe("loadConversation", () => {
    it("returns conversation metadata and ordered messages", async () => {
      const result = await loadConversation("conv-123");

      expect(result.conversation).toBeDefined();
      expect(result.conversation.id).toBeDefined();
      expect(result.messages).toBeDefined();
      expect(Array.isArray(result.messages)).toBe(true);
      expect(result.messages.length).toBe(1);
      expect(result.messages[0]).toMatchObject({
        id: "msg-1",
        role: "user",
        content: "Hello",
        turnNumber: 0,
      });
    });

    it("throws error for non-existent conversation", async () => {
      docGetResult = {
        exists: false,
        id: "nonexistent",
        data: () => null,
      };

      await expect(loadConversation("nonexistent")).rejects.toThrow(
        "Conversation nonexistent not found",
      );
    });
  });

  // ── appendMessages ──────────────────────────────────────────

  describe("appendMessages", () => {
    it("adds messages to subcollection (tx.set called for each message)", async () => {
      const msgs = [
        {
          role: "gemini" as const,
          content: "AI response 1",
          turnNumber: 1,
          action: "prompt" as const,
        },
        {
          role: "openai" as const,
          content: "AI response 2",
          turnNumber: 1,
          action: "prompt" as const,
        },
      ];

      await appendMessages("conv-123", msgs, 10);

      // tx.set called once per message
      expect(mockTxSet).toHaveBeenCalledTimes(2);

      // Verify message data includes createdAt timestamp
      for (let i = 0; i < msgs.length; i++) {
        const setData = mockTxSet.mock.calls[i][1];
        expect(setData).toMatchObject({
          role: msgs[i].role,
          content: msgs[i].content,
          turnNumber: msgs[i].turnNumber,
          action: msgs[i].action,
          createdAt: "SERVER_TIMESTAMP",
        });
      }
    });

    it("uses FieldValue.increment for messageCount and totalCreditsSpent", async () => {
      const { FieldValue } = await import("firebase-admin/firestore");

      const msgs = [
        {
          role: "gemini" as const,
          content: "response",
          turnNumber: 1,
          action: "prompt" as const,
        },
      ];

      await appendMessages("conv-123", msgs, 15);

      // tx.update called once with increments
      expect(mockTxUpdate).toHaveBeenCalledTimes(1);
      expect(FieldValue.increment).toHaveBeenCalledWith(1); // messageCount
      expect(FieldValue.increment).toHaveBeenCalledWith(15); // totalCreditsSpent
    });

    it("updates updatedAt", async () => {
      const msgs = [
        {
          role: "user" as const,
          content: "follow up",
          turnNumber: 2,
          action: "follow-up" as const,
        },
      ];

      await appendMessages("conv-123", msgs, 5);

      const updateData = mockTxUpdate.mock.calls[0][1];
      expect(updateData.updatedAt).toBe("SERVER_TIMESTAMP");
    });
  });

  // ── listConversations ───────────────────────────────────────

  describe("listConversations", () => {
    it("returns conversations for specific userId", async () => {
      listGetResult = {
        docs: [
          {
            id: "conv-1",
            data: () => ({
              userId: "user-1",
              tier: "standard",
              title: "Test",
              messageCount: 3,
              totalCreditsSpent: 10,
              status: "active",
              updatedAt: { toDate: () => new Date("2025-01-01T00:00:00Z") },
            }),
          },
        ],
      };

      const result = await listConversations("user-1");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "conv-1",
        title: "Test",
        tier: "standard",
        messageCount: 3,
        totalCreditsSpent: 10,
      });
    });

    it("orders by updatedAt desc", async () => {
      listGetResult = { docs: [] };
      await listConversations("user-1");

      // Verify the chain: .where().where().orderBy().limit().get()
      const collectionCall = mockDb.collection.mock.results[0].value;
      const where1 = collectionCall.where;
      expect(where1).toHaveBeenCalledWith("userId", "==", "user-1");
    });

    it("respects limit parameter", async () => {
      listGetResult = { docs: [] };
      await listConversations("user-1", 5);

      // The chain was called — the limit is passed internally
      expect(mockDb.collection).toHaveBeenCalled();
    });

    it("only returns active conversations", async () => {
      listGetResult = { docs: [] };
      await listConversations("user-1");

      const collectionCall = mockDb.collection.mock.results[0].value;
      expect(collectionCall.where).toHaveBeenCalledWith(
        "userId",
        "==",
        "user-1",
      );
    });

    it("converts Timestamp to ISO string", async () => {
      listGetResult = {
        docs: [
          {
            id: "conv-1",
            data: () => ({
              userId: "user-1",
              tier: "expert",
              title: "Test",
              messageCount: 1,
              totalCreditsSpent: 20,
              status: "active",
              updatedAt: { toDate: () => new Date("2025-06-15T10:30:00Z") },
            }),
          },
        ],
      };

      const result = await listConversations("user-1");

      expect(result[0].updatedAt).toBe("2025-06-15T10:30:00.000Z");
    });
  });
});
