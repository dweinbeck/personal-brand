import { prisma } from "@/lib/prisma";
import type {
  CreateTaskInput,
  ReorderTaskInput,
  UpdateTaskInput,
} from "@/lib/schemas/tasks/task";

export async function createTask(userId: string, input: CreateTaskInput) {
  if (input.parentTaskId) {
    const parent = await prisma.task.findUnique({
      where: { id: input.parentTaskId, userId },
    });
    if (!parent) {
      throw new Error("Parent task not found");
    }
    if (parent.parentTaskId) {
      throw new Error("Subtasks cannot have subtasks (one-level nesting only)");
    }
  }

  const lastTask = await prisma.task.findFirst({
    where: {
      userId,
      projectId: input.projectId,
      sectionId: input.sectionId ?? null,
      parentTaskId: input.parentTaskId ?? null,
    },
    orderBy: { order: "desc" },
  });
  const order = lastTask ? lastTask.order + 1 : 0;

  return prisma.task.create({
    data: {
      userId,
      projectId: input.projectId,
      sectionId: input.sectionId ?? null,
      parentTaskId: input.parentTaskId ?? null,
      name: input.name,
      description: input.description ?? null,
      deadlineAt: input.deadlineAt ?? null,
      effort: input.effort ?? null,
      order,
      tags: input.tagIds?.length
        ? {
            create: input.tagIds.map((tagId) => ({ tagId })),
          }
        : undefined,
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      section: true,
    },
  });
}

export async function updateTask(userId: string, input: UpdateTaskInput) {
  const existing = await prisma.task.findUnique({
    where: { id: input.id, userId },
  });
  if (!existing) throw new Error("Task not found");

  const { id, tagIds, ...data } = input;

  if (tagIds !== undefined) {
    await prisma.taskTag.deleteMany({ where: { taskId: id } });
    if (tagIds.length > 0) {
      await prisma.taskTag.createMany({
        data: tagIds.map((tagId) => ({ taskId: id, tagId })),
      });
    }
  }

  return prisma.task.update({
    where: { id },
    data,
    include: {
      subtasks: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      section: true,
    },
  });
}

export async function deleteTask(userId: string, id: string) {
  return prisma.task.delete({
    where: { id, userId },
  });
}

export async function toggleTaskStatus(userId: string, id: string) {
  const task = await prisma.task.findUnique({ where: { id, userId } });
  if (!task) throw new Error("Task not found");

  const newStatus = task.status === "OPEN" ? "COMPLETED" : "OPEN";
  return prisma.task.update({
    where: { id },
    data: { status: newStatus },
  });
}

export async function assignTaskToSection(
  userId: string,
  taskId: string,
  sectionId: string | null,
) {
  return prisma.task.update({
    where: { id: taskId, userId },
    data: { sectionId },
  });
}

export async function reorderTask(userId: string, input: ReorderTaskInput) {
  return prisma.task.update({
    where: { id: input.id, userId },
    data: { order: input.order },
  });
}

export async function getTasksForToday(userId: string) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  return prisma.task.findMany({
    where: {
      userId,
      deadlineAt: { gte: startOfDay, lt: endOfDay },
      status: "OPEN",
      parentTaskId: null,
    },
    include: {
      subtasks: { orderBy: { order: "asc" } },
      tags: { include: { tag: true } },
      section: true,
      project: true,
    },
    orderBy: { deadlineAt: "asc" },
  });
}

export async function getCompletedTasks(userId: string, projectId?: string) {
  return prisma.task.findMany({
    where: {
      userId,
      status: "COMPLETED",
      parentTaskId: null,
      ...(projectId ? { projectId } : {}),
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

export async function searchTasks(userId: string, query: string) {
  return prisma.task.findMany({
    where: {
      userId,
      parentTaskId: null,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ],
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

export async function getCompletedYesterdayCount(
  userId: string,
): Promise<number> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  return prisma.task.count({
    where: {
      userId,
      status: "COMPLETED",
      updatedAt: { gte: yesterdayStart, lt: todayStart },
      parentTaskId: null,
    },
  });
}

export async function getTotalTaskCount(userId: string): Promise<number> {
  return prisma.task.count({
    where: {
      userId,
      status: "OPEN",
      parentTaskId: null,
    },
  });
}

export async function getMitTask(
  userId: string,
): Promise<{ id: string; name: string; projectName: string | null } | null> {
  const mitTag = await prisma.tag.findFirst({
    where: { userId, name: "MIT" },
  });
  if (!mitTag) return null;

  const task = await prisma.task.findFirst({
    where: {
      userId,
      status: "OPEN",
      parentTaskId: null,
      tags: { some: { tagId: mitTag.id } },
    },
    include: { project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  if (!task) return null;

  return { id: task.id, name: task.name, projectName: task.project.name };
}

export async function getNextTasks(
  userId: string,
): Promise<{ id: string; name: string; projectName: string | null }[]> {
  const nextTag = await prisma.tag.findFirst({
    where: { userId, name: "Next" },
  });
  if (!nextTag) return [];

  const tasks = await prisma.task.findMany({
    where: {
      userId,
      status: "OPEN",
      parentTaskId: null,
      tags: { some: { tagId: nextTag.id } },
    },
    include: { project: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
    take: 2,
  });

  return tasks.map((task) => ({
    id: task.id,
    name: task.name,
    projectName: task.project.name,
  }));
}
