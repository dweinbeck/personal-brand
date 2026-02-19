---
phase: quick-10
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/tasks/task-card.tsx
  - src/components/tasks/board-view.tsx
  - src/app/apps/tasks/(authenticated)/page.tsx
  - src/app/apps/tasks/(authenticated)/import-button.tsx
  - src/actions/tasks/import.ts
autonomous: true
requirements: [IMPORT-01, CARD-01, CLEANUP-01, ARCHIVE-01]

must_haves:
  truths:
    - "Focus sprint data (30 tasks, 82 subtasks) is imported into the local database"
    - "Task card titles can wrap to 2 lines instead of truncating"
    - "Effort badge appears at bottom-right of each card"
    - "Import button no longer appears on the Tasks home page"
    - "Completed tasks older than 2 days are hidden from the board view"
    - "All completed tasks remain accessible on the /completed page"
  artifacts:
    - path: "src/components/tasks/task-card.tsx"
      provides: "Two-line title with line-clamp-2 and repositioned effort badge"
    - path: "src/components/tasks/board-view.tsx"
      provides: "2-day auto-archive filter for completed tasks"
    - path: "src/app/apps/tasks/(authenticated)/page.tsx"
      provides: "Home page without ImportButton"
  key_links:
    - from: "src/components/tasks/board-view.tsx"
      to: "task.updatedAt"
      via: "Date comparison filter on completed tasks"
      pattern: "updatedAt.*Date"
---

<objective>
Four focused improvements to the Tasks app: (1) trigger the data import from the local JSON file, (2) allow task card titles to wrap to 2 lines with effort badge repositioned to bottom-right, (3) remove the one-time import infrastructure from the home page, (4) auto-hide completed tasks older than 2 days from the board view.

Purpose: Import sprint data, improve card readability, clean up temporary UI, and reduce board clutter.
Output: Updated task-card.tsx, board-view.tsx, and page.tsx; deleted import infrastructure files.
</objective>

<execution_context>
@/Users/dweinbeck/.claude/get-shit-done/workflows/execute-plan.md
@/Users/dweinbeck/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@src/components/tasks/task-card.tsx
@src/components/tasks/board-view.tsx
@src/app/apps/tasks/(authenticated)/page.tsx
@src/actions/tasks/import.ts
@src/app/apps/tasks/(authenticated)/import-button.tsx
@src/services/tasks/project.service.ts
@src/lib/tasks/types.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Trigger data import from local dev server</name>
  <files>
    (no files modified -- this is a runtime action)
  </files>
  <action>
    The import server action at `src/actions/tasks/import.ts` reads from the filesystem (`.planning/focus-sprint-30d.tasks-import.json`). This only works on the LOCAL dev server where the file exists on disk.

    Steps:
    1. Ensure the local dev server is running on localhost:3000 (`npm run dev` if not already running)
    2. Create a small one-shot Node.js script (or use curl/fetch) to invoke the import. The simplest approach: use the browser console or write a quick script that:
       - Calls the Next.js server action endpoint directly
       - OR: Write a temporary script `scripts/run-import.ts` that imports and calls `importTasksAction` with a valid Firebase ID token

    Actually, the cleanest approach given this is a server action: navigate to the Tasks home page on localhost:3000 in the browser and click the "Import Sprint Plan" button. The button already exists at `src/app/apps/tasks/(authenticated)/page.tsx` line 56.

    **Preferred approach:** Tell the user to:
    1. Start the dev server: `npm run dev`
    2. Navigate to `http://localhost:3000/apps/tasks` in their browser
    3. Click the "Import Sprint Plan" button
    4. Wait for the import summary to appear (should show ~30 tasks created, ~82 subtasks created)

    Since this is a user-interactive step (requires Firebase auth token from browser session), this task should instruct the user rather than automate. However, we can verify the import file exists first:
    - Confirm `.planning/focus-sprint-30d.tasks-import.json` exists and is valid JSON
    - Confirm the dev server can be started

    After the user confirms the import succeeded, proceed to the next tasks.
  </action>
  <verify>
    Verify the import file exists: `ls -la .planning/focus-sprint-30d.tasks-import.json`
    After user clicks import: the summary should show tasks created > 0 and subtasks created > 0.
  </verify>
  <done>Focus sprint data (30 tasks, 82 subtasks) is imported into the local Prisma database. The import summary confirms creation counts.</done>
</task>

