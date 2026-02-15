"use client";

import type { ReactNode } from "react";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { EnvelopesNav } from "@/components/envelopes/EnvelopesNav";

export default function EnvelopesLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <EnvelopesNav />
      {children}
    </AuthGuard>
  );
}
