import type { Section, Tag } from "@/generated/prisma/client";
import type {
  ProjectWithSections,
  SidebarWorkspace,
  TaskWithRelations,
} from "@/lib/tasks/types";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DEMO_USER_ID = "demo-user";
const now = new Date();

function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function daysFromNow(days: number): Date {
  return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------
const tagDefs = [
  { id: "demo-tag-1", name: "Frontend", color: "#3b82f6" },
  { id: "demo-tag-2", name: "Backend", color: "#10b981" },
  { id: "demo-tag-3", name: "Design", color: "#8b5cf6" },
  { id: "demo-tag-4", name: "High Priority", color: "#ef4444" },
  { id: "demo-tag-5", name: "Bug Fix", color: "#f97316" },
  { id: "demo-tag-6", name: "Documentation", color: "#6b7280" },
  { id: "demo-tag-7", name: "Research", color: "#14b8a6" },
  { id: "demo-tag-8", name: "Testing", color: "#eab308" },
] as const;

export const DEMO_TAGS: {
  id: string;
  name: string;
  color: string | null;
  userId: string;
}[] = tagDefs.map((t) => ({ ...t, userId: DEMO_USER_ID }));

export const DEMO_SIDEBAR_TAGS: {
  id: string;
  name: string;
  color: string | null;
}[] = tagDefs.map((t) => ({ id: t.id, name: t.name, color: t.color }));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function makeTag(tagId: string): { tag: Tag } {
  const def = tagDefs.find((t) => t.id === tagId);
  if (!def) throw new Error(`Unknown tag: ${tagId}`);
  return {
    tag: {
      id: def.id,
      userId: DEMO_USER_ID,
      name: def.name,
      color: def.color,
    },
  };
}

let taskCounter = 0;

function makeTask(overrides: {
  id?: string;
  projectId: string;
  sectionId?: string | null;
  parentTaskId?: string | null;
  name: string;
  description?: string | null;
  deadlineAt?: Date | null;
  status?: string;
  effort?: number | null;
  order?: number;
  tagIds?: string[];
  subtasks?: TaskWithRelations[];
}): TaskWithRelations {
  taskCounter++;
  return {
    id: overrides.id ?? `demo-task-${taskCounter}`,
    userId: DEMO_USER_ID,
    projectId: overrides.projectId,
    sectionId: overrides.sectionId ?? null,
    parentTaskId: overrides.parentTaskId ?? null,
    name: overrides.name,
    description: overrides.description ?? null,
    deadlineAt: overrides.deadlineAt ?? null,
    status: overrides.status ?? "OPEN",
    effort: overrides.effort ?? null,
    order: overrides.order ?? taskCounter,
    createdAt: daysAgo(14 + taskCounter),
    updatedAt: daysAgo(taskCounter % 5),
    tags: (overrides.tagIds ?? []).map(makeTag),
    subtasks: overrides.subtasks ?? [],
    section: null,
  };
}

function makeSection(
  id: string,
  projectId: string,
  name: string,
  order: number,
  tasks: TaskWithRelations[],
): Section & { tasks: TaskWithRelations[] } {
  return {
    id,
    projectId,
    name,
    order,
    createdAt: daysAgo(21),
    updatedAt: daysAgo(3),
    tasks,
  };
}

// ---------------------------------------------------------------------------
// Project 1: "Website Redesign" (3 sections, 14 tasks)
// ---------------------------------------------------------------------------
const proj1Id = "demo-proj-1";

const proj1DesignTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-1",
    name: "Create wireframes for homepage",
    description:
      "Low-fidelity wireframes showing hero section, features grid, and testimonials layout.",
    effort: 5,
    tagIds: ["demo-tag-3"],
    deadlineAt: daysFromNow(7),
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-1",
    name: "Design color palette and typography",
    effort: 3,
    tagIds: ["demo-tag-3"],
    status: "COMPLETED",
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-1",
    name: "Create mobile-responsive mockups",
    description: "Figma mockups at 375px, 768px, and 1440px breakpoints.",
    effort: 8,
    tagIds: ["demo-tag-3", "demo-tag-4"],
    deadlineAt: daysFromNow(10),
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-1",
    name: "Design icon set for features section",
    effort: 2,
    tagIds: ["demo-tag-3"],
  }),
];

