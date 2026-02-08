import { z } from "zod";

export const fastApiCitationSchema = z.object({
  source: z.string(),
  relevance: z.string(),
});

export const fastApiResponseSchema = z.object({
  answer: z.string(),
  citations: z.array(fastApiCitationSchema),
  confidence: z.enum(["low", "medium", "high"]),
});

export type FastApiResponse = z.infer<typeof fastApiResponseSchema>;
export type FastApiCitation = z.infer<typeof fastApiCitationSchema>;
