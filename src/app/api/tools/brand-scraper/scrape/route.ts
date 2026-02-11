import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  debitForToolUse,
  markUsageSucceeded,
  refundUsage,
} from "@/lib/billing/firestore";
import { submitScrapeJob } from "@/lib/brand-scraper/client";
import { addHistoryEntry } from "@/lib/brand-scraper/history";
import { scrapeRequestSchema } from "@/lib/brand-scraper/types";

export async function POST(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const idempotencyKey = request.headers.get("X-Idempotency-Key");
  if (!idempotencyKey) {
    return Response.json(
      { error: "X-Idempotency-Key header is required." },
      { status: 400 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = scrapeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "A valid URL is required." },
      { status: 400 },
    );
  }

  // Debit credits
  let debit: Awaited<ReturnType<typeof debitForToolUse>>;
  try {
    debit = await debitForToolUse({
      uid: auth.uid,
      email: auth.email,
      toolKey: "brand_scraper",
      idempotencyKey,
    });
  } catch (error) {
    const statusCode =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 400;
    const message =
      error instanceof Error ? error.message : "Failed to debit credits.";
    return Response.json({ error: message }, { status: statusCode });
  }

  // Submit job to external service
  try {
    const job = await submitScrapeJob(parsed.data.url);

    // Mark usage with external job ID
    await markUsageSucceeded({
      usageId: debit.usageId,
      externalJobId: job.job_id,
    }).catch((err) => console.error("Failed to mark usage succeeded:", err));

    // Persist scrape history entry (fire-and-forget)
    addHistoryEntry({
      uid: auth.uid,
      jobId: job.job_id,
      siteUrl: parsed.data.url,
    }).catch((err) => console.error("Failed to write scrape history:", err));

    return Response.json({
      ...job,
      usageId: debit.usageId,
      creditsCharged: debit.creditsCharged,
      balanceAfter: debit.balanceAfter,
    });
  } catch (error) {
    // Refund on submission failure
    await refundUsage({
      usageId: debit.usageId,
      reason: "Job submission failed.",
    }).catch((err) => console.error("Failed to refund usage:", err));

    const message =
      error instanceof Error ? error.message : "Scrape submission failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
