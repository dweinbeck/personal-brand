import { AdminBillingUserDetail } from "@/components/admin/billing/AdminBillingUserDetail";

export default async function Page({
  params,
}: {
  params: Promise<{ uid: string }>;
}) {
  const { uid } = await params;
  return <AdminBillingUserDetail uid={uid} />;
}
