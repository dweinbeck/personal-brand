import type {
  Project,
  Section,
  Tag,
  Task,
  Workspace,
} from "@/generated/prisma/client";

export type TaskWithRelations = Task & {
  subtasks: Task[];
  tags: { tag: Tag }[];
  section: Section | null;
};

export type ProjectWithSections = Project & {
  sections: (Section & {
    tasks: TaskWithRelations[];
  })[];
  tasks: TaskWithRelations[];
};

export type WorkspaceWithProjects = Workspace & {
  projects: (Project & {
    _count: { tasks: number };
  })[];
};

export type SidebarProject = {
  id: string;
  name: string;
  openTaskCount: number;
};

export type SidebarWorkspace = {
  id: string;
  name: string;
  projects: SidebarProject[];
};
