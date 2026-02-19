import { prisma } from "@/lib/prisma";
import type {
  CreateSectionInput,
  ReorderSectionInput,
  UpdateSectionInput,
} from "@/lib/schemas/tasks/section";

async function verifyProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { workspace: { select: { userId: true } } },
  });
  if (!project || project.workspace.userId !== userId) {
    throw new Error("Not found");
  }
  return project;
}

async function verifySectionOwnership(sectionId: string, userId: string) {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      project: { include: { workspace: { select: { userId: true } } } },
    },
  });
  if (!section || section.project.workspace.userId !== userId) {
    throw new Error("Not found");
  }
  return section;
}

export async function createSection(userId: string, input: CreateSectionInput) {
  await verifyProjectOwnership(input.projectId, userId);

  const lastSection = await prisma.section.findFirst({
    where: { projectId: input.projectId },
    orderBy: { order: "desc" },
  });
  const order = lastSection ? lastSection.order + 1 : 0;

  return prisma.section.create({
    data: {
      projectId: input.projectId,
      name: input.name,
      order,
    },
  });
}

export async function updateSection(userId: string, input: UpdateSectionInput) {
  await verifySectionOwnership(input.id, userId);

  return prisma.section.update({
    where: { id: input.id },
    data: { name: input.name },
  });
}

export async function deleteSection(userId: string, id: string) {
  await verifySectionOwnership(id, userId);

  return prisma.section.delete({
    where: { id },
  });
}

export async function reorderSection(
  userId: string,
  input: ReorderSectionInput,
) {
  await verifySectionOwnership(input.id, userId);

  return prisma.section.update({
    where: { id: input.id },
    data: { order: input.order },
  });
}
