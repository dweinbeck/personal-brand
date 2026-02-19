"use server";

import { revalidatePath } from "next/cache";
import {
  createSectionSchema,
  updateSectionSchema,
} from "@/lib/schemas/tasks/section";
import { verifyUser } from "@/lib/tasks/auth";
import { billingGuard, checkBillingAccess } from "@/lib/tasks/billing";
import {
  createSection as createSectionSvc,
  deleteSection as deleteSectionSvc,
  updateSection as updateSectionSvc,
} from "@/services/tasks/section.service";

export async function createSectionAction(idToken: string, formData: FormData) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = createSectionSchema.safeParse({
    projectId: formData.get("projectId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await createSectionSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function updateSectionAction(idToken: string, formData: FormData) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  const parsed = updateSectionSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  await updateSectionSvc(userId, parsed.data);
  revalidatePath("/apps/tasks");
  return { success: true };
}

export async function deleteSectionAction(idToken: string, id: string) {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  const billing = await checkBillingAccess(idToken);
  const blocked = billingGuard(billing);
  if (blocked) return blocked;

  await deleteSectionSvc(userId, id);
  revalidatePath("/apps/tasks");
  return { success: true };
}
