"use client";

import type { ReactNode } from "react";
import { EnvelopesNav } from "@/components/envelopes/EnvelopesNav";

export default function EnvelopesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EnvelopesNav />
      {children}
    </>
  );
}
