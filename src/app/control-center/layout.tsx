import { AdminGuard } from "@/components/admin/AdminGuard";
import type { ReactNode } from "react";

export default function ControlCenterLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
