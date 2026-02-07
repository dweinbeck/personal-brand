"use client";

import { useState, type ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface LearningPathTabsProps {
  tabs: Tab[];
  defaultTab?: string;
}

export function LearningPathTabs({ tabs, defaultTab }: LearningPathTabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const activeContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className="mt-8">
      {/* Tab buttons */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-4 py-3 text-sm font-medium transition-colors duration-200
              border-b-2 -mb-px
              ${
                activeTab === tab.id
                  ? "border-gold text-gold"
                  : "border-transparent text-text-secondary hover:text-text-primary hover:border-border"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-6">{activeContent}</div>
    </div>
  );
}
