"use client";

import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useRef, useEffect, useState, useMemo } from "react";
import { z } from "zod";

type ChatMetadata = { confidence?: "low" | "medium" | "high" };
type ChatMessage_UI = UIMessage<ChatMetadata>;
import { ChatHeader } from "./ChatHeader";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { SuggestedPrompts } from "./SuggestedPrompts";
import { TypingIndicator } from "./TypingIndicator";
import { ExitRamps } from "./ExitRamps";
import { HumanHandoff } from "./HumanHandoff";
import { PrivacyDisclosure } from "./PrivacyDisclosure";

const transport = new DefaultChatTransport({
  api: "/api/assistant/chat",
});

const metadataSchema = z.object({
  confidence: z.enum(["low", "medium", "high"]).optional(),
});

export function ChatInterface() {
  const { messages, sendMessage, status, error, id } = useChat<ChatMessage_UI>({
    transport,
    messageMetadataSchema: metadataSchema,
  });

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const conversationId = useMemo(() => id, [id]);

  const isLoading = status === "streaming" || status === "submitted";

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, isLoading]);

  // Build plain messages for handoff
  const plainMessages = useMemo(
    () =>
      messages.map((m) => ({
        role: m.role,
        content:
          m.parts
            ?.filter((p) => p.type === "text")
            .map((p) => p.text)
            .join("") ?? "",
      })),
    [messages],
  );

  function handleSuggestedPrompt(prompt: string) {
    sendMessage({ text: prompt });
  }

  function handleSend() {
    if (input.trim() && !isLoading) {
      sendMessage({ text: input });
      setInput("");
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col bg-background">
      <ChatHeader />

      {/* Messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto scroll-smooth"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-center px-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  className="h-8 w-8 text-primary"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Hi! I&rsquo;m Dan&rsquo;s AI Assistant
              </h2>
              <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto">
                I can tell you about Dan&rsquo;s projects, skills, experience,
                and how to get in touch. What would you like to know?
              </p>
            </div>
            <SuggestedPrompts onSelect={handleSuggestedPrompt} />
            <div className="w-full max-w-2xl mx-auto">
              <ChatInput
                value={input}
                onChange={setInput}
                onSubmit={handleSend}
                isLoading={isLoading}
              />
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                role={message.role as "user" | "assistant"}
                parts={message.parts ?? []}
                metadata={message.metadata}
                messageId={message.id}
                conversationId={conversationId}
              />
            ))}
            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <TypingIndicator />
              )}
          </div>
        )}

        {/* Error display */}
        {error && (
          <div
            className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
          >
            {error.message.includes("429")
              ? "You've sent too many messages. Please wait a few minutes before trying again."
              : "Something went wrong. Please try again."}
          </div>
        )}
      </div>

      {/* Input and footer — only shown during conversation */}
      {messages.length > 0 && (
        <div className="border-t border-border">
          <div className="max-w-2xl mx-auto">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSend}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}
      <div className="flex items-center justify-between px-4 py-2 sm:px-6">
        <ExitRamps />
        {messages.length >= 2 && (
          <HumanHandoff messages={plainMessages} />
        )}
      </div>
      <PrivacyDisclosure />
    </div>
  );
}
