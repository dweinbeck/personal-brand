import { getOrCreateInboxProject } from "@/services/tasks/project.service";
import { createTask } from "@/services/tasks/task.service";
import type { RoutingOutput } from "../schemas";

/**
 * Create a task from a routing result.
 *
 * @param routing  - LLM routing output (title, summary, priority, etc.)
 * @param projectId - Optional explicit project ID (manual reroute).
 *                    When omitted, auto-discovers the user's "Inbox" project.
 * @returns The created task ID.
 */
export async function routeToTask(
  routing: RoutingOutput,
  projectId?: string,
): Promise<string> {
  const userId = process.env.GSD_TASKS_USER_ID;
  if (!userId) {
    throw new Error(
      "GSD_TASKS_USER_ID not configured. Cannot create tasks from captures.",
    );
  }

  // Resolve target project: explicit ID from manual reroute, or Inbox default
  const targetProjectId =
    projectId ?? (await getOrCreateInboxProject(userId)).id;

  const effortMap: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const task = await createTask(userId, {
    projectId: targetProjectId,
    name: routing.title,
    description: [
      routing.summary,
      "",
      `_Auto-created by GSD capture pipeline (confidence: ${(routing.confidence * 100).toFixed(0)}%)_`,
    ].join("\n"),
    effort: effortMap[routing.priority] ?? 2,
  });

  return task.id;
}
