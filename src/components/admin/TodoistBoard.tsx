import type { TodoistSection, TodoistTask } from "@/types/todoist";

interface TodoistBoardProps {
  sections: TodoistSection[];
  tasks: TodoistTask[];
}

export function TodoistBoard({ sections, tasks }: TodoistBoardProps) {
  const unsectionedTasks = tasks.filter((t) => !t.section_id);
  const columns = [
    ...(unsectionedTasks.length > 0
      ? [{ id: "", name: "No Section", tasks: unsectionedTasks }]
      : []),
    ...sections.map((section) => ({
      id: section.id,
      name: section.name,
      tasks: tasks
        .filter((t) => t.section_id === section.id)
        .sort((a, b) => a.order - b.order),
    })),
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div
          key={col.id}
          className="flex-shrink-0 w-72 rounded-lg bg-gray-50 border border-gray-200 p-4"
        >
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            {col.name}{" "}
            <span className="text-gray-400 font-normal">
              ({col.tasks.length})
            </span>
          </h3>
          <div className="flex flex-col gap-2">
            {col.tasks.map((task) => (
              <div
                key={task.id}
                className="rounded-md bg-white border border-gray-200 p-3 shadow-sm"
              >
                <p className="text-sm text-gray-900">{task.content}</p>
                {task.due && (
                  <p className="text-xs text-gray-400 mt-1">
                    {task.due.string}
                  </p>
                )}
                {task.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {task.labels.map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-600"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {col.tasks.length === 0 && (
              <p className="text-xs text-gray-400 italic">No tasks</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
