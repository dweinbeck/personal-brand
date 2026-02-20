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
