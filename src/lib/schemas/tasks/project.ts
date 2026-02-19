import { z } from "zod";

export const createProjectSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
});

export const updateProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(100),
});

export const updateProjectViewModeSchema = z.object({
  id: z.string().min(1),
  viewMode: z.enum(["list", "board"]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type UpdateProjectViewModeInput = z.infer<
  typeof updateProjectViewModeSchema
>;
