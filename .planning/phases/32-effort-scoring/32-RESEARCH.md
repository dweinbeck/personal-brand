# Phase 32: Effort Scoring - Research

**Researched:** 2026-02-11
**Domain:** Prisma schema extension, Zod validation, React UI components, aggregate computation
**Confidence:** HIGH

## Summary

Effort scoring adds an optional integer field (`effort`) to the Task model, constrained to a Fibonacci-like scale (1, 2, 3, 5, 8, 13). The feature touches every layer of the todoist stack: Prisma schema, Zod validation schemas, server actions, service functions, and multiple React components (task form, quick-add modal, task card, section header, project view, board view, sidebar). The rollup computation (summing effort for incomplete tasks per section and per project) is a pure function that can be computed client-side from already-fetched task data -- no new database queries needed.

The todoist codebase follows a clean layered architecture: Prisma schema -> generated client -> service layer -> server actions -> React components. The existing test pattern uses Vitest with pure function extraction (logic is extracted from service/component code into testable functions, then tested without database mocking). This same pattern should be used for the effort rollup computation tests.

**Primary recommendation:** Add an optional `Int?` field to the Prisma Task model, validate with Zod's enum/union of literal values, compute rollups client-side from existing included task data, and build an `EffortSelector` component using the existing button-group pattern from tag selection.

## Standard Stack

### Core (already in todoist)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.19.2 | Database schema & ORM | Already used; schema extension is trivial |
| Zod | 4.3.6 | Input validation schemas | Already used for all task schemas |
| Next.js | 16.1.6 | App Router, server actions | Already used for all pages/actions |
| React | 19.2.3 | UI components | Already used throughout |
| Tailwind CSS | 4.x | Styling | Already used throughout |
| Vitest | 3.2.4 | Unit testing | Already used for existing tests |
| clsx | 2.1.1 | Conditional classnames | Already used via `cn()` utility |

### Supporting
No new libraries needed. This feature is implemented entirely with the existing stack.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Client-side rollup computation | Prisma `_sum` aggregate query | Unnecessary DB round-trip; task data already fetched with full includes |
| Zod enum of allowed values | Simple number input with validation | Enum provides type-safe constraint at parse time; prevents invalid values |
| Optional `Int?` in Prisma | Default `0` | Requirement EFFORT-05 specifies unscored != 0; `null` is semantically correct |

## Architecture Patterns

### Current Todoist Architecture (do not change)
```
prisma/schema.prisma          # Data model
src/generated/prisma/          # Auto-generated Prisma client
src/lib/schemas/task.ts        # Zod validation schemas
src/services/task.service.ts   # Database operations
src/actions/task.ts            # Server actions (thin wrappers)
src/types/index.ts             # Composite TypeScript types
src/components/tasks/          # React components
src/__tests__/                 # Vitest unit tests
```

### Pattern 1: Schema Extension (add field to Prisma + Zod + types)
**What:** Add `effort Int?` to Task model, add to Zod schemas, TypeScript types auto-propagate via Prisma client.
**When to use:** Any time a new optional field is added to an existing model.
**Key detail:** The generated Prisma `Task` type in `@/generated/prisma/client` automatically includes the new field after `prisma generate`. The composite types in `src/types/index.ts` extend this generated type, so they get `effort` for free. No changes needed in `types/index.ts`.

### Pattern 2: Effort Rollup Computation (pure function)
**What:** A pure function that takes an array of tasks and sums their `effort` values, filtering for `status === "OPEN"` and `effort !== null`.
**When to use:** Displaying aggregate effort on section headers and project headers.
**Key insight:** The `getProject()` service already fetches all tasks for sections and unsectioned tasks with full includes. The rollup can be computed from this data without additional queries. Extract the rollup function into a utility so it can be unit tested.

### Pattern 3: Selector Component (button group)
**What:** A row of toggle buttons for Fibonacci values, matching the existing tag selection UI pattern.
**When to use:** TaskForm and QuickAddModal effort selection.
**Key pattern:** The todoist codebase uses toggle-button groups for tag selection (see `task-form.tsx` lines 143-161). The effort selector should follow the same visual pattern: small rounded buttons that toggle selection.

### Pattern 4: Test Extraction (pure functions tested without DB)
**What:** The existing test pattern extracts logic into pure functions and tests them directly, avoiding database mocking. See `subtask-nesting.test.ts` and `today-filter.test.ts`.
**When to use:** For testing effort rollup computation.
**Key insight:** Do NOT try to mock Prisma or test through server actions. Extract `computeEffortSum()` as a pure function, test it with plain data.

