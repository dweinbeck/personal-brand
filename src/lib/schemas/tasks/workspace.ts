import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export const updateWorkspaceSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
