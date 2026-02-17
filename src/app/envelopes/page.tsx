"use client";

import { EnvelopesHomePage } from "@/components/envelopes/EnvelopesHomePage";
import { EnvelopesLandingPage } from "@/components/envelopes/EnvelopesLandingPage";
import { useAuth } from "@/context/AuthContext";

export default function EnvelopesPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-text-tertiary text-sm">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <EnvelopesLandingPage />;
  }

  return <EnvelopesHomePage />;
}
