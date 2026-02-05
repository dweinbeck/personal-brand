import { db } from "@/lib/firebase";

export type LeadData = {
  conversationId: string;
  intent: "hire" | "consult" | "collaborate";
  name?: string;
  email?: string;
  timeline?: string;
  problem?: string;
  budget?: string;
  createdAt: string;
};

const HIRE_PATTERNS = [
  /\b(hire|hiring|recruit)\b/i,
  /\b(looking for|need|want)\b.*\b(developer|engineer|consultant|freelancer)\b/i,
  /\b(work with|engage|contract)\b.*\byou\b/i,
  /\b(available|availability)\b.*\b(work|project|contract)\b/i,
];

const CONSULT_PATTERNS = [
  /\bconsult/i,
  /\b(advisory|advise|advice)\b.*\b(technical|architecture|data|ai)\b/i,
  /\bfreelance/i,
];

export function detectHiringIntent(
  message: string,
): "hire" | "consult" | null {
  for (const pattern of HIRE_PATTERNS) {
    if (pattern.test(message)) return "hire";
  }
  for (const pattern of CONSULT_PATTERNS) {
    if (pattern.test(message)) return "consult";
  }
  return null;
}

export async function saveLead(lead: LeadData): Promise<void> {
  if (!db) return;

  try {
    await db.collection("assistant_leads").add(lead);
  } catch (error) {
    console.error("Failed to save lead:", error);
  }
}
