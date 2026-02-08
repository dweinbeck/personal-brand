import type {
  TodoistProject,
  TodoistSection,
  TodoistTask,
} from "@/types/todoist";

const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN;
const BASE_URL = "https://api.todoist.com/rest/v2";

async function todoistFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${TODOIST_API_TOKEN}`,
    },
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    console.error(`Todoist API error: ${res.status} on ${endpoint}`);
    return [] as unknown as T;
  }

  return res.json();
}

export async function fetchTodoistProjects(): Promise<TodoistProject[]> {
  return todoistFetch<TodoistProject[]>("/projects");
}

export async function fetchProjectSections(
  projectId: string,
): Promise<TodoistSection[]> {
  return todoistFetch<TodoistSection[]>(`/sections?project_id=${projectId}`);
}

export async function fetchProjectTasks(
  projectId: string,
): Promise<TodoistTask[]> {
  return todoistFetch<TodoistTask[]>(`/tasks?project_id=${projectId}`);
}