const proj1DevTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-2",
    name: "Set up Next.js project with Tailwind CSS",
    effort: 2,
    tagIds: ["demo-tag-1"],
    status: "COMPLETED",
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-2",
    name: "Build hero section component",
    description: "Animated hero with gradient background and CTA buttons.",
    effort: 5,
    tagIds: ["demo-tag-1"],
    subtasks: [
      makeTask({
        projectId: proj1Id,
        sectionId: "demo-sec-2",
        parentTaskId: "parent-placeholder",
        name: "Implement gradient background animation",
        status: "COMPLETED",
      }),
      makeTask({
        projectId: proj1Id,
        sectionId: "demo-sec-2",
        parentTaskId: "parent-placeholder",
        name: "Add CTA button with hover effects",
        status: "OPEN",
      }),
      makeTask({
        projectId: proj1Id,
        sectionId: "demo-sec-2",
        parentTaskId: "parent-placeholder",
        name: "Make responsive for mobile",
        status: "OPEN",
      }),
    ],
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-2",
    name: "Implement contact form with validation",
    effort: 3,
    tagIds: ["demo-tag-1", "demo-tag-2"],
    deadlineAt: daysAgo(2), // overdue
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-2",
    name: "Integrate analytics tracking",
    effort: 1,
    tagIds: ["demo-tag-2"],
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-2",
    name: "Set up CI/CD pipeline",
    effort: 13,
    tagIds: ["demo-tag-2", "demo-tag-4"],
    deadlineAt: daysFromNow(14),
  }),
];

const proj1QaTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-3",
    name: "Cross-browser testing (Chrome, Firefox, Safari)",
    effort: 5,
    tagIds: ["demo-tag-8"],
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-3",
    name: "Lighthouse performance audit",
    effort: 3,
    tagIds: ["demo-tag-8"],
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-3",
    name: "Fix accessibility issues from audit",
    effort: 8,
    tagIds: ["demo-tag-5", "demo-tag-8"],
  }),
  makeTask({
    projectId: proj1Id,
    sectionId: "demo-sec-3",
    name: "Write end-to-end test suite",
    effort: 5,
    tagIds: ["demo-tag-8"],
  }),
];

const proj1Sections = [
  makeSection("demo-sec-1", proj1Id, "Design", 1, proj1DesignTasks),
  makeSection("demo-sec-2", proj1Id, "Development", 2, proj1DevTasks),
  makeSection("demo-sec-3", proj1Id, "QA", 3, proj1QaTasks),
];

const project1: ProjectWithSections = {
  id: proj1Id,
  workspaceId: "demo-ws-1",
  name: "Website Redesign",
  viewMode: "list",
  createdAt: daysAgo(28),
  updatedAt: daysAgo(1),
  sections: proj1Sections,
  tasks: [], // all tasks are in sections
};

// ---------------------------------------------------------------------------
// Project 2: "Marketing Campaign" (2 sections, 10 tasks)
// ---------------------------------------------------------------------------
const proj2Id = "demo-proj-2";

const proj2ContentTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-4",
    name: "Write blog post: 'Why We Rebuilt Our Product'",
    description:
      "Long-form blog post targeting developers. Include code examples.",
    effort: 5,
    tagIds: ["demo-tag-6"],
    status: "COMPLETED",
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-4",
    name: "Create social media graphics",
    effort: 3,
    tagIds: ["demo-tag-3"],
    status: "COMPLETED",
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-4",
    name: "Draft email announcement for subscribers",
    effort: 2,
    tagIds: ["demo-tag-6"],
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-4",
    name: "Record product demo video",
    effort: 8,
    tagIds: ["demo-tag-6", "demo-tag-4"],
    deadlineAt: daysFromNow(5),
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-4",
    name: "Write press release",
    tagIds: ["demo-tag-6"],
    // no effort -- null
  }),
];