### Anti-Patterns to Avoid
- **Storing effort as 0 for unscored tasks:** Use `null`. Requirement EFFORT-05 explicitly says unscored tasks must not show "0" and must be excluded from rollups. A `null` value is semantically correct and simplifies the rollup filter.
- **Adding a new database query for rollups:** The task data is already fetched by `getProject()` with full includes. Computing sums client-side is simpler and faster.
- **Creating a separate effort model/table:** Effort is a simple scalar on Task. A separate table would be over-engineering.
- **Using `@default(0)` on the Prisma field:** This would make every existing task show "0" effort, violating EFFORT-05.
- **Putting rollup logic inside components:** Extract to a utility function so it can be unit tested.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Fibonacci sequence validation | Manual `if` chain | Zod `z.union(z.literal(1), z.literal(2), ...)` or `z.enum()` | Type-safe, self-documenting, single source of truth |
| Database schema changes | Manual SQL | `prisma db push` (dev) or `prisma migrate dev` (production) | Prisma handles column addition idempotently |
| Conditional CSS classes | String concatenation | `cn()` utility (already exists, uses `clsx`) | Handles falsy values, cleaner syntax |

**Key insight:** This feature is straightforward CRUD extension. Every pattern needed already exists in the codebase -- just follow the existing conventions.

## Common Pitfalls

### Pitfall 1: Forgetting to run `prisma generate` after schema change
**What goes wrong:** TypeScript types don't include the new `effort` field; builds fail with type errors.
**Why it happens:** Prisma client must be regenerated after schema changes.
**How to avoid:** Run `npm run db:generate` (which runs `prisma generate`) immediately after modifying `schema.prisma`. Then run `npm run db:push` to sync the database.
**Warning signs:** TypeScript errors about `effort` not existing on `Task` type.

### Pitfall 2: Breaking existing task creation by making effort required
**What goes wrong:** All existing create/update flows break because they don't pass `effort`.
**Why it happens:** If `effort` is made required in Zod schema but not passed by existing code.
**How to avoid:** Make `effort` optional in both Prisma (`Int?`) and Zod (`.optional().nullable()`). Existing code that doesn't pass effort continues to work.
**Warning signs:** Form submissions fail silently or show validation errors.

### Pitfall 3: Including completed tasks in effort rollup
**What goes wrong:** Effort sums include completed tasks, giving misleading "remaining effort" numbers.
**Why it happens:** Forgetting to filter by `status === "OPEN"` in the rollup function.
**How to avoid:** The rollup function must filter for `status === "OPEN"` AND `effort !== null`. Test both conditions.
**Warning signs:** Effort sum doesn't decrease when tasks are completed.

### Pitfall 4: Showing effort badge as "0" for unscored tasks
**What goes wrong:** Unscored tasks show a "0" badge, which is visually noisy and semantically wrong.
**Why it happens:** Rendering `task.effort` without null-checking first.
**How to avoid:** Only render the effort badge when `task.effort !== null && task.effort !== undefined`. The requirement (EFFORT-05) explicitly says unscored tasks should display distinctly (no badge).
**Warning signs:** Every task shows a "0" badge.

### Pitfall 5: Not adding effort to the update action parameter type
**What goes wrong:** Users can set effort on create but not change it during edit.
**Why it happens:** Adding `effort` to the create schema/action but forgetting the update schema/action.
**How to avoid:** Add `effort` to both `createTaskSchema`, `updateTaskSchema`, `createTaskAction` parameter type, and `updateTaskAction` parameter type.
**Warning signs:** Edit form shows effort selector but save doesn't persist changes.

### Pitfall 6: Forgetting to pass effort through the service layer
**What goes wrong:** Effort is validated by Zod but never written to the database.
**Why it happens:** The `updateTask` service destructures `{ id, tagIds, ...data }` and passes `data` to Prisma. If `effort` is in the schema but the action doesn't include it in the data object, it won't be persisted.
**How to avoid:** Ensure the server action includes `effort` in the data passed to the service. The current `updateTask` service uses spread (`...data`) which will automatically include any new fields -- just make sure the action passes it through.
**Warning signs:** Effort selection works in UI but reverts after page refresh.

