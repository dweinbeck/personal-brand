import { upsertFact, deleteFact } from "@/lib/assistant/facts-store";
import { z } from "zod";

const upsertSchema = z.object({
  category: z.enum([
    "canon",
    "projects",
    "faq",
    "services",
    "contact",
    "writing",
  ]),
  key: z.string().min(1).max(200),
  value: z.string().min(1).max(5000),
});

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = upsertSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: "Invalid data." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await upsertFact(parsed.data);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Failed to save fact." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id parameter." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await deleteFact(id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: "Failed to delete fact." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
