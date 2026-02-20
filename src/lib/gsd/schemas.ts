import { z } from "zod";

// -- Capture request schemas --------------------------------------------------

export const dictationCaptureSchema = z.object({
  transcript: z
    .string()
    .min(1, "Transcript is required")
    .max(10_000, "Transcript too long (10,000 char max)"),
  context: z.string().max(2_000, "Context too long").optional(),
});

export type DictationCaptureRequest = z.infer<typeof dictationCaptureSchema>;

export const screenshotCaptureSchema = z.object({
  context: z.string().max(2_000, "Context too long").optional(),
});

export type ScreenshotCaptureRequest = z.infer<typeof screenshotCaptureSchema>;

// -- Status and destination enums ---------------------------------------------

export const captureStatusSchema = z.enum([
  "pending",
  "processing",
  "routed",
  "failed",
]);

export type CaptureStatus = z.infer<typeof captureStatusSchema>;

export const captureDestinationSchema = z.enum([
  "github_issue",
  "task",
  "inbox",
]);

export type CaptureDestination = z.infer<typeof captureDestinationSchema>;

// -- LLM routing output schema ------------------------------------------------

export const routingCategorySchema = z.enum([
  "github_issue",
  "task",
  "inbox",
  "unknown",
]);

export type RoutingCategory = z.infer<typeof routingCategorySchema>;

export const routingOutputSchema = z.object({
  category: routingCategorySchema.describe(
    "Where to route this capture: github_issue for bugs/features/code changes, task for personal todos/reminders, inbox for unclear items, unknown if cannot classify",
  ),
  title: z
    .string()
    .describe("Short title for the routed item (under 100 chars)"),
  summary: z.string().describe("1-3 sentence summary of what needs to be done"),
  priority: z.enum(["high", "medium", "low"]).describe("Urgency level"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("How confident the classification is (0-1)"),
});

export type RoutingOutput = z.infer<typeof routingOutputSchema>;
