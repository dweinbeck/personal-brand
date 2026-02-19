"use server";

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { verifyUser } from "@/lib/tasks/auth";

interface ImportTag {
  name: string;
  color: string | null;
}

interface ImportProject {
  name: string;
  sections: string[];
}

interface ImportSubtask {
  name: string;
  description: string;
  effort: number;
  tags: string[];
  researchInstruction: string;
}

interface ImportTask {
  name: string;
  description: string;
  deadlineAt: string;
  effort: number;
  tags: string[];
  researchInstruction: string;
}

interface ImportPlanItem {
  projectName: string;
  sectionName: string;
  task: ImportTask;
  subtasks: ImportSubtask[];
}

interface ImportData {
  workspace: {
    name: string;
    tagsToEnsure: ImportTag[];
    projects: ImportProject[];
  };
  planItems: ImportPlanItem[];
}

interface ImportSummary {
  workspace: { id: string; name: string; created: boolean };
  tags: { created: number; existing: number };
  projects: { created: number; existing: number };
  sections: { created: number; existing: number };
  tasks: { created: number; skipped: number };
  subtasks: { created: number; skipped: number };
}

export async function importTasksAction(
  idToken: string,
): Promise<{ success: true; summary: ImportSummary } | { error: string }> {
  const userId = await verifyUser(idToken);
  if (!userId) return { error: "Unauthorized" };

  try {
    // Read and parse the JSON import file
    const filePath = join(
      process.cwd(),
      ".planning",
      "focus-sprint-30d.tasks-import.json",
    );
    const raw = await readFile(filePath, "utf-8");
    const data: ImportData = JSON.parse(raw);

    const { workspace: wsData, planItems } = data;

    // --- Create/find workspace ---
    let workspaceCreated = false;
    let existingWorkspace = await prisma.workspace.findFirst({
      where: { userId, name: wsData.name },
    });

    if (!existingWorkspace) {
      existingWorkspace = await prisma.workspace.create({
        data: { userId, name: wsData.name },
      });
      workspaceCreated = true;
    }

    const workspaceId = existingWorkspace.id;

    // --- Create/find tags ---
    let tagsCreated = 0;
    let tagsExisting = 0;
    const tagMap: Record<string, string> = {};

    for (const tag of wsData.tagsToEnsure) {
      // Check existence first to track created vs existing
      const existing = await prisma.tag.findUnique({
        where: { userId_name: { userId, name: tag.name } },
      });

      const upserted = await prisma.tag.upsert({
        where: { userId_name: { userId, name: tag.name } },
        update: {},
        create: { userId, name: tag.name, color: tag.color },
      });

      tagMap[tag.name] = upserted.id;

      if (existing) {
        tagsExisting++;
      } else {
        tagsCreated++;
      }
    }

    // --- Create/find projects ---
    let projectsCreated = 0;
    let projectsExisting = 0;
    const projectMap: Record<string, string> = {};

    for (const proj of wsData.projects) {
      let existingProject = await prisma.project.findFirst({
        where: { workspaceId, name: proj.name },
      });

      if (!existingProject) {
        existingProject = await prisma.project.create({
          data: { workspaceId, name: proj.name },
        });
        projectsCreated++;
      } else {
        projectsExisting++;
      }

      projectMap[proj.name] = existingProject.id;
    }

    // --- Create/find sections ---
    let sectionsCreated = 0;
    let sectionsExisting = 0;
    const sectionMap: Record<string, string> = {};

    for (const proj of wsData.projects) {
      const projectId = projectMap[proj.name];

      for (let i = 0; i < proj.sections.length; i++) {
        const sectionName = proj.sections[i];
        const key = `${proj.name}::${sectionName}`;

        let existingSection = await prisma.section.findFirst({
          where: { projectId, name: sectionName },
        });

        if (!existingSection) {
          existingSection = await prisma.section.create({
            data: { projectId, name: sectionName, order: i },
          });
          sectionsCreated++;
        } else {
          sectionsExisting++;
        }

        sectionMap[key] = existingSection.id;
      }
    }

    // --- Create tasks and subtasks ---
    let tasksCreated = 0;
    let tasksSkipped = 0;
    let subtasksCreated = 0;
    let subtasksSkipped = 0;

    for (let orderIndex = 0; orderIndex < planItems.length; orderIndex++) {
      const item = planItems[orderIndex];
      const projectId = projectMap[item.projectName];

      if (!projectId) {
        continue; // Skip if project not found
      }

      const sectionKey = `${item.projectName}::${item.sectionName}`;
      const sectionId = item.sectionName ? sectionMap[sectionKey] : null;

      // Parse deadline
      const deadlineAt = item.task.deadlineAt
        ? new Date(`${item.task.deadlineAt}T00:00:00`)
        : null;

      // Duplicate check: same name + deadlineAt in same project/section for this user
      const duplicateWhere: {
        userId: string;
        projectId: string;
        name: string;
        parentTaskId: null;
        sectionId?: string | null;
        deadlineAt?: Date | null;
      } = {
        userId,
        projectId,
        name: item.task.name,
        parentTaskId: null,
      };

      if (sectionId) {
        duplicateWhere.sectionId = sectionId;
      }

      if (deadlineAt) {
        duplicateWhere.deadlineAt = deadlineAt;
      }

      const existingTask = await prisma.task.findFirst({
        where: duplicateWhere,
      });

      if (existingTask) {
        tasksSkipped++;
        // Also skip subtasks for this parent
        subtasksSkipped += item.subtasks?.length ?? 0;
        continue;
      }

      // Create parent task
      const parentTask = await prisma.task.create({
        data: {
          userId,
          projectId,
          sectionId: sectionId ?? null,
          name: item.task.name,
          description: item.task.description ?? null,
          deadlineAt,
          effort: item.task.effort ?? null,
          status: "OPEN",
          order: orderIndex,
        },
      });

      tasksCreated++;

      // Attach tags to parent task
      if (item.task.tags) {
        for (const tagName of item.task.tags) {
          const tagId = tagMap[tagName];
          if (tagId) {
            await prisma.taskTag.create({
              data: { taskId: parentTask.id, tagId },
            });
          }
        }
      }

      // Create subtasks
      if (item.subtasks) {
        for (let subIndex = 0; subIndex < item.subtasks.length; subIndex++) {
          const sub = item.subtasks[subIndex];

          // Duplicate check for subtask: same name + parentTaskId
          const existingSubtask = await prisma.task.findFirst({
            where: {
              parentTaskId: parentTask.id,
              name: sub.name,
            },
          });

          if (existingSubtask) {
            subtasksSkipped++;
            continue;
          }

          const subtask = await prisma.task.create({
            data: {
              userId,
              projectId,
              sectionId: null,
              parentTaskId: parentTask.id,
              name: sub.name,
              description: sub.description ?? null,
              deadlineAt,
              effort: sub.effort ?? null,
              status: "OPEN",
              order: subIndex,
            },
          });

          subtasksCreated++;

          // Attach tags to subtask
          if (sub.tags) {
            for (const tagName of sub.tags) {
              const tagId = tagMap[tagName];
              if (tagId) {
                await prisma.taskTag.create({
                  data: { taskId: subtask.id, tagId },
                });
              }
            }
          }
        }
      }
    }

    revalidatePath("/apps/tasks");

    return {
      success: true,
      summary: {
        workspace: {
          id: workspaceId,
          name: wsData.name,
          created: workspaceCreated,
        },
        tags: { created: tagsCreated, existing: tagsExisting },
        projects: { created: projectsCreated, existing: projectsExisting },
        sections: { created: sectionsCreated, existing: sectionsExisting },
        tasks: { created: tasksCreated, skipped: tasksSkipped },
        subtasks: { created: subtasksCreated, skipped: subtasksSkipped },
      },
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to import tasks" };
  }
}
