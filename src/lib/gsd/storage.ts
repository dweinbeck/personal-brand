import { storage } from "@/lib/firebase";

/**
 * Upload a screenshot buffer to Cloud Storage and return the gs:// path.
 * Throws if Cloud Storage is not configured (FIREBASE_STORAGE_BUCKET unset).
 */
export async function uploadScreenshot(
  captureId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!storage) {
    throw new Error(
      "Cloud Storage not configured. Set FIREBASE_STORAGE_BUCKET.",
    );
  }

  const extension = contentType.includes("png")
    ? "png"
    : contentType.includes("heic")
      ? "heic"
      : "jpg";

  const filePath = `gsd-captures/${captureId}/screenshot.${extension}`;
  const file = storage.file(filePath);

  await file.save(buffer, { metadata: { contentType } });

  return `gs://${storage.name}/${filePath}`;
}
