import { beforeEach, describe, expect, it, vi } from "vitest";

// -- Mock Prisma (hoisted to avoid TDZ issue with vi.mock) --------------------

const mockPrisma = vi.hoisted(() => ({
  project: {
    findFirst: vi.fn(),
    create: vi.fn(),
  },
  workspace: {
    findFirst: vi.fn(),
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

// -- Import under test --------------------------------------------------------

import { getOrCreateInboxProject } from "@/services/tasks/project.service";

// -- Tests --------------------------------------------------------------------

describe("getOrCreateInboxProject", () => {
  const userId = "user-123";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns existing Inbox project when found", async () => {
    mockPrisma.project.findFirst.mockResolvedValue({
      id: "proj-inbox",
      name: "Inbox",
    });

    const result = await getOrCreateInboxProject(userId);

    expect(result).toEqual({ id: "proj-inbox", name: "Inbox" });
    expect(mockPrisma.project.findFirst).toHaveBeenCalledWith({
      where: { name: "Inbox", workspace: { userId } },
      select: { id: true, name: true },
    });
    expect(mockPrisma.project.create).not.toHaveBeenCalled();
  });

  it("creates Inbox in first workspace when not found", async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null);
    mockPrisma.workspace.findFirst.mockResolvedValue({
      id: "ws-first",
    });
    mockPrisma.project.create.mockResolvedValue({
      id: "proj-new-inbox",
      name: "Inbox",
    });

    const result = await getOrCreateInboxProject(userId);

    expect(result).toEqual({ id: "proj-new-inbox", name: "Inbox" });
    expect(mockPrisma.workspace.findFirst).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    expect(mockPrisma.project.create).toHaveBeenCalledWith({
      data: { workspaceId: "ws-first", name: "Inbox" },
      select: { id: true, name: true },
    });
  });

  it("throws when user has no workspaces", async () => {
    mockPrisma.project.findFirst.mockResolvedValue(null);
    mockPrisma.workspace.findFirst.mockResolvedValue(null);

    await expect(getOrCreateInboxProject(userId)).rejects.toThrow(
      "Cannot create Inbox project: user has no workspaces.",
    );

    expect(mockPrisma.project.create).not.toHaveBeenCalled();
  });
});
