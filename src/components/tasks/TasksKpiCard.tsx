import { Card } from "@/components/ui/Card";

type TasksKpiCardProps = {
  completedYesterday: number;
  totalTasks: number;
  mitTask: { id: string; name: string; projectName: string | null } | null;
  nextTasks: { id: string; name: string; projectName: string | null }[];
};

function TaskMiniCard({
  label,
  name,
  projectName,
}: {
  label: string;
  name: string;
  projectName: string | null;
}) {
  return (
    <div className="rounded-xl bg-[#f5f0e8] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-text-primary">{name}</p>
      {projectName && (
        <p className="mt-0.5 text-xs text-text-tertiary">{projectName}</p>
      )}
    </div>
  );
}

function EmptyMiniCard({ label }: { label: string }) {
  return (
    <div className="rounded-xl bg-[#f5f0e8] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
        {label}
      </p>
      <p className="mt-1 text-sm italic text-text-tertiary">
        No {label.toLowerCase()} task
      </p>
    </div>
  );
}

export function TasksKpiCard({
  completedYesterday,
  totalTasks,
  mitTask,
  nextTasks,
}: TasksKpiCardProps) {
  const nextSlots = [nextTasks[0] ?? null, nextTasks[1] ?? null];

  return (
    <Card variant="default" className="mb-6">
      <h3 className="mb-4 font-display text-lg font-semibold text-primary">
        Your Tasks at a Glance
      </h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Column 1 - Stats */}
        <div className="space-y-4">
          <div>
            <p className="text-sm text-text-secondary">
              Tasks completed yesterday
            </p>
            <p className="text-2xl font-bold text-primary">
              {completedYesterday}
            </p>
          </div>
          <div>
            <p className="text-sm text-text-secondary">Current Total Tasks</p>
            <p className="text-2xl font-bold text-primary">{totalTasks}</p>
          </div>
        </div>

        {/* Column 2 - MIT Task */}
        <div>
          {mitTask ? (
            <TaskMiniCard
              label="MIT"
              name={mitTask.name}
              projectName={mitTask.projectName}
            />
          ) : (
            <EmptyMiniCard label="MIT" />
          )}
        </div>

        {/* Column 3 - Next Tasks */}
        <div className="space-y-3">
          {nextSlots.map((task, index) =>
            task ? (
              <TaskMiniCard
                key={task.id}
                label={index === 0 ? "Next" : "Next"}
                name={task.name}
                projectName={task.projectName}
              />
            ) : (
              <EmptyMiniCard
                key={`empty-next-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: static two-slot layout
                  index
                }`}
                label="Next"
              />
            ),
          )}
        </div>
      </div>
    </Card>
  );
}
