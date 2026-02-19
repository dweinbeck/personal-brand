"use server";

import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/tasks/auth";
import { billingGuard, checkBillingAccess } from "@/lib/tasks/billing";
import { createTaskSchema, updateTaskSchema } from "@/lib/schemas/tasks/task";
import {
  assignTaskToSection,
  createTask as createTaskSvc,
  deleteTask as deleteTaskSvc,
  toggleTaskStatus as toggleTaskStatusSvc,
  updateTask as updateTaskSvc,
} from "@/services/tasks/task.service";

export async function createTaskAction(
  idToken: string,
  data: {
    projectId: string;
    sectionId?: string | null;
    parentTaskId?: string | null;
    name: string;
    description?: string;
    deadlineAt?: string | null;
    effort?: number | null;
    tagIds?: string[];
  },
) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = createTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  try {
    const task = await createTaskSvc(userId, parsed.data);
    revalidatePath("/apps/tasks");
    return { success: true, taskId: task.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create task" };
  }
}

export async function updateTaskAction(
  idToken: string,
  data: {
    id: string;
    name?: string;
    description?: string | null;
    deadlineAt?: string | null;
    sectionId?: string | null;
    effort?: number | null;
    tagIds?: string[];
  },
) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = updateTaskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await updateTaskSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function deleteTaskAction(idToken: string, id: string) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  await deleteTaskSvc(userId, id);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function toggleTaskAction(idToken: string, id: string) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  await toggleTaskStatusSvc(userId, id);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function assignTaskToSectionAction(
  idToken: string,
  taskId: string,
  sectionId: string | null,
) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  await assignTaskToSection(userId, taskId, sectionId);
  revalidatePath("/apps/tasks");
  return { success: true };
}
