"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const ADMIN_EMAIL = "daniel.weinbeck@gmail.com";

export function AdminGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.email !== ADMIN_EMAIL)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    );
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return null;
  }

  return <>{children}</>;
}
