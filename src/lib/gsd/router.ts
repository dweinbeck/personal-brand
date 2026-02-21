import { google } from "@ai-sdk/google";
import { generateText, Output } from "ai";
import { getCapture, updateCaptureStatus } from "./capture";
import { alertCaptureFailed, alertCaptureRouted } from "./discord";
import { type RoutingOutput, routingOutputSchema } from "./schemas";

const CONFIDENCE_THRESHOLD = 0.7;

const ROUTING_PROMPT = `You are a routing classifier for a solo developer's Builder OS capture system.

Classify the captured input into one of these categories:
- github_issue: Bug reports, feature requests, code changes, technical debt, refactoring ideas, anything that should become a GitHub issue on a software project
- task: Personal todos, reminders, non-code action items, scheduling, follow-ups, purchases, errands
- inbox: Items that need human review — ambiguous, multi-part, or could go either way
- unknown: Cannot determine intent from the input

Context: This is a personal productivity tool. The developer captures ideas via voice dictation or screenshots from their iPhone. Captures are typically short, informal, and action-oriented.

Few-shot examples:

Input: "The brand scraper is returning empty rectangles for some SVG logos, need to add a fallback that converts them to PNG first"
→ category: github_issue, title: "Brand scraper: add PNG fallback for empty SVG rectangles", priority: medium, confidence: 0.95

Input: "Remember to buy new AirPods Pro tips this weekend"
→ category: task, title: "Buy AirPods Pro tips", priority: low, confidence: 0.92

Input: "I think we should restructure the whole navigation but also maybe add a dark mode toggle and fix that weird scrolling bug on mobile"
→ category: inbox, title: "Navigation restructure + dark mode + mobile scroll bug", priority: medium, confidence: 0.55

Input: "The contact form validation is broken when you submit with an empty email field, it shows a 500 instead of a validation error"
→ category: github_issue, title: "Contact form: 500 error on empty email submission", priority: high, confidence: 0.97

Input: "Schedule dentist appointment for next Tuesday"
→ category: task, title: "Schedule dentist appointment - next Tuesday", priority: medium, confidence: 0.94

Now classify this capture:`;

/**
 * Classify a capture using Gemini 2.0 Flash.
 * Returns structured routing output with confidence score.
 */
export async function classifyCapture(
  transcript: string,
  context?: string,
): Promise<RoutingOutput> {
  const input = context
    ? `Input: "${transcript}"\nAdditional context: "${context}"`
    : `Input: "${transcript}"`;

  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    output: Output.object({ schema: routingOutputSchema }),
    prompt: `${ROUTING_PROMPT}\n\n${input}`,
  });

  if (!output) {
    return {
      category: "unknown",
      title: transcript.slice(0, 100),
      summary: transcript,
      priority: "medium",
      confidence: 0,
    };
  }

  return output;
}

/**
 * Route to the appropriate destination based on classification.
 * Returns the destination ref (issue URL, task ID, or "inbox").
 */
async function routeToDestination(
  _captureId: string,
  routing: RoutingOutput,
): Promise<{ destination: string; destinationRef: string }> {
  const effectiveCategory =
    routing.confidence < CONFIDENCE_THRESHOLD || routing.category === "unknown"
      ? "inbox"
      : routing.category;

  switch (effectiveCategory) {
    case "github_issue": {
      const { routeToGitHub } = await import("./destinations/github");
      const issueUrl = await routeToGitHub(routing);
      return { destination: "github_issue", destinationRef: issueUrl };
    }
    case "task": {
      const { routeToTask } = await import("./destinations/tasks");
      const taskId = await routeToTask(routing);
      return { destination: "task", destinationRef: taskId };
    }
    default:
      return { destination: "inbox", destinationRef: "inbox" };
  }
}

/**
 * Full async processing pipeline for a capture.
 * Called fire-and-forget from capture API routes.
 *
 * Flow: mark processing → classify with LLM → route → mark routed/failed
 */
export async function processCapture(captureId: string): Promise<void> {
  try {
    await updateCaptureStatus(captureId, { status: "processing" });

    const capture = await getCapture(captureId);
    if (!capture) {
      throw new Error(`Capture ${captureId} not found`);
    }

    const transcript =
      capture.type === "dictation"
        ? (capture.transcript ?? "")
        : (capture.context ?? "[Screenshot capture — no transcript]");

    const routing = await classifyCapture(transcript, capture.context);

    const { destination, destinationRef } = await routeToDestination(
      captureId,
      routing,
    );

    await updateCaptureStatus(captureId, {
      status: "routed",
      routingResult: routing as unknown as Record<string, unknown>,
      destination,
      destinationRef,
    });

    // Discord alert (fire-and-forget)
    alertCaptureRouted({
      type: capture.type,
      destination,
      title: routing.title,
      confidence: routing.confidence,
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error(`Capture ${captureId} processing failed:`, errorMessage);

    try {
      await updateCaptureStatus(captureId, {
        status: "failed",
        error: errorMessage,
      });
    } catch (updateErr) {
      console.error(`Failed to update capture ${captureId} status:`, updateErr);
    }

    // Discord alert for failure (fire-and-forget)
    alertCaptureFailed({
      type: "unknown",
      error: errorMessage,
      captureId,
    });
  }
}
