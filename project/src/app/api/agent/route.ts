import { NextResponse } from "next/server";
import { runAgent, hasApiKey, type ChatMessage } from "@/lib/agent/runAgent";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  // No key configured -> a clean, instructive response (not an error).
  if (!hasApiKey()) {
    return NextResponse.json({
      needsKey: true,
      reply:
        "The assistant needs an API key to run. Add OPENAI_API_KEY to .env.local and restart the dev server.",
      trace: [],
      widgets: [],
      followups: [],
    });
  }

  const body = (await req.json().catch(() => null)) as
    | { messages?: ChatMessage[] }
    | null;
  const messages = body?.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  try {
    const result = await runAgent(messages);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({
      reply: "Sorry - something went wrong reaching the model. Check the server logs.",
      error: e instanceof Error ? e.message : "unknown",
      trace: [],
      widgets: [],
      followups: [],
    });
  }
}
