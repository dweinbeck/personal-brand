import { CaptureDetailPage } from "@/components/admin/builder-inbox/CaptureDetailPage";

export default async function CaptureDetailRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaptureDetailPage captureId={id} />;
}
