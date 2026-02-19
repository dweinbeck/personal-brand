"use server";

import { revalidatePath } from "next/cache";
import { verifyUser } from "@/lib/tasks/auth";
import { billingGuard, checkBillingAccess } from "@/lib/tasks/billing";
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
} from "@/lib/schemas/tasks/workspace";
import {
  createWorkspace as createWorkspaceSvc,
  deleteWorkspace as deleteWorkspaceSvc,
  updateWorkspace as updateWorkspaceSvc,
} from "@/services/tasks/workspace.service";

export async function createWorkspaceAction(
  idToken: string,
  formData: FormData,
) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = createWorkspaceSchema.safeParse({
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await createWorkspaceSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function updateWorkspaceAction(
  idToken: string,
  formData: FormData,
) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = updateWorkspaceSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await updateWorkspaceSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function deleteWorkspaceAction(idToken: string, id: string) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  await deleteWorkspaceSvc(userId, id);
  revalidatePath("/apps/tasks");
  return { success: true };
}