const proj2DistributionTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-5",
    name: "Set up email drip campaign",
    effort: 3,
    tagIds: ["demo-tag-2"],
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-5",
    name: "Submit to Product Hunt",
    effort: 2,
    tagIds: [],
    deadlineAt: daysFromNow(12),
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-5",
    name: "Post on Hacker News",
    tagIds: [],
    // no effort
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-5",
    name: "Reach out to tech journalists",
    effort: 5,
    tagIds: [],
    status: "COMPLETED",
  }),
  makeTask({
    projectId: proj2Id,
    sectionId: "demo-sec-5",
    name: "Schedule Twitter/X thread",
    effort: 1,
    tagIds: [],
  }),
];

const proj2Sections = [
  makeSection("demo-sec-4", proj2Id, "Content", 1, proj2ContentTasks),
  makeSection("demo-sec-5", proj2Id, "Distribution", 2, proj2DistributionTasks),
];

const project2: ProjectWithSections = {
  id: proj2Id,
  workspaceId: "demo-ws-1",
  name: "Marketing Campaign",
  viewMode: "list",
  createdAt: daysAgo(21),
  updatedAt: daysAgo(2),
  sections: proj2Sections,
  tasks: [],
};

// ---------------------------------------------------------------------------
// Project 3: "Launch Checklist" (NO sections, flat list, 7 tasks)
// ---------------------------------------------------------------------------
const proj3Id = "demo-proj-3";

const proj3Tasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj3Id,
    name: "Verify SSL certificate installed",
    effort: 1,
    tagIds: ["demo-tag-2"],
    status: "COMPLETED",
  }),
  makeTask({
    projectId: proj3Id,
    name: "Run final load test",
    effort: 5,
    tagIds: ["demo-tag-8", "demo-tag-4"],
    deadlineAt: daysFromNow(3),
  }),
  makeTask({
    projectId: proj3Id,
    name: "Configure DNS records for new domain",
    effort: 2,
    tagIds: ["demo-tag-2"],
    deadlineAt: daysFromNow(1),
  }),
  makeTask({
    projectId: proj3Id,
    name: "Prepare rollback plan",
    description:
      "Document step-by-step rollback procedure in case of critical issues post-launch.",
    effort: 3,
    tagIds: ["demo-tag-6"],
    deadlineAt: daysAgo(1), // overdue
  }),
  makeTask({
    projectId: proj3Id,
    name: "Notify stakeholders of launch date",
    effort: 1,
    tagIds: [],
  }),
  makeTask({
    projectId: proj3Id,
    name: "Set up monitoring and alerting",
    effort: 8,
    tagIds: ["demo-tag-2"],
  }),
  makeTask({
    projectId: proj3Id,
    name: "Draft post-launch retrospective agenda",
    tagIds: ["demo-tag-6"],
    // no effort
  }),
];

const project3: ProjectWithSections = {
  id: proj3Id,
  workspaceId: "demo-ws-1",
  name: "Launch Checklist",
  viewMode: "list",
  createdAt: daysAgo(14),
  updatedAt: daysAgo(1),
  sections: [],
  tasks: proj3Tasks,
};

// ---------------------------------------------------------------------------
// Project 4: "Learning Goals" (2 sections, 9 tasks)
// ---------------------------------------------------------------------------
const proj4Id = "demo-proj-4";

