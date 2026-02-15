import type { Metadata } from "next";
import { TasksLandingPage } from "@/components/apps/TasksLandingPage";

export const metadata: Metadata = {
  title: "Tasks | Daniel Weinbeck",
  description:
    "Full-featured task management with workspaces, projects, sections, tags, subtasks, and board views.",
};

export default function Page() {
  return <TasksLandingPage />;
}
