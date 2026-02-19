import { z } from "zod";

export const createTagSchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  color: z.string().max(7).nullable().optional(),
});

export const updateTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(50).optional(),
  color: z.string().max(7).nullable().optional(),
});

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
