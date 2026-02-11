import { AssetsPage } from "@/components/tools/brand-scraper/AssetsPage";

export const metadata = {
  title: "Brand Assets | Daniel Weinbeck",
  description: "View and download extracted brand assets.",
};

export default async function Page({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  return <AssetsPage jobId={jobId} />;
}
