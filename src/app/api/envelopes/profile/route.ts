import { FieldValue } from "firebase-admin/firestore";
import { unauthorizedResponse, verifyUser } from "@/lib/auth/user";
import { envelopeProfilesCol } from "@/lib/envelopes/firestore";
import { envelopeProfileSchema } from "@/lib/envelopes/types";

export async function GET(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const doc = await envelopeProfilesCol().doc(auth.uid).get();

    if (!doc.exists) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const data = doc.data();
    return Response.json({
      averageWeeklyIncomeCents: data?.averageWeeklyIncomeCents,
      averageWeeklyBillsCents: data?.averageWeeklyBillsCents,
      targetWeeklySavingsCents: data?.targetWeeklySavingsCents,
    });
  } catch (error) {
    console.error(
      "GET /api/envelopes/profile error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json({ error: "Failed to load profile." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = await verifyUser(request);
  if (!auth.authorized) return unauthorizedResponse(auth);

  try {
    const body = await request.json();
    const parsed = envelopeProfileSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input.", details: parsed.error.issues },
        { status: 400 },
      );
    }

    const docRef = envelopeProfilesCol().doc(auth.uid);
    const existing = await docRef.get();

    if (existing.exists) {
      await docRef.update({
        ...parsed.data,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      await docRef.set({
        uid: auth.uid,
        ...parsed.data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return Response.json(parsed.data);
  } catch (error) {
    console.error(
      "PUT /api/envelopes/profile error:",
      error instanceof Error ? error.message : "Unknown",
    );
    return Response.json({ error: "Failed to save profile." }, { status: 500 });
  }
}
