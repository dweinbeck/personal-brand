import { prisma } from "@/lib/prisma";
import type { CreateTagInput, UpdateTagInput } from "@/lib/schemas/tasks/tag";

export async function getTags(userId: string) {
  return prisma.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { tasks: true },
      },
    },
  });
}

export async function createTag(userId: string, input: CreateTagInput) {
  return prisma.tag.create({
    data: {
      name: input.name,
      color: input.color ?? null,
      userId,
    },
  });
}

export async function updateTag(userId: string, input: UpdateTagInput) {
  const { id, ...data } = input;
  return prisma.tag.update({
    where: { id, userId },
    data,
  });
}

export async function deleteTag(userId: string, id: string) {
  return prisma.tag.delete({
    where: { id, userId },
  });
}

export async function getTasksByTag(userId: string, tagId: string) {
  // Verify tag ownership
  const tag = await prisma.tag.findUnique({
    where: { id: tagId, userId },
  });
  if (!tag) throw new Error("Tag not found");

  return prisma.task.findMany({
    where: {
      userId,
      parentTaskId: null,
      tags: { some: { tagId } },
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      section: true,
      project: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}
