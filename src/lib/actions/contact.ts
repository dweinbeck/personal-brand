"use server";

import { headers } from "next/headers";
import { saveContactSubmission } from "@/lib/firebase";
import { contactSchema } from "@/lib/schemas/contact";

export type ContactState = {
  errors?: {
    name?: string[];
    email?: string[];
    message?: string[];
  };
  message?: string;
  success?: boolean;
};

const rateLimitMap = new Map<string, number[]>();

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  rateLimitMap.set(ip, recent);

  if (recent.length >= RATE_LIMIT_MAX) {
    return false;
  }

  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "unknown"
  );
}

export async function submitContact(
  _prevState: ContactState,
  formData: FormData,
): Promise<ContactState> {
  // 1. Honeypot check
  const honeypot = formData.get("company_website");
  if (honeypot) {
    return { success: true, message: "Thank you for your message!" };
  }

  // 2. Rate limit check
  const ip = await getClientIp();
  if (!checkRateLimit(ip)) {
    return {
      success: false,
      message: "Too many submissions. Please try again later.",
    };
  }

  // 3. Validate with Zod
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      success: false,
    };
  }

  // 4. Save to Firestore
  try {
    await saveContactSubmission(validatedFields.data);
    return {
      success: true,
      message: "Thank you for your message! I'll get back to you soon.",
    };
  } catch (error) {
    console.error("Failed to save contact submission:", error);
    return {
      success: false,
      message: "Something went wrong. Please try again.",
    };
  }
}