### Pitfall 7: Board view and section header showing stale task counts
**What goes wrong:** Effort sums are computed from potentially filtered task lists, giving wrong numbers.
**Why it happens:** The `project-view.tsx` currently passes `section.tasks.length` as `taskCount` to `SectionHeader`. Effort sum needs the actual task array, not just a count.
**How to avoid:** Pass the tasks array (or pre-computed effort sum) to `SectionHeader` instead of just the count.
**Warning signs:** Section effort sum doesn't match manual count.

## Code Examples

Verified patterns from the existing todoist codebase:

### Prisma Schema Addition
```prisma
// In prisma/schema.prisma, add to Task model:
model Task {
  // ... existing fields ...
  effort       Int?      // Optional; null = unscored. Valid values: 1, 2, 3, 5, 8, 13
  // ... existing relations ...
}
```

### Zod Schema Extension
```typescript
// In src/lib/schemas/task.ts
// Effort field: optional nullable, constrained to Fibonacci-like values
const effortValues = [1, 2, 3, 5, 8, 13] as const;

export const createTaskSchema = z.object({
  projectId: z.string().min(1),
  sectionId: z.string().nullable().optional(),
  parentTaskId: z.string().nullable().optional(),
  name: z.string().min(1, "Name is required").max(500),
  description: z.string().max(5000).optional(),
  deadlineAt: z.coerce.date().nullable().optional(),
  tagIds: z.array(z.string()).optional(),
  effort: z.union([
    z.literal(1), z.literal(2), z.literal(3),
    z.literal(5), z.literal(8), z.literal(13),
  ]).nullable().optional(),
});

// Same pattern for updateTaskSchema
```

### Effort Rollup Utility
```typescript
// In src/lib/effort.ts
export const EFFORT_VALUES = [1, 2, 3, 5, 8, 13] as const;
export type EffortValue = (typeof EFFORT_VALUES)[number];

/**
 * Compute sum of effort scores for incomplete tasks.
 * Null/undefined effort values are excluded (not counted as 0).
 */
export function computeEffortSum(
  tasks: { effort: number | null; status: string }[],
): number {
  return tasks
    .filter((t) => t.status === "OPEN" && t.effort != null)
    .reduce((sum, t) => sum + (t.effort as number), 0);
}
```

### Effort Selector Component Pattern
```typescript
// Follows the tag toggle pattern from task-form.tsx lines 143-161
// Button group with active/inactive states using gold-light highlight
{EFFORT_VALUES.map((value) => (
  <button
    key={value}
    type="button"
    onClick={() => setEffort(effort === value ? null : value)}
    className={cn(
      "px-2.5 py-1 text-xs rounded-full border transition-colors cursor-pointer",
      effort === value
        ? "bg-gold-light border-gold text-primary font-medium"
        : "border-border text-text-tertiary hover:border-gold hover:text-text-primary"
    )}
  >
    {value}
  </button>
))}
```

### Effort Badge on Task Card
```typescript
// In task-card.tsx, alongside existing deadline and tag badges
{task.effort != null && (
  <span className="text-xs font-medium text-amber px-1.5 py-0.5 rounded-full bg-amber/10 border border-amber/20">
    {task.effort}
  </span>
)}
```

### Section Header with Effort Sum
```typescript
// In section-header.tsx, beside task count
{effortSum > 0 && (
  <span className="ml-1 text-xs font-normal text-amber">
    {effortSum}
  </span>
)}
```

### Test Pattern (following existing convention)
```typescript
// In src/__tests__/effort-rollup.test.ts
import { describe, expect, it } from "vitest";
import { computeEffortSum } from "@/lib/effort";

describe("Effort rollup computation", () => {
  it("sums effort for open tasks only", () => {
    const tasks = [
      { effort: 3, status: "OPEN" },
      { effort: 5, status: "COMPLETED" },
      { effort: 8, status: "OPEN" },
    ];
    expect(computeEffortSum(tasks)).toBe(11);
  });

  it("excludes tasks with null effort", () => {
    const tasks = [
      { effort: null, status: "OPEN" },
      { effort: 5, status: "OPEN" },
    ];
    expect(computeEffortSum(tasks)).toBe(5);
  });

  it("returns 0 for empty array", () => {
    expect(computeEffortSum([])).toBe(0);
  });

  it("returns 0 when all tasks completed", () => {
    const tasks = [
      { effort: 3, status: "COMPLETED" },
      { effort: 5, status: "COMPLETED" },
    ];
    expect(computeEffortSum(tasks)).toBe(0);
  });

  it("returns 0 when all tasks unscored", () => {
    const tasks = [
      { effort: null, status: "OPEN" },
      { effort: null, status: "OPEN" },
    ];
    expect(computeEffortSum(tasks)).toBe(0);
  });
});
```

