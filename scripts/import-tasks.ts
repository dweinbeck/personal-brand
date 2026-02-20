/**
 * Import tasks from a structured JSON plan into the Tasks app.
 *
 * Usage: npx tsx scripts/import-tasks.ts <email> <json-file-path>
 * Example: npx tsx scripts/import-tasks.ts daniel.weinbeck@gmail.com .planning/focus-sprint-30d.tasks-import.json
 *
 * Requires:
 * - DATABASE_URL env var (Prisma / PostgreSQL)
 * - Firebase Admin SDK credentials (to resolve email → UID)
 */

import { config } from "dotenv";

config({ path: ".env.local" });

import "@/lib/firebase";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { getApp, getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { PrismaClient } from "@/generated/prisma/client";

const prisma = new PrismaClient();

interface ImportSubtask {
  name: string;
  description?: string;
  effort?: number;
  tags?: string[];
  researchInstruction?: string;
}

interface ImportPlanItem {
  projectName: string;
  sectionName: string;
  task: {
    name: string;
    description?: string;
    deadlineAt?: string;
    effort?: number;
    tags?: string[];
    researchInstruction?: string;
  };
  subtasks?: ImportSubtask[];
}

interface ImportJSON {
  schemaVersion: string;
  workspace: {
    name: string;
    tagsToEnsure: { name: string; color: string | null }[];
    projects: { name: string; sections: string[] }[];
  };
  planItems: ImportPlanItem[];
}

async function resolveUserId(email: string): Promise<string> {
  const apps = getApps();
  if (apps.length === 0) {
    throw new Error(
      "Firebase Admin SDK not initialized. Ensure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY are set.",
    );
  }
  const auth = getAuth(getApp());
  const user = await auth.getUserByEmail(email);
  return user.uid;
}

async function main() {
  const [, , email, jsonPath] = process.argv;
  if (!email || !jsonPath) {
    console.error(
      "Usage: npx tsx scripts/import-tasks.ts <email> <json-file-path>",
    );
    process.exit(1);
  }

  // 1. Resolve Firebase UID
  console.log(`Resolving UID for ${email}...`);
  const userId = await resolveUserId(email);
  console.log(`  UID: ${userId}`);

  // 2. Read import JSON
  const fullPath = resolve(jsonPath);
  const data: ImportJSON = JSON.parse(readFileSync(fullPath, "utf-8"));
  console.log(
    `\nImport file: ${data.workspace.name}`,
    `\n  Projects: ${data.workspace.projects.length}`,
    `\n  Tags: ${data.workspace.tagsToEnsure.length}`,
    `\n  Plan items: ${data.planItems.length}`,
  );

  // 3. Create or reuse workspace
  let workspace = await prisma.workspace.findFirst({
    where: { userId, name: data.workspace.name },
  });
  if (workspace) {
    console.log(`\nReusing existing workspace: ${workspace.id}`);
  } else {
    workspace = await prisma.workspace.create({
      data: { userId, name: data.workspace.name },
    });
    console.log(`\nCreated workspace: ${workspace.id}`);
  }

  // 4. Create or reuse tags (unique on userId+name)
  const tagMap = new Map<string, string>(); // name → id
  for (const tagDef of data.workspace.tagsToEnsure) {
    const existing = await prisma.tag.findUnique({
      where: { userId_name: { userId, name: tagDef.name } },
    });
    if (existing) {
      tagMap.set(tagDef.name, existing.id);
    } else {
      const tag = await prisma.tag.create({
        data: { userId, name: tagDef.name, color: tagDef.color },
      });
      tagMap.set(tagDef.name, tag.id);
    }
  }
  console.log(`  Tags resolved: ${tagMap.size}`);

  // 5. Create or reuse projects and sections
  const projectMap = new Map<string, string>(); // name → id
  const sectionMap = new Map<string, string>(); // "projectName::sectionName" → id

  for (const projDef of data.workspace.projects) {
    let project = await prisma.project.findFirst({
      where: {
        workspaceId: workspace.id,
        name: projDef.name,
      },
    });
    if (!project) {
      project = await prisma.project.create({
        data: {
          workspaceId: workspace.id,
          name: projDef.name,
          viewMode: "list",
        },
      });
    }
    projectMap.set(projDef.name, project.id);

    for (let i = 0; i < projDef.sections.length; i++) {
      const secName = projDef.sections[i];
      const key = `${projDef.name}::${secName}`;
      let section = await prisma.section.findFirst({
        where: { projectId: project.id, name: secName },
      });
      if (!section) {
        section = await prisma.section.create({
          data: {
            projectId: project.id,
            name: secName,
            order: i,
          },
        });
      }
      sectionMap.set(key, section.id);
    }
  }
  console.log(`  Projects resolved: ${projectMap.size}`);
  console.log(`  Sections resolved: ${sectionMap.size}`);

  // 6. Create tasks and subtasks
  let tasksCreated = 0;
  let subtasksCreated = 0;
  let skipped = 0;

  for (let i = 0; i < data.planItems.length; i++) {
    const item = data.planItems[i];
    const projectId = projectMap.get(item.projectName);
    if (!projectId) {
      console.warn(`  SKIP: No project found for "${item.projectName}"`);
      skipped++;
      continue;
    }

    const sectionKey = `${item.projectName}::${item.sectionName}`;
    const sectionId = sectionMap.get(sectionKey) ?? null;

    // Check for duplicate (same name + deadlineAt in same project/section)
    const deadlineAt = item.task.deadlineAt
      ? new Date(item.task.deadlineAt)
      : null;
    const existing = await prisma.task.findFirst({
      where: {
        userId,
        projectId,
        sectionId,
        name: item.task.name,
        parentTaskId: null,
        ...(deadlineAt ? { deadlineAt } : {}),
      },
    });
    if (existing) {
      console.log(
        `  SKIP (duplicate): "${item.task.name.substring(0, 50)}..."`,
      );
      skipped++;
      continue;
    }

    // Build description including research instruction if present
    let description = item.task.description ?? "";
    if (item.task.researchInstruction) {
      description += `\n\n---\n${item.task.researchInstruction}`;
    }

    // Create parent task
    const parentTask = await prisma.task.create({
      data: {
        userId,
        projectId,
        sectionId,
        name: item.task.name,
        description: description || null,
        deadlineAt,
        status: "OPEN",
        effort: item.task.effort ?? null,
        order: i,
      },
    });
    tasksCreated++;

    // Attach tags to parent task
    if (item.task.tags?.length) {
      const tagConnects = item.task.tags
        .filter((t) => tagMap.has(t))
        .map((t) => ({
          taskId: parentTask.id,
          tagId: tagMap.get(t) as string,
        }));
      if (tagConnects.length > 0) {
        await prisma.taskTag.createMany({ data: tagConnects });
      }
    }

    // Create subtasks
    if (item.subtasks?.length) {
      for (let j = 0; j < item.subtasks.length; j++) {
        const sub = item.subtasks[j];
        let subDesc = sub.description ?? "";
        if (sub.researchInstruction) {
          subDesc += `\n\n---\n${sub.researchInstruction}`;
        }

        const subtask = await prisma.task.create({
          data: {
            userId,
            projectId,
            sectionId,
            parentTaskId: parentTask.id,
            name: sub.name,
            description: subDesc || null,
            status: "OPEN",
            effort: sub.effort ?? null,
            order: j,
          },
        });
        subtasksCreated++;

        // Attach tags to subtask
        if (sub.tags?.length) {
          const subTagConnects = sub.tags
            .filter((t) => tagMap.has(t))
            .map((t) => ({
              taskId: subtask.id,
              tagId: tagMap.get(t) as string,
            }));
          if (subTagConnects.length > 0) {
            await prisma.taskTag.createMany({ data: subTagConnects });
          }
        }
      }
    }
  }

  // 7. Summary
  console.log(`\n${"=".repeat(50)}`);
  console.log("Import Summary");
  console.log("=".repeat(50));
  console.log(`  Workspace: ${workspace.id} ("${data.workspace.name}")`);
  for (const [name, id] of projectMap) {
    console.log(`  Project: ${id} ("${name}")`);
  }
  console.log(`  Tasks created: ${tasksCreated}`);
  console.log(`  Subtasks created: ${subtasksCreated}`);
  console.log(`  Skipped (duplicates): ${skipped}`);
  console.log("=".repeat(50));
}

main()
  .then(() => {
    prisma.$disconnect();
    process.exit(0);
  })
  .catch((err) => {
    console.error("Import failed:", err);
    prisma.$disconnect();
    process.exit(1);
  });
