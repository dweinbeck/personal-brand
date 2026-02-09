import { z } from "zod";

export const tutorialSlugSchema = z
  .string()
  .min(3, "Slug must be at least 3 characters")
  .max(100, "Slug must be at most 100 characters")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and hyphens",
  );

export const tutorialMetaSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be at most 200 characters"),
  description: z
    .string()
    .min(1, "Description is required")
    .max(500, "Description must be at most 500 characters"),
  publishedAt: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD format"),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag must be at most 50 characters"),
    )
    .min(1, "At least one tag required")
    .max(10, "At most 10 tags allowed"),
});

export const saveTutorialSchema = z.object({
  slug: tutorialSlugSchema,
  metadata: tutorialMetaSchema,
  body: z.string().min(1, "Content body is required"),
});

export type SaveTutorialData = z.infer<typeof saveTutorialSchema>;
