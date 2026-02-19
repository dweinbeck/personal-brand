"use server";

import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/tasks/auth";
import { billingGuard, checkBillingAccess } from "@/lib/tasks/billing";
import {
  createProjectSchema,
  updateProjectSchema,
} from "@/lib/schemas/tasks/project";
import {
  createProject as createProjectSvc,
  deleteProject as deleteProjectSvc,
  updateProject as updateProjectSvc,
  updateProjectViewMode as updateProjectViewModeSvc,
} from "@/services/tasks/project.service";

export async function createProjectAction(idToken: string, formData: FormData) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = createProjectSchema.safeParse({
    workspaceId: formData.get("workspaceId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const project = await createProjectSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true, projectId: project.id };
}

export async function updateProjectAction(idToken: string, formData: FormData) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = updateProjectSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await updateProjectSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function updateProjectViewModeAction(
  idToken: string,
  projectId: string,
  viewMode: "list" | "board",
) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  await updateProjectViewModeSvc(userId, projectId, viewMode);
  revalidatePath(`/apps/tasks/${projectId}`);
  return { success: true };
}

export async function deleteProjectAction(idToken: string, id: string) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  await deleteProjectSvc(userId, id);
  revalidatePath("/apps/tasks");
  return { success: true };
}
