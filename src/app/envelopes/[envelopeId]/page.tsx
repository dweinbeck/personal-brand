"use client";

import { redirect } from "next/navigation";
import { use } from "react";
import { EnvelopeDetailPage } from "@/components/envelopes/EnvelopeDetailPage";
import { useAuth } from "@/context/AuthContext";

export default function Page({
  params,
}: {
  params: Promise<{ envelopeId: string }>;
}) {
  const { envelopeId } = use(params);
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    redirect("/envelopes");
  }

  return <EnvelopeDetailPage envelopeId={envelopeId} />;
}
