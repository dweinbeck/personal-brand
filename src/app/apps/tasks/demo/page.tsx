"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useDemoContext } from "@/components/tasks/demo/DemoProvider";

export default function DemoPage() {
  const router = useRouter();
  const { workspaces } = useDemoContext();
  const firstProjectId = workspaces[0]?.projects[0]?.id;

  useEffect(() => {
    if (firstProjectId) {
      router.replace(`/apps/tasks/demo/${firstProjectId}`);
    }
  }, [firstProjectId, router]);

  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-text-tertiary text-sm">Loading demo workspace...</p>
    </div>
  );
}
