type Message = {
  role: string;
  content: string;
};

export function buildConversationSummary(messages: Message[]): string {
  const lines = messages
    .map(
      (m) =>
        `${m.role === "user" ? "Visitor" : "Assistant"}: ${m.content.slice(0, 200)}`,
    )
    .join("\n\n");

  return `Conversation Summary from AI Assistant:\n\n${lines}`;
}

export function buildMailtoLink(
  messages: Message[],
  email = "daniel.weinbeck@gmail.com",
): string {
  const summary = buildConversationSummary(messages);
  const subject = encodeURIComponent("Following up from AI Assistant chat");
  const body = encodeURIComponent(
    `Hi Dan,\n\nI was chatting with your AI assistant and wanted to follow up directly.\n\n---\n${summary}\n---\n\n[Your message here]`,
  );

  return `mailto:${email}?subject=${subject}&body=${body}`;
}
