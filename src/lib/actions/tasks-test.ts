"use server";

import { prisma } from "@/lib/prisma";

/**
 * Test action to verify Prisma can connect to the PostgreSQL database
 * and read existing Tasks data. This is a temporary verification action
 * that will be removed once Phase 44 migrates the real server actions.
 */
export async function getTestWorkspaces() {
  try {
    // Count total records to verify connectivity
    const [workspaceCount, projectCount, taskCount] = await Promise.all([
      prisma.workspace.count(),
      prisma.project.count(),
      prisma.task.count(),
    ]);

    // Fetch first workspace with its projects to verify relations work
    const firstWorkspace = await prisma.workspace.findFirst({
      include: {
        projects: {
          select: {
            id: true,
            name: true,
            _count: {
              select: { tasks: true },
            },
          },
          take: 3,
        },
      },
    });

    return {
      success: true,
      counts: {
        workspaces: workspaceCount,
        projects: projectCount,
        tasks: taskCount,
      },
      sampleWorkspace: firstWorkspace
        ? {
            id: firstWorkspace.id,
            name: firstWorkspace.name,
            projectCount: firstWorkspace.projects.length,
            projects: firstWorkspace.projects.map((p) => ({
              id: p.id,
              name: p.name,
              taskCount: p._count.tasks,
            })),
          }
        : null,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
