import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";


const DISTILLATION_PROMPT = `You are a concept distillation engine. Your task is lossless semantic compression —
extract every structurally complete concept from this consulting conversation, collapse redundancy,
and produce the irreducible conceptual content. Nothing lost, nothing repeated.

METHODOLOGY:
1. RELATIONAL EVENT IDENTIFICATION: For each exchange, identify the structural claims
   being made. A claim has a subject, a typed relationship, and a target. Track the
   connector type: additive (and, also), contrastive (but, however), compositional (of,
   within), mediational (through, via), conditional (if, unless), causal (because,
   therefore).

2. CONCEPT SIGNATURE EXTRACTION: Group related claims into concept signatures. Merge
   semantically equivalent claims despite different vocabulary. "We need a contact form"
   and "users should be able to reach out" are the same structural claim.

3. EXCEPTION AND BOUNDARY INTEGRATION: For each concept, integrate its exceptions and
   boundaries into a single precisely-bounded statement. Not "we need SEO" + "except for
   the blog" separately — but "SEO is required across all pages; blog content is excluded
   from initial SEO scope."

4. INTER-CONCEPT MAPPING: Identify relationships between concepts:
   - depends_on: concept A requires concept B
   - extends: concept A builds on concept B
   - constrains: concept A limits concept B
   - contrasts: concept A opposes concept B

OUTPUT FORMAT:
## Session Distillation

**Compression**: [X concepts from Y exchanges, Z% reduction]

### Decisions
[Each decision as a precisely-bounded concept statement with exceptions integrated]

### Commitments & Action Items
[Each commitment with owner, scope, and conditions]

### Findings Recorded
[Reference any research findings saved during the session, with their concept signatures]

### Recommendations Given
[Each recommendation as a concept with its rationale relationship]

### Open Questions
[Unresolved items with their dependency relationships to other concepts]

### Concept Dependencies
[Key dependency chains: which decisions depend on which findings, which actions depend
on which decisions]

Omit any section that has no content. Do not pad or fill with generic statements.`;

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await request.json();

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing sessionId" },
      { status: 400 }
    );
  }

  // Verify session exists
  const { data: session, error: sessionError } = await supabase
    .from("consulting_sessions")
    .select("id, client_id, session_type, status")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get ALL conversation messages directly (not via server action)
  const { data: allMessages, error: msgError } = await supabase
    .from("consulting_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at");

  if (msgError) {
    return NextResponse.json({ error: `Failed to fetch messages: ${msgError.message}` }, { status: 500 });
  }

  const conversationMessages = (allMessages || []).filter((m: { role: string }) => m.role !== "system");

  console.log(`[DISTILL] Session ${sessionId}: ${allMessages?.length} total messages, ${conversationMessages.length} conversation messages`);

  if (conversationMessages.length === 0) {
    return NextResponse.json({
      distillation: "No conversation to distill.",
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0, cost_usd: 0 },
    });
  }

  if (conversationMessages.length < 2) {
    return NextResponse.json({
      distillation: "Not enough conversation to distill — need at least one full exchange.",
      usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0, cost_usd: 0 },
    });
  }

  // Format as transcript
  const transcript = conversationMessages
    .map((m: { role: string; content: string }) => `[${m.role.toUpperCase()}]: ${m.content}`)
    .join("\n\n");

  console.log(`[DISTILL] Transcript length: ${transcript.length} chars, ${conversationMessages.length} messages`);

  const anthropicKey = process.env.ANTHROPIC_API_KEY || "";

  if (!anthropicKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    // Single Claude call with distillation prompt — no tool use needed
    let response: Response | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let data: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 4096,
          system: DISTILLATION_PROMPT,
          messages: [
            {
              role: "user",
              content: `Distill this consulting conversation:\n\n${transcript}`,
            },
          ],
        }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("retry-after");
        const waitMs = retryAfter
          ? parseInt(retryAfter) * 1000
          : (attempt + 1) * 15000;
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic API error: ${response.status} ${err}`);
      }

      data = await response.json();
      break;
    }

    if (!data) {
      throw new Error("Rate limited after 3 retries. Try again in a minute.");
    }

    const distillation =
      data.content
        ?.filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n") || "Distillation produced no output.";

    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;
    const inputCost = (inputTokens / 1_000_000) * 3;
    const outputCost = (outputTokens / 1_000_000) * 15;
    const totalCost = inputCost + outputCost;

    // Save usage to database
    try {
      const { createClient } = require("@supabase/supabase-js");
      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await serviceClient.from("api_usage").insert({
        session_id: sessionId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        cost_usd: Math.round(totalCost * 1000000) / 1000000,
        model: "claude-sonnet-4-20250514",
        call_type: "distill",
      });
    } catch {
      // Don't fail the request if usage tracking fails
    }

    return NextResponse.json({
      distillation,
      usage: {
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        total_tokens: inputTokens + outputTokens,
        cost_usd: Math.round(totalCost * 10000) / 10000,
      },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Distillation failed";
    console.error("[DISTILL] Error:", errMsg, e);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
