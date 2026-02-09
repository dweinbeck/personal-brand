import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { ControlCenterNav } from "@/components/admin/ControlCenterNav";

export default function ControlCenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <AdminGuard>
      <ControlCenterNav />
      {children}
    </AdminGuard>
  );
}
