import Link from "next/link";

interface TodoistProjectCardProps {
  id: string;
  name: string;
  taskCount: number;
}

export function TodoistProjectCard({ id, name, taskCount }: TodoistProjectCardProps) {
  return (
    <Link
      href={`/control-center/todoist/${id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-gray-300 transition-all"
    >
      <h3 className="text-base font-semibold text-gray-900 mb-2">{name}</h3>
      <p className="text-sm text-gray-500">
        {taskCount} {taskCount === 1 ? "task" : "tasks"}
      </p>
    </Link>
  );
}
