import { prisma } from "@/lib/prisma";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/lib/schemas/tasks/workspace";

export async function getWorkspaces(userId: string) {
  return prisma.workspace.findMany({
    where: { userId },
    include: {
      projects: {
        include: {
          _count: {
            select: {
              tasks: {
                where: { status: "OPEN", parentTaskId: null },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getWorkspace(userId: string, id: string) {
  return prisma.workspace.findUnique({
    where: { id, userId },
    include: {
      projects: {
        include: {
          _count: {
            select: {
              tasks: {
                where: { status: "OPEN", parentTaskId: null },
              },
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput,
) {
  return prisma.workspace.create({
    data: { name: input.name, userId },
  });
}

export async function updateWorkspace(
  userId: string,
  input: UpdateWorkspaceInput,
) {
  return prisma.workspace.update({
    where: { id: input.id, userId },
    data: { name: input.name },
  });
}

export async function deleteWorkspace(userId: string, id: string) {
  return prisma.workspace.delete({
    where: { id, userId },
  });
}
