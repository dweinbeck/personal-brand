import { createTask } from "@/services/tasks/task.service";
import type { RoutingOutput } from "../schemas";

/**
 * Create a task from a routing result.
 * Returns the created task ID.
 */
export async function routeToTask(routing: RoutingOutput): Promise<string> {
  const userId = process.env.GSD_TASKS_USER_ID;
  if (!userId) {
    throw new Error(
      "GSD_TASKS_USER_ID not configured. Cannot create tasks from captures.",
    );
  }

  const projectId = process.env.GSD_TASKS_PROJECT_ID;
  if (!projectId) {
    throw new Error(
      "GSD_TASKS_PROJECT_ID not configured. Set to the target project ID for captured tasks.",
    );
  }

  const effortMap: Record<string, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  const task = await createTask(userId, {
    projectId,
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
