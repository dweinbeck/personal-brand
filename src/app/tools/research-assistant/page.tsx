import { ResearchAssistantPage } from "@/components/tools/research-assistant/ResearchAssistantPage";

export const metadata = {
  title: "Research Assistant | Daniel Weinbeck",
  description:
    "Compare responses from two AI models side-by-side in real time.",
};

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id } = await searchParams;
  return <ResearchAssistantPage initialConversationId={id} />;
}
