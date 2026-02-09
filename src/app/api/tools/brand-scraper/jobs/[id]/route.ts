import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import {
  findUsageByExternalJobId,
  markUsageSucceeded,
  refundUsage,
} from "@/lib/billing/firestore";
import { getScrapeJobStatus } from "@/lib/brand-scraper/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  const { id } = await params;

  try {
    const job = await getScrapeJobStatus(id);

    // Look up usage record for this job
    const usage = await findUsageByExternalJobId({
      uid: auth.uid,
      externalJobId: id,
    });

    // Auto-refund on terminal failure
    if (job.status === "failed" && usage && usage.status !== "refunded") {
      await refundUsage({
        usageId: usage.id,
        reason: "Job failed — automatic refund.",
      }).catch((err) => console.error("Auto-refund failed:", err));
    }

    // Mark succeeded on terminal success
    if (
      (job.status === "succeeded" || job.status === "partial") &&
      usage &&
      usage.status === "started"
    ) {
      await markUsageSucceeded({
        usageId: usage.id,
        externalJobId: id,
      }).catch((err) => console.error("Mark succeeded failed:", err));
    }

    return Response.json({
      ...job,
      usageId: usage?.id ?? null,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to get job status.";
    const status =
      error instanceof Error && "statusCode" in error
        ? (error as Error & { statusCode: number }).statusCode
        : 500;
    return Response.json({ error: message }, { status });
  }
}
