import { z } from "zod";

export const createSectionSchema = z.object({
  projectId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
});

export const updateSectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
});

export const reorderSectionSchema = z.object({
  id: z.string().min(1),
  order: z.number(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
export type ReorderSectionInput = z.infer<typeof reorderSectionSchema>;