const proj4ReadingTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-6",
    name: "Read 'Clean Code' by Robert Martin",
    effort: 5,
    tagIds: [],
    subtasks: [
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-6",
        parentTaskId: "parent-placeholder",
        name: "Chapters 1-5: Clean Code Fundamentals",
        status: "COMPLETED",
      }),
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-6",
        parentTaskId: "parent-placeholder",
        name: "Chapters 6-10: Objects and Data Structures",
        status: "COMPLETED",
      }),
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-6",
        parentTaskId: "parent-placeholder",
        name: "Chapters 11-15: Systems and Emergence",
        status: "OPEN",
      }),
    ],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-6",
    name: "Read 'Designing Data-Intensive Applications'",
    effort: 8,
    tagIds: ["demo-tag-7"],
    subtasks: [
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-6",
        parentTaskId: "parent-placeholder",
        name: "Part I: Foundations of Data Systems",
        status: "COMPLETED",
      }),
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-6",
        parentTaskId: "parent-placeholder",
        name: "Part II: Distributed Data",
        status: "OPEN",
      }),
    ],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-6",
    name: "Read 'The Pragmatic Programmer'",
    effort: 3,
    tagIds: [],
  }),
];

const proj4CourseTasks: TaskWithRelations[] = [
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-7",
    name: "Complete Rust Fundamentals course",
    effort: 13,
    tagIds: ["demo-tag-7"],
    subtasks: [
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-7",
        parentTaskId: "parent-placeholder",
        name: "Module 1: Ownership and Borrowing",
        status: "COMPLETED",
      }),
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-7",
        parentTaskId: "parent-placeholder",
        name: "Module 2: Structs and Enums",
        status: "OPEN",
      }),
      makeTask({
        projectId: proj4Id,
        sectionId: "demo-sec-7",
        parentTaskId: "parent-placeholder",
        name: "Module 3: Error Handling",
        status: "OPEN",
      }),
    ],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-7",
    name: "Watch 'Advanced TypeScript Patterns' series",
    effort: 2,
    tagIds: ["demo-tag-1"],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-7",
    name: "Complete PostgreSQL performance tuning workshop",
    effort: 5,
    tagIds: ["demo-tag-2", "demo-tag-7"],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-7",
    name: "Practice LeetCode medium problems (20 problems)",
    effort: 8,
    tagIds: [],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-7",
    name: "Study system design interview patterns",
    effort: 5,
    tagIds: ["demo-tag-7"],
  }),
  makeTask({
    projectId: proj4Id,
    sectionId: "demo-sec-7",
    name: "Build a side project with Go",
    effort: 13,
    tagIds: ["demo-tag-7"],
  }),
];

const proj4Sections = [
  makeSection("demo-sec-6", proj4Id, "Reading", 1, proj4ReadingTasks),
  makeSection("demo-sec-7", proj4Id, "Courses", 2, proj4CourseTasks),
];

const project4: ProjectWithSections = {
  id: proj4Id,
  workspaceId: "demo-ws-2",
  name: "Learning Goals",
  viewMode: "list",
  createdAt: daysAgo(30),
  updatedAt: daysAgo(2),
  sections: proj4Sections,
  tasks: [],
};

// ---------------------------------------------------------------------------
// Sidebar workspaces
// ---------------------------------------------------------------------------
function countOpenTasks(project: ProjectWithSections): number {
  const unsectioned = project.tasks.filter((t) => t.status === "OPEN").length;
  const sectioned = project.sections.reduce(
    (sum, s) => sum + s.tasks.filter((t) => t.status === "OPEN").length,
    0,
  );
  return unsectioned + sectioned;
}

export const DEMO_WORKSPACES: SidebarWorkspace[] = [
  {
    id: "demo-ws-1",
    name: "Product Launch",
    projects: [
      {
        id: proj1Id,
        name: project1.name,
        openTaskCount: countOpenTasks(project1),
      },
      {
        id: proj2Id,
        name: project2.name,
        openTaskCount: countOpenTasks(project2),
      },
      {
        id: proj3Id,
        name: project3.name,
        openTaskCount: countOpenTasks(project3),
      },
    ],
  },
  {
    id: "demo-ws-2",
    name: "Personal",
    projects: [
      {
        id: proj4Id,
        name: project4.name,
        openTaskCount: countOpenTasks(project4),
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Projects map
// ---------------------------------------------------------------------------
export const DEMO_PROJECTS: Map<string, ProjectWithSections> = new Map([
  [proj1Id, project1],
  [proj2Id, project2],
  [proj3Id, project3],
  [proj4Id, project4],
]);
