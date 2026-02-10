import { FieldValue } from "firebase-admin/firestore";
import { db } from "@/lib/firebase";

export const TOOL_PRICING_SEED = [
  {
    toolKey: "brand_scraper",
    label: "Brand Scraper",
    active: true,
    creditsPerUse: 50,
    costToUsCentsEstimate: 30,
  },
  {
    toolKey: "lesson_60s",
    label: "60-Second Lesson",
    active: false,
    creditsPerUse: 10,
    costToUsCentsEstimate: 5,
  },
  {
    toolKey: "bus_text",
    label: "Bus Text",
    active: false,
    creditsPerUse: 5,
    costToUsCentsEstimate: 2,
  },
  // NOTE: If already seeded in production, update via PUT /api/admin/billing/pricing
  {
    toolKey: "dave_ramsey",
    label: "Digital Envelopes",
    active: true,
    creditsPerUse: 100,
    costToUsCentsEstimate: 0,
  },
] as const;

/**
 * Seeds the billing_tool_pricing collection with default pricing
 * if documents don't already exist. Safe to call multiple times.
 */
export async function seedToolPricing(): Promise<void> {
  if (!db) {
    console.warn("Firestore not available — skipping tool pricing seed.");
    return;
  }

  const batch = db.batch();
  let needsWrite = false;

  for (const tool of TOOL_PRICING_SEED) {
    const ref = db.collection("billing_tool_pricing").doc(tool.toolKey);
    const doc = await ref.get();
    if (!doc.exists) {
      batch.set(ref, {
        ...tool,
        updatedAt: FieldValue.serverTimestamp(),
      });
      needsWrite = true;
    }
  }

  if (needsWrite) {
    await batch.commit();
    console.log("Tool pricing seeded.");
  }
}
