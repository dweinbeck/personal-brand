import { apiKeyUnauthorizedResponse, verifyApiKey } from "@/lib/auth/api-key";
import { saveCapture } from "@/lib/gsd/capture";
import { processCapture } from "@/lib/gsd/router";
import { screenshotCaptureSchema } from "@/lib/gsd/schemas";
import { uploadScreenshot } from "@/lib/gsd/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/heic",
  "image/heif",
  "image/webp",
];

export async function POST(request: Request) {
  // 1. Auth check
  const auth = verifyApiKey(request);
  if (!auth.authorized) return apiKeyUnauthorizedResponse(auth);

  // 2. Parse multipart form data
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Invalid form data." }, { status: 400 });
  }

  // 3. Extract screenshot file (case-insensitive field lookup for Shortcuts compatibility)
  const file = (formData.get("screenshot") ??
    formData.get("Screenshot")) as File | null;
  if (!file || !(file instanceof File) || file.size === 0) {
    return Response.json({ error: "No screenshot provided." }, { status: 400 });
  }

  // 4. Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return Response.json(
      { error: "File too large (10MB max)." },
      { status: 413 },
    );
  }

  // 5. Validate content type
  if (!ALLOWED_TYPES.includes(file.type)) {
    return Response.json(
      { error: "Invalid file type. Accepted: PNG, JPEG, HEIC, WebP." },
      { status: 400 },
    );
  }

  // 6. Parse optional context from form data
  const contextRaw = formData.get("context") ?? formData.get("Context");
  const contextStr = typeof contextRaw === "string" ? contextRaw : undefined;
  const metaParsed = screenshotCaptureSchema.safeParse({
    context: contextStr,
  });
  // If context validation fails, proceed without context (non-blocking)
  const context = metaParsed.success ? metaParsed.data.context : undefined;

  // 7. Upload to Cloud Storage
  const captureId = crypto.randomUUID();
  let screenshotUrl: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    screenshotUrl = await uploadScreenshot(captureId, buffer, file.type);
  } catch (err) {
    console.error("Failed to upload screenshot:", err);
    return Response.json(
      { error: "Failed to upload screenshot." },
      { status: 500 },
    );
  }

  // 8. Persist capture to Firestore
  try {
    await saveCapture({
      id: captureId,
      type: "screenshot",
      screenshotUrl,
      context,
    });
  } catch (err) {
    console.error("Failed to save capture:", err);
    return Response.json({ error: "Failed to save capture." }, { status: 500 });
  }

  // 9. Fire-and-forget async processing (LLM classification + routing)
  processCapture(captureId).catch(console.error);

  // 10. Respond immediately
  return Response.json({ status: "queued", id: captureId }, { status: 202 });
}
