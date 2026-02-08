import type { ReactNode } from "react";
import { AdminGuard } from "@/components/admin/AdminGuard";

export default function ControlCenterLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <AdminGuard>{children}</AdminGuard>;
}
