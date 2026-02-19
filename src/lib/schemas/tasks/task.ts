import { z } from "zod";

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  sectionId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().max(5000).optional(),
  deadlineAt: z.coerce.date().nullable().optional(),
  effort: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(5),
      z.literal(8),
      z.literal(13),
    ])
    .nullable()
    .optional(),
  tagIds: z.array(z.string()).optional(),
});

export const updateTaskSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1, "Name is required").max(500).optional(),
  description: z.string().max(5000).nullable().optional(),
  deadlineAt: z.coerce.date().nullable().optional(),
  sectionId: z.string().nullable().optional(),
  effort: z
    .union([
      z.literal(1),
      z.literal(2),
      z.literal(3),
      z.literal(5),
      z.literal(8),
      z.literal(13),
    ])
    .nullable()
    .optional(),
  tagIds: z.array(z.string()).optional(),
});

export const reorderTaskSchema = z.object({
  id: z.string().min(1),
  order: z.number(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ReorderTaskInput = z.infer<typeof reorderTaskSchema>;