## Files That Need Changes

| File | Change Type | What Changes |
|------|-------------|--------------|
| `prisma/schema.prisma` | Add field | `effort Int?` on Task model |
| `src/lib/schemas/task.ts` | Add validation | `effort` field in create and update schemas |
| `src/services/task.service.ts` | Pass through | `effort` included in create data spread (already works via spread) |
| `src/actions/task.ts` | Add parameter | `effort` in action input types |
| `src/lib/effort.ts` | **New file** | `EFFORT_VALUES`, `EffortValue` type, `computeEffortSum()` |
| `src/components/tasks/task-form.tsx` | Add selector | Effort selector UI, state, pass to actions |
| `src/components/tasks/quick-add-modal.tsx` | Add selector | Effort selector UI, state, pass to actions |
| `src/components/tasks/task-card.tsx` | Add badge | Effort badge display (when not null) |
| `src/components/tasks/section-header.tsx` | Add effort sum | Accept + display effort sum prop |
| `src/app/tasks/[projectId]/project-view.tsx` | Compute + pass sums | Compute effort sums, pass to section headers, show project total |
| `src/components/tasks/board-view.tsx` | Show effort sums | Show effort sum per column header |
| `src/__tests__/effort-rollup.test.ts` | **New file** | Unit tests for `computeEffortSum()` |
| `src/__tests__/schemas.test.ts` | Add tests | Validation tests for effort field in task schema |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Prisma `db push` only | `db push` for dev, `migrate dev` for production | Prisma 4+ | This project uses `db:push` for dev; no migrations directory exists |
| Zod v3 | Zod v4 (4.3.6) | 2025 | Import from `"zod"` directly; `z.union([z.literal(...)])` pattern works in both |

**No deprecated patterns in use.** The todoist codebase is current with latest Prisma 6.x and Zod 4.x.

## Open Questions

1. **Should subtasks also support effort scoring?**
   - What we know: The requirements say "any task" which could include subtasks. Subtasks are created via `SubtaskList` component which has a simpler inline form (just a name input).
   - What's unclear: Whether the simpler subtask creation flow should include an effort selector.
   - Recommendation: Include effort on subtasks in the data model (it's the same Task model), but keep the inline subtask creation form simple (name only). Users can edit a subtask's effort via the full task edit form if needed. Subtask effort should NOT be included in section/project rollup sums (since subtasks are nested, counting both parent and child would double-count).

2. **Should effort sum appear in the sidebar next to project names?**
   - What we know: EFFORT-04 says "user can see sum of effort scores for all incomplete tasks in a project." The sidebar currently shows `openTaskCount`. The project header in `ProjectView` is another location.
   - What's unclear: Whether "project header" means the sidebar project link or the in-page project title.
   - Recommendation: Show effort sum on the project view header (next to the project name in `ProjectView`). The sidebar already shows task count; adding effort there would be cluttered. If the user wants it in the sidebar, it can be added later.

3. **How should the effort rollup interact with board view?**
   - What we know: Board view shows column headers with task counts per section.
   - What's unclear: Whether effort sums should appear in board column headers too.
   - Recommendation: Yes, show effort sum in board column headers alongside task count. The board view already maps sections to columns and has access to task arrays.

## Sources

### Primary (HIGH confidence)
- Todoist codebase direct inspection - all files read and analyzed
- Prisma 6.19.2 schema syntax - verified via `prisma --version` and existing `schema.prisma`
- Zod 4.3.6 API - verified via `package.json` and existing usage in `src/lib/schemas/task.ts`
- Vitest 3.2.4 test patterns - verified via existing tests in `src/__tests__/`

### Secondary (MEDIUM confidence)
- Fibonacci-like effort scales (1, 2, 3, 5, 8, 13) are the standard agile story point values used in Scrum estimation. This is well-established practice.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new libraries needed, all patterns exist in codebase
- Architecture: HIGH - direct codebase inspection, clear layered architecture
- Pitfalls: HIGH - identified from reading actual code paths that need modification
- Code examples: HIGH - modeled directly on existing codebase patterns

**Research date:** 2026-02-11
**Valid until:** 2026-03-11 (stable; no external dependencies to go stale)
