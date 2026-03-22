import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { addMessage, getMessages } from "@/lib/consulting";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, message } = await request.json();

  if (!sessionId || !message) {
    return NextResponse.json({ error: "Missing sessionId or message" }, { status: 400 });
  }

  // Save user message
  await addMessage(sessionId, "user", message);

  // Get conversation history
  const messages = await getMessages(sessionId);

  const anthropicMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  const systemMessage = messages.find((m) => m.role === "system")?.content || "";

  // Call Claude API
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // No API key — return a placeholder response
    const fallback =
      "AI consulting is not configured yet. Add ANTHROPIC_API_KEY to .env.local to enable Claude-powered consulting sessions.";
    await addMessage(sessionId, "assistant", fallback);
    return NextResponse.json({ reply: fallback });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        system: systemMessage,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const reply =
      data.content?.[0]?.type === "text"
        ? data.content[0].text
        : "No response generated.";

    // Save assistant message
    await addMessage(sessionId, "assistant", reply);

    return NextResponse.json({ reply });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
