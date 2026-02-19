export type HelpTipId =
  | "quick-add"
  | "board-view"
  | "sections"
  | "search"
  | "tags"
  | "effort"
  | "today-view"
  | "subtasks";

export const HELP_TIPS: Record<HelpTipId, { title: string; body: string }> = {
  "quick-add": {
    title: "Quick Add",
    body: "Create a task from any page. Choose a project, set a deadline, and assign tags all in one step.",
  },
  "board-view": {
    title: "Board View",
    body: "Toggle between list and board (Kanban) view. Board view shows sections as columns with drag-free visual organization.",
  },
  sections: {
    title: "Sections",
    body: "Group related tasks within a project. Each section shows its own effort total.",
  },
  search: {
    title: "Search Tasks",
    body: "Search across all your tasks by name or description. Results update as you type.",
  },
  tags: {
    title: "Tags",
    body: "Organize tasks with colored tags. Click a tag to see all tasks with that label.",
  },
  effort: {
    title: "Effort Scoring",
    body: "Assign effort points (Fibonacci-ish: 1, 2, 3, 5, 8, 13) to estimate task complexity. Totals roll up to sections and projects.",
  },
  "today-view": {
    title: "Today View",
    body: "Shows all tasks with a deadline set to today, across all projects.",
  },
  subtasks: {
    title: "Subtasks",
    body: "Break down complex tasks into smaller subtasks. Progress shows as a fraction (e.g., 2/5) on the parent task.",
  },
};
