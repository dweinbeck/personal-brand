"use client";

import { type ReactNode, useState } from "react";

export function ArticleTabs({
  manualContent,
  fastContent,
}: {
  manualContent: ReactNode;
  fastContent: ReactNode;
}) {
  const [activeTab, setActiveTab] = useState<"manual" | "fast">("manual");

  return (
    <>
      <nav className="flex items-center gap-3 text-sm mb-10">
        <button
          type="button"
          onClick={() => setActiveTab("manual")}
          className={
            activeTab === "manual"
              ? "font-semibold text-text-primary cursor-default"
              : "text-text-tertiary hover:text-gold transition-colors cursor-pointer"
          }
        >
          Manual Configuration + Fundamentals
        </button>
        <span className="text-border select-none">|</span>
        <button
          type="button"
          onClick={() => setActiveTab("fast")}
          className={
            activeTab === "fast"
              ? "font-semibold text-text-primary cursor-default"
              : "text-text-tertiary hover:text-gold transition-colors cursor-pointer"
          }
        >
          Just give me the building block
        </button>
      </nav>
      <div className={activeTab === "manual" ? "" : "hidden"}>
        {manualContent}
      </div>
      <div className={activeTab === "fast" ? "" : "hidden"}>{fastContent}</div>
    </>
  );
}
