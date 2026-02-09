/**
 * Seed billing tool pricing data into Firestore.
 *
 * Usage: npx tsx scripts/seed-billing.ts
 *
 * Requires Firebase Admin SDK credentials:
 * - On Cloud Run: uses Application Default Credentials (ADC)
 * - Locally: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY
 */

// Initialize Firebase Admin SDK (must import before billing modules)
import "@/lib/firebase";

import { seedToolPricing } from "@/lib/billing/tools";

async function main() {
  console.log("Seeding billing tool pricing...");
  await seedToolPricing();
  console.log("Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
