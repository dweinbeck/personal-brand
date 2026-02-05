import { google } from "@ai-sdk/google";

export const assistantModel = google("gemini-2.0-flash");

export const MODEL_CONFIG = {
  maxOutputTokens: 1024,
  temperature: 0.7,
} as const;
