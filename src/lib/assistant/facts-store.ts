import { db } from "@/lib/firebase";

export type FactCategory =
  | "canon"
  | "projects"
  | "faq"
  | "services"
  | "contact"
  | "writing";

export type Fact = {
  id?: string;
  category: FactCategory;
  key: string;
  value: string;
  updatedAt: string;
};

export async function getFacts(category?: FactCategory): Promise<Fact[]> {
  if (!db) return [];

  try {
    let query = db.collection("assistant_facts").orderBy("category");
    if (category) {
      query = db
        .collection("assistant_facts")
        .where("category", "==", category);
    }
    const snap = await query.get();
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Fact[];
  } catch (error) {
    console.error("Failed to fetch facts:", error);
    return [];
  }
}

export async function upsertFact(fact: Omit<Fact, "id" | "updatedAt">) {
  if (!db) throw new Error("Firebase not configured");

  const existing = await db
    .collection("assistant_facts")
    .where("category", "==", fact.category)
    .where("key", "==", fact.key)
    .limit(1)
    .get();

  const data = { ...fact, updatedAt: new Date().toISOString() };

  if (existing.empty) {
    await db.collection("assistant_facts").add(data);
  } else {
    await existing.docs[0].ref.update(data);
  }
}

export async function deleteFact(factId: string) {
  if (!db) throw new Error("Firebase not configured");
  await db.collection("assistant_facts").doc(factId).delete();
}
