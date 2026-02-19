export const EFFORT_VALUES = [1, 2, 3, 5, 8, 13] as const;
export type EffortValue = (typeof EFFORT_VALUES)[number];

/**
 * Compute sum of effort scores for incomplete, top-level tasks.
 * Tasks with null effort are excluded (not counted as 0).
 * Tasks with status !== "OPEN" are excluded.
 * Subtasks (parentTaskId !== null) should NOT be passed to this function
 * — the caller is responsible for filtering them out to avoid double-counting.
 */
export function computeEffortSum(
  tasks: { effort: number | null; status: string }[],
): number {
  return tasks
    .filter((t) => t.status === "OPEN" && t.effort != null)
    .reduce((sum, t) => sum + (t.effort as number), 0);
}
