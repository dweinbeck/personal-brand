import { db } from "@/lib/firebase";

export type PromptVersion = {
  id?: string;
  version: number;
  systemPrompt: string;
  knowledgeSnapshot: string;
  createdAt: string;
  isActive: boolean;
};

export async function savePromptVersion(
  systemPrompt: string,
  knowledgeSnapshot: string,
): Promise<void> {
  if (!db) return;

  try {
    // Get the latest version number
    const latest = await db
      .collection("assistant_prompt_versions")
      .orderBy("version", "desc")
      .limit(1)
      .get();

    const nextVersion = latest.empty
      ? 1
      : (latest.docs[0].data().version as number) + 1;

    // Deactivate all existing versions
    const active = await db
      .collection("assistant_prompt_versions")
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    for (const doc of active.docs) {
      batch.update(doc.ref, { isActive: false });
    }

    // Create new version
    const newRef = db.collection("assistant_prompt_versions").doc();
    batch.set(newRef, {
      version: nextVersion,
      systemPrompt,
      knowledgeSnapshot,
      createdAt: new Date().toISOString(),
      isActive: true,
    });

    await batch.commit();
  } catch (error) {
    console.error("Failed to save prompt version:", error);
  }
}

export async function getPromptVersions(): Promise<PromptVersion[]> {
  if (!db) return [];

  try {
    const snap = await db
      .collection("assistant_prompt_versions")
      .orderBy("version", "desc")
      .limit(20)
      .get();

    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PromptVersion[];
  } catch (error) {
    console.error("Failed to get prompt versions:", error);
    return [];
  }
}

export async function rollbackToVersion(versionId: string): Promise<void> {
  if (!db) return;

  try {
    // Deactivate all
    const active = await db
      .collection("assistant_prompt_versions")
      .where("isActive", "==", true)
      .get();

    const batch = db.batch();
    for (const doc of active.docs) {
      batch.update(doc.ref, { isActive: false });
    }

    // Activate target
    batch.update(db.collection("assistant_prompt_versions").doc(versionId), {
      isActive: true,
    });

    await batch.commit();
  } catch (error) {
    console.error("Failed to rollback version:", error);
  }
}
