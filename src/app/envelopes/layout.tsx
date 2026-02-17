import type { Metadata } from "next";
import type { ReactNode } from "react";
import { EnvelopesNav } from "@/components/envelopes/EnvelopesNav";

export const metadata: Metadata = {
  title: "Envelopes | Envelope Budgeting",
};

export default function EnvelopesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EnvelopesNav />
      {children}
    </>
  );
}
