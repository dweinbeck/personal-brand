import { prisma } from "@/lib/prisma";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/schemas/tasks/project";

export async function getAllProjects(userId: string) {
  return prisma.project.findMany({
    where: { workspace: { userId } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });
}

export async function getProject(userId: string, id: string) {
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      workspace: { select: { userId: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          tasks: {
            where: { parentTaskId: null },
            orderBy: { order: "asc" },
            include: {
              subtasks: { orderBy: { order: "asc" } },
              tags: { include: { tag: true } },
              section: true,
            },
          },
        },
      },
      tasks: {
        where: { parentTaskId: null, sectionId: null },
        orderBy: { order: "asc" },
        include: {
          subtasks: { orderBy: { order: "asc" } },
          tags: { include: { tag: true } },
          section: true,
        },
      },
    },
  });

  if (!project || project.workspace.userId !== userId) {
    return null;
  }

  // Remove workspace from returned object to avoid leaking internal structure
  const { workspace: _workspace, ...projectData } = project;
  return projectData;
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const workspace = await prisma.workspace.findUnique({
    where: { id: input.workspaceId, userId },
  });
  if (!workspace) throw new Error("Workspace not found");

  return prisma.project.create({
    data: {
      workspaceId: input.workspaceId,
      name: input.name,
    },
  });
}

export async function updateProject(userId: string, input: UpdateProjectInput) {
  const existing = await prisma.project.findUnique({
    where: { id: input.id },
    include: { workspace: { select: { userId: true } } },
  });
  if (!existing || existing.workspace.userId !== userId) {
    throw new Error("Not found");
  }

  return prisma.project.update({
    where: { id: input.id },
    data: { name: input.name },
  });
}

export async function updateProjectViewMode(
  userId: string,
  projectId: string,
  viewMode: string,
) {
  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: { select: { userId: true } } },
  });
  if (!existing || existing.workspace.userId !== userId) {
    throw new Error("Not found");
  }

  return prisma.project.update({
    where: { id: projectId },
    data: { viewMode },
  });
}

const INBOX_PROJECT_NAME = "Inbox";

/**
 * Find an existing project named "Inbox" for the user, or create one
 * in the user's first workspace. Used as the default landing zone for
 * auto-routed GSD captures.
 */
export async function getOrCreateInboxProject(
  userId: string,
): Promise<{ id: string; name: string }> {
  const existing = await prisma.project.findFirst({
    where: {
      name: INBOX_PROJECT_NAME,
      workspace: { userId },
    },
    select: { id: true, name: true },
  });

  if (existing) return existing;

  // No Inbox project yet — create one in the first workspace
  const firstWorkspace = await prisma.workspace.findFirst({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  if (!firstWorkspace) {
    throw new Error("Cannot create Inbox project: user has no workspaces.");
  }

  return prisma.project.create({
    data: {
      workspaceId: firstWorkspace.id,
      name: INBOX_PROJECT_NAME,
    },
    select: { id: true, name: true },
  });
}

export async function deleteProject(userId: string, id: string) {
  const existing = await prisma.project.findUnique({
    where: { id },
    include: { workspace: { select: { userId: true } } },
  });
  if (!existing || existing.workspace.userId !== userId) {
    throw new Error("Not found");
  }

  return prisma.project.delete({
    where: { id },
  });
}
