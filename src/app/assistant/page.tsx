import type { Metadata } from "next";
import { ChatInterface } from "@/components/assistant/ChatInterface";

export const metadata: Metadata = {
  title: "AI Assistant",
  description:
    "An AI-powered assistant for exploring Dan's work, projects, skills, and experience.",
};

export default function AssistantPage() {
  return <ChatInterface />;
}
