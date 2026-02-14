import { describe, expect, it } from "vitest";
import { conversationToMarkdown } from "@/components/tools/research-assistant/ExportButton";

describe("conversationToMarkdown", () => {
  it("generates correct heading structure for a single turn", () => {
    const md = conversationToMarkdown({
      title: "Test Conversation",
      tier: "standard",
      turns: [
        {
          prompt: "What is the meaning of life?",
          geminiResponse: "Gemini says 42.",
          openaiResponse: "OpenAI says it depends.",
        },
      ],
    });

    expect(md).toContain("# Test Conversation");
    expect(md).toContain("**Tier:** standard");
    expect(md).toContain("**Exported:**");
    expect(md).toContain("## Turn 1");
    expect(md).toContain("### Prompt");
    expect(md).toContain("What is the meaning of life?");
    expect(md).toContain("### Gemini Response");
    expect(md).toContain("Gemini says 42.");
    expect(md).toContain("### OpenAI Response");
    expect(md).toContain("OpenAI says it depends.");
  });

  it("generates multiple turns with horizontal rules", () => {
    const md = conversationToMarkdown({
      title: "Multi-turn",
      tier: "expert",
      turns: [
        {
          prompt: "Turn 1 prompt",
          geminiResponse: "Turn 1 gemini",
          openaiResponse: "Turn 1 openai",
        },
        {
          prompt: "Turn 2 prompt",
          geminiResponse: "Turn 2 gemini",
          openaiResponse: "Turn 2 openai",
        },
        {
          prompt: "Turn 3 prompt",
          geminiResponse: "Turn 3 gemini",
          openaiResponse: "Turn 3 openai",
        },
      ],
    });

    expect(md).toContain("## Turn 1");
    expect(md).toContain("## Turn 2");
    expect(md).toContain("## Turn 3");
    expect(md).toContain("---");
    expect(md).toContain("**Tier:** expert");
  });

  it("includes reconsider sections when present", () => {
    const md = conversationToMarkdown({
      title: "Reconsider Test",
      tier: "standard",
      turns: [
        {
          prompt: "Test prompt",
          geminiResponse: "Initial gemini",
          openaiResponse: "Initial openai",
          geminiReconsider: "Revised gemini",
          openaiReconsider: "Revised openai",
        },
      ],
    });

    expect(md).toContain("#### Gemini (Reconsidered)");
    expect(md).toContain("Revised gemini");
    expect(md).toContain("#### OpenAI (Reconsidered)");
    expect(md).toContain("Revised openai");
  });

  it("omits reconsider sections when not present", () => {
    const md = conversationToMarkdown({
      title: "No Reconsider",
      tier: "standard",
      turns: [
        {
          prompt: "Test prompt",
          geminiResponse: "Gemini response",
          openaiResponse: "OpenAI response",
        },
      ],
    });

    expect(md).not.toContain("Reconsidered");
  });

  it("handles empty conversation with no turns", () => {
    const md = conversationToMarkdown({
      title: "Empty Conversation",
      tier: "standard",
      turns: [],
    });

    expect(md).toContain("# Empty Conversation");
    expect(md).toContain("**Tier:** standard");
    expect(md).not.toContain("## Turn");
  });

  it("preserves special markdown characters in content", () => {
    const md = conversationToMarkdown({
      title: "Special # Characters",
      tier: "standard",
      turns: [
        {
          prompt: "# Heading in prompt\n- list item\n**bold**",
          geminiResponse: "## Sub-heading\n*italic*",
          openaiResponse: "```code block```",
        },
      ],
    });

    expect(md).toContain("# Heading in prompt");
    expect(md).toContain("- list item");
    expect(md).toContain("**bold**");
    expect(md).toContain("## Sub-heading");
    expect(md).toContain("```code block```");
  });
});
