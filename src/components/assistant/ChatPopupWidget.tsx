"use client";

import { useChatWidget } from "@/context/ChatWidgetContext";
import { ChatInterface } from "./ChatInterface";

export function ChatPopupWidget() {
  const { isOpen, close } = useChatWidget();

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 z-[60] w-full h-[calc(100dvh-5rem)] sm:bottom-4 sm:right-4 sm:w-[400px] sm:h-[600px] sm:rounded-2xl rounded-t-2xl border border-border bg-background shadow-2xl overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surface/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-xs font-bold flex-shrink-0">
            DW
          </div>
          <h2 className="text-sm font-semibold text-text-primary">
            Dan&rsquo;s AI Assistant
          </h2>
        </div>
        <button
          type="button"
          onClick={close}
          className="h-8 w-8 rounded-full hover:bg-gold-light transition-colors flex items-center justify-center text-text-secondary hover:text-text-primary"
          aria-label="Close chat"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Chat interface */}
      <ChatInterface mode="popup" />
    </div>
  );
}
