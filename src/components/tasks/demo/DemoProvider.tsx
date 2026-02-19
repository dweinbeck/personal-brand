"use client";

import { createContext, type ReactNode, useContext } from "react";
import {
  DEMO_PROJECTS,
  DEMO_SIDEBAR_TAGS,
  DEMO_TAGS,
  DEMO_WORKSPACES,
} from "@/data/demo-seed";
import type { ProjectWithSections, SidebarWorkspace } from "@/lib/tasks/types";

interface DemoContextValue {
  isDemoMode: true;
  workspaces: SidebarWorkspace[];
  projects: Map<string, ProjectWithSections>;
  allTags: { id: string; name: string; color: string | null; userId: string }[];
  sidebarTags: { id: string; name: string; color: string | null }[];
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const value: DemoContextValue = {
    isDemoMode: true,
    workspaces: DEMO_WORKSPACES,
    projects: DEMO_PROJECTS,
    allTags: DEMO_TAGS,
    sidebarTags: DEMO_SIDEBAR_TAGS,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemoContext(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return ctx;
}