<task type="auto">
  <name>Task 2: Two-line card titles with effort badge bottom-right</name>
  <files>src/components/tasks/task-card.tsx</files>
  <action>
    Modify the collapsed task card layout in `src/components/tasks/task-card.tsx` (lines 126-179):

    **Title change (lines 131-142):**
    - Remove the wrapping `<div className="flex items-center gap-2">` around the title span (it's unnecessary since effort badge is moving)
    - On the title `<span>`, replace `truncate` with `line-clamp-2` to allow 2-line wrapping
    - Keep all other classes (`text-sm font-medium`, conditional `line-through text-text-tertiary` / `text-text-primary`)

    **Effort badge relocation:**
    - Remove the effort badge from the metadata row (lines 157-160, the `{task.effort != null && ...}` block inside the `flex items-center gap-2 mt-1.5` div)
    - Add the effort badge as an absolutely-positioned element at bottom-right of the card
    - The card outer div (line 99) already has classes. Add `relative` to it so the badge can be positioned absolutely.
    - Add the effort badge after the metadata row but still inside the button, positioned with `absolute bottom-0 right-0` styling. Use the same badge styling: `text-xs font-medium text-amber px-1.5 py-0.5 rounded-full bg-amber/10 border border-amber/20`

    **Implementation detail for the badge positioning:**
    The effort badge should sit at the bottom-right of the content area (inside the clickable button, not overlapping the hover action buttons). Restructure the inner layout:

    1. The main content button (`flex-1 min-w-0`) should get `relative` added
    2. Place the effort badge inside that button but outside the normal flow:
       ```tsx
       {task.effort != null && (
         <span className="absolute bottom-0 right-0 text-xs font-medium text-amber px-1.5 py-0.5 rounded-full bg-amber/10 border border-amber/20">
           {task.effort}
         </span>
       )}
       ```
    3. Add `pb-5` (padding-bottom) to the button when effort exists so the badge doesn't overlap content. Use a conditional: `cn("flex-1 min-w-0 cursor-pointer text-left relative", task.effort != null && "pb-5")`

    This keeps the badge consistently at bottom-right of the card's content area regardless of 1 or 2 line titles.
  </action>
  <verify>
    Run `npm run lint && npm run build` to confirm no errors. Visually: task cards should show up to 2 lines of title text and the amber effort badge should appear at bottom-right of the card content area.
  </verify>
  <done>Task card titles wrap to 2 lines (line-clamp-2 instead of truncate). Effort badge displays at bottom-right of the card content. Cards maintain consistent height whether using 1 or 2 title lines.</done>
</task>

<task type="auto">
  <name>Task 3: Remove import infrastructure and clean up home page</name>
  <files>
    src/app/apps/tasks/(authenticated)/page.tsx
    src/app/apps/tasks/(authenticated)/import-button.tsx
    src/actions/tasks/import.ts
  </files>
  <action>
    The one-time import is complete (Task 1). Remove the temporary import infrastructure:

    1. **Edit `src/app/apps/tasks/(authenticated)/page.tsx`:**
       - Remove line 10: `import { ImportButton } from "./import-button";`
       - Remove line 56: `<ImportButton />`
       - Keep the rest of the page intact (KPI card, workspace empty state)

    2. **Delete `src/app/apps/tasks/(authenticated)/import-button.tsx`** -- one-time component no longer needed

    3. **Delete `src/actions/tasks/import.ts`** -- one-time server action no longer needed
  </action>
  <verify>
    Run `npm run lint && npm run build` to confirm no broken imports or references. Grep for "ImportButton" and "importTasksAction" across the codebase to confirm no remaining references.
  </verify>
  <done>ImportButton removed from Tasks home page. import-button.tsx and import.ts deleted. Build passes with no broken references.</done>
</task>

<task type="auto">
  <name>Task 4: 2-day auto-archive for completed tasks in board view</name>
  <files>src/components/tasks/board-view.tsx</files>
  <action>
    Filter completed tasks in the board view to only show those completed within the last 2 days. Older completed tasks remain accessible via the `/completed` page.

    In `src/components/tasks/board-view.tsx`, modify the `completedTasks` array (lines 29-34):

    After collecting all completed tasks, filter by `updatedAt`:
    ```tsx
    // Calculate cutoff: start of the day 2 days ago
    const archiveCutoff = new Date();
    archiveCutoff.setHours(0, 0, 0, 0);
    archiveCutoff.setDate(archiveCutoff.getDate() - 1);
    // This gives us start-of-yesterday, so tasks completed today or yesterday are shown

    const allCompletedTasks = [
      ...project.tasks.filter((t) => t.status === "COMPLETED"),
      ...project.sections.flatMap((s) =>
        s.tasks.filter((t) => t.status === "COMPLETED"),
      ),
    ];

    const completedTasks = allCompletedTasks.filter(
      (t) => new Date(t.updatedAt) >= archiveCutoff,
    );
    ```

    The `updatedAt` field is already available on Task objects from Prisma (the `TaskWithRelations` type extends `Task` which includes `updatedAt`). When a task is toggled to COMPLETED, Prisma's `@updatedAt` directive automatically sets the timestamp.

    Update the `completedEffortSum` calculation (lines 36-38) to use the filtered `completedTasks` (it already does by variable name, so just ensure it references the filtered array).

    Also update the column header count and effort sum to reflect only the visible (recent) completed tasks -- these already reference `completedTasks` so no change needed there.

    Optionally, add a small note below the "Completed" header when there are hidden archived tasks:
    ```tsx
    const archivedCount = allCompletedTasks.length - completedTasks.length;
    ```
    And in the header area, after the count span, if `archivedCount > 0`:
    ```tsx
    {archivedCount > 0 && (
      <span className="text-[10px] text-text-tertiary ml-1">
        +{archivedCount} archived
      </span>
    )}
    ```

    This tells the user there are more completed tasks not shown, viewable on `/completed`.
  </action>
  <verify>
    Run `npm run lint && npm run build` to confirm no errors. The board view Completed column should only show tasks with `updatedAt` from today or yesterday. Tasks completed 2+ days ago should not appear in the board view but should still appear on the `/completed` page.
  </verify>
  <done>Board view only shows completed tasks from the last 2 days (today + yesterday). Older completed tasks are hidden with an "+N archived" indicator. All completed tasks remain accessible via /completed page.</done>
</task>

</tasks>

<verification>
- `npm run lint` passes with zero errors
- `npm run build` passes with zero errors
- `npm test` passes (if applicable tests exist)
- No references to ImportButton or importTasksAction remain in the codebase
- Task cards display 2-line titles with effort badge at bottom-right
- Board view Completed column only shows recently completed tasks
</verification>

<success_criteria>
1. Sprint data imported into local database (30 tasks, 82 subtasks)
2. Task card titles wrap to 2 lines; effort badge at bottom-right of card
3. Import button and infrastructure removed from codebase
4. Board view auto-archives completed tasks older than 2 days
5. All quality gates pass (lint, build, test)
</success_criteria>

<output>
After completion, create `.planning/quick/10-tasks-app-retry-data-import-two-line-car/10-SUMMARY.md`
</output>
