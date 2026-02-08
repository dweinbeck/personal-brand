import { z } from "zod";

const partSchema = z
  .object({
    type: z.string(),
    text: z
      .string()
      .max(1000, "Message is too long (max 1000 characters)")
      .optional(),
  })
  .passthrough();

const uiMessageSchema = z
  .object({
    id: z.string(),
    role: z.enum(["user", "assistant", "system"]),
    parts: z.array(partSchema).optional(),
  })
  .passthrough();

export const chatRequestSchema = z
  .object({
    messages: z
      .array(uiMessageSchema)
      .min(1, "At least one message is required")
      .max(20, "Conversation is too long (max 20 turns)"),
  })
  .passthrough();

export type ChatRequest = z.infer<typeof chatRequestSchema>;
