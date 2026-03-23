import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { addMessage, getMessages, getSession } from "@/lib/consulting";

// Read at request time to avoid turbopack caching stale values
function getAnthropicKey() { return process.env.ANTHROPIC_API_KEY || ""; }
function getBraveKey() { return process.env.BRAVE_SEARCH_API_KEY || ""; }

// Tool definitions for Claude
const tools = [
  {
    name: "web_search",
    description:
      "Search the internet for information. Use this to find competitor websites, industry trends, design inspiration, color palettes, and market research relevant to the consulting session.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: {
          type: "string",
          description: "The search query",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "fetch_url",
    description:
      "Fetch the text content of a web page. Use this to analyze competitor websites, review a client's existing site, or check specific URLs mentioned in conversation. Returns the main text content of the page.",
    input_schema: {
      type: "object" as const,
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "save_finding",
    description:
      "Save a research finding to the client's permanent record. Use this whenever you discover something valuable — a competitor site, design trend, brand insight, audience observation, technical requirement, risk, or opportunity. Findings persist across sessions and feed into reports. Always save findings proactively.",
    input_schema: {
      type: "object" as const,
      properties: {
        finding_type: {
          type: "string",
          enum: [
            "competitor", "industry_trend", "design_reference", "color_palette",
            "typography", "content_pattern", "technical_requirement", "audience_insight",
            "brand_direction", "feature_idea", "risk", "opportunity", "general",
          ],
          description: "Category of the finding",
        },
        title: {
          type: "string",
          description: "Short title summarizing the finding",
        },
        content: {
          type: "string",
          description: "Detailed description of the finding and why it matters",
        },
        source_url: {
          type: "string",
          description: "URL source of the finding, if applicable",
        },
        relevance: {
          type: "string",
          enum: ["high", "medium", "low"],
          description: "How relevant this finding is to the client's project",
        },
      },
      required: ["finding_type", "title", "content"],
    },
  },
  {
    name: "pcf_decompose",
    description:
      "Run a PCF (Presence-Connection-Flow) structural decomposition on a bounded scope. Use this to verify completeness of a solution, identify gaps, and ensure everything is addressed. Works at any scale: organization level, project level, feature level, or individual request. Returns a structured analysis of all presences needed, their connections, flow paths, and any gaps or disconnections found. Use this during discovery to map requirements, during scope review to verify completeness, or anytime you want to ensure nothing is missed.",
    input_schema: {
      type: "object" as const,
      properties: {
        scope_level: {
          type: "string",
          enum: ["org", "project", "feature", "request"],
          description: "Scale of the decomposition",
        },
        scope_description: {
          type: "string",
          description:
            "Description of what is being decomposed (e.g., 'Restaurant website with online ordering', 'Contact form with email notification', 'Client's full digital presence')",
        },
        known_requirements: {
          type: "string",
          description:
            "Any requirements already identified from the conversation or context",
        },
      },
      required: ["scope_level", "scope_description"],
    },
  },
  {
    name: "strategic_research",
    description:
      "Run a deep Strategic Systems Research analysis on an organization, market, or complex system. This is a comprehensive decomposition that maps macro/core/sub systems, tracks state transitions, identifies information/resource/influence flows, and cross-validates against 9 strategic drivers: Value Creation, Resource Flow, Cultural Alignment, Impact Integrity, Capability Building, Strategic Differentiation, Narrative Meaning, Structural Coherence, Decision Velocity. Use this during discovery sessions for org-level analysis, when evaluating a client's business model, or when you need to understand the full system before designing a solution. More thorough than pcf_decompose — use this for deep strategic work.",
    input_schema: {
      type: "object" as const,
      properties: {
        research_topic: {
          type: "string",
          description:
            "The system, organization, or challenge to analyze (e.g., 'Local bakery expanding to online ordering', 'Law firm digital transformation')",
        },
        domain: {
          type: "string",
          description:
            "Primary domain(s) the topic touches (e.g., 'Commerce, Technology', 'Health, Governance', 'Education, Culture')",
        },
        known_context: {
          type: "string",
          description:
            "Any context already known from the conversation or client record",
        },
      },
      required: ["research_topic"],
    },
  },
];

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

async function executeWebSearch(query: string): Promise<string> {
  const braveKey = getBraveKey();
  if (!braveKey) {
    return "Web search is not configured. Add BRAVE_SEARCH_API_KEY to .env.local to enable.";
  }

  try {
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`,
      {
        headers: { "X-Subscription-Token": braveKey, Accept: "application/json" },
      }
    );

    if (!res.ok) {
      return `Search failed: ${res.status}`;
    }

    const data = await res.json();
    const results = data.web?.results || [];

    if (results.length === 0) return "No results found.";

    return results
      .map(
        (r: { title: string; url: string; description: string }, i: number) =>
          `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.description}`
      )
      .join("\n\n");
  } catch (e) {
    return `Search error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

async function executeFetchUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "CoherenceFoundry/1.0 (consulting research)",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return `Failed to fetch URL: ${res.status} ${res.statusText}`;
    }

    const html = await res.text();

    // Simple HTML to text extraction
    const text = html
      // Remove scripts and styles
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      // Remove HTML tags
      .replace(/<[^>]+>/g, " ")
      // Decode common entities
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ")
      // Clean whitespace
      .replace(/\s+/g, " ")
      .trim();

    return text;
  } catch (e) {
    return `Fetch error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

async function executeSaveFinding(
  input: Record<string, string>,
  sessionId: string
): Promise<string> {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get the session to find client_id
    const session = await getSession(sessionId);

    const { error } = await supabase.from("research_findings").insert({
      client_id: session.client_id,
      session_id: sessionId,
      finding_type: input.finding_type,
      title: input.title,
      content: input.content,
      source_url: input.source_url || null,
      relevance: input.relevance || "medium",
      created_by: user?.id || null,
    });

    if (error) {
      return `Failed to save finding: ${error.message}`;
    }

    return `Finding saved: "${input.title}" (${input.finding_type}, ${input.relevance || "medium"} relevance)`;
  } catch (e) {
    return `Error saving finding: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

async function executePcfDecompose(
  input: Record<string, string>,
  sessionId: string
): Promise<string> {
  // PCF decomposition is performed by Claude itself — this tool returns a structured
  // prompt that tells Claude to do the analysis, then saves the result to the database.
  // The actual decomposition happens in Claude's response after receiving this prompt.
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const session = await getSession(sessionId);

    // Save the decomposition request to the database (results filled in by a follow-up)
    const { data: decomp, error } = await supabase
      .from("pcf_decompositions")
      .insert({
        client_id: session.client_id,
        session_id: sessionId,
        scope_level: input.scope_level,
        scope_description: input.scope_description,
        presences: [],
        connections: [],
        flows: [],
        gaps: [],
        created_by: user?.id || null,
      })
      .select("id")
      .single();

    if (error) {
      return `Failed to create decomposition: ${error.message}`;
    }

    return `PCF decomposition initiated (ID: ${decomp.id}). Now perform the structural analysis.

INSTRUCTIONS: Apply the Presence–Connection–Flow (PCF) model to "${input.scope_description}" at the ${input.scope_level} level.
${input.known_requirements ? `\nKnown requirements: ${input.known_requirements}` : ""}

First, define each axis for this system:
- PRESENCE: The identity, symbolic structure, and coherent posture of the system — what it IS and how it presents itself.
- CONNECTION: The relational architecture, trust dynamics, and engagement systems — how it RELATES to its context and users.
- FLOW: The rhythms, energy exchange, and adaptability characteristics — how value MOVES through it.

Then run each axis through the six-phase Coherence Cycle. Output MUST use this exact table format:

## PCF Analysis: ${input.scope_description}
**Scope Level**: ${input.scope_level}
**Framing Summary**: [1-2 sentence synthesis of this system's presence, connection, and flow characteristics]

### Coherence Cycle

| Cycle Stage | Presence (Identity & Being) | Connection (Relating & Trust) | Flow (Motion & Adaptability) |
|---|---|---|---|
| **Plan** | [What identity/structure needs to exist] | [What relationships/trust systems are needed] | [What rhythms/pathways must be designed] |
| **Build** | [How to construct the identity elements] | [How to build the relational architecture] | [How to implement the flow channels] |
| **Validate** | [Confirm presence holds and is coherent] | [Confirm connections are functional and trustworthy] | [Confirm flow moves without dead ends] |
| **Evaluate** | [Identify gaps in identity/structure] | [Identify disconnections or broken trust] | [Identify stagnation, dissipation, or turbulence] |
| **Refine** | [What to adjust in presence] | [What to repair in connections] | [What to redirect in flow] |
| **Integrate** | [How presence reconverges into a whole] | [How connections compose into a coherent fabric] | [How flows produce sustainable cycles] |

**Final Summary**: [1-2 paragraph summary of findings and impact — focus on results, not the method. What exists, what's missing, what needs to happen.]

RULES:
- Use the EXACT table format above — no narrative paragraphs except framing summary and final summary.
- Language must be functional, clear, and specific to the actual system being analyzed.
- After completing the analysis, use save_finding to record each significant gap, risk, or missing element identified in the Evaluate row.`;
  } catch (e) {
    return `Error: ${e instanceof Error ? e.message : "unknown"}`;
  }
}

async function executeStrategicResearch(
  input: Record<string, string>,
): Promise<string> {
  return `Strategic Systems Research analysis initiated. Perform the following structured analysis:

## Strategic Systems Research: ${input.research_topic}
${input.domain ? `**Domain(s)**: ${input.domain}` : ""}
${input.known_context ? `**Known Context**: ${input.known_context}` : ""}

### Part 1: Research Framework

**1. Research Question in Context**
- State the overarching challenge for this system.
- Identify which strategic drivers are most relevant:
  Value Creation | Resource Flow | Cultural Alignment | Impact Integrity | Capability Building | Strategic Differentiation | Narrative Meaning | Structural Coherence | Decision Velocity

**2. Systems Mapped (Trinity 3.0)**

| Level | System | Description |
|---|---|---|
| **Macro (Super-System)** | [Environmental, policy, or market systems affecting this entity] | [Description] |
| **Core (Internal)** | [The central mechanism/engine of this entity] | [Description] |
| **Sub (Components)** | [Participants, tools, processes, datasets, channels] | [Description] |

**3. States Tracked**

| State | Condition | Key Indicators |
|---|---|---|
| **Initial** | [Current conditions, assumptions, legacy behaviors] | [What exists now] |
| **Transitional** | [Changes in progress, disruptions, shifts] | [What is changing] |
| **Target** | [Desired equilibrium, new alignments] | [What should exist] |

**4. Flows Identified**

| Flow Type | Current State | Gaps/Blockages |
|---|---|---|
| **Information** | [Data exchange, knowledge diffusion patterns] | [Where info is lost or siloed] |
| **Resource** | [Energy, funding, attention, staffing allocation] | [Where resources leak or stagnate] |
| **Influence** | [Ideological, emotional, symbolic transmission] | [Where influence is diluted or misaligned] |

**5. Strategic Driver Cross-Validation**
For each relevant driver, note whether findings validate or challenge the current state:
- Value Creation: [validated/challenged — why]
- Resource Flow: [validated/challenged — why]
- Cultural Alignment: [validated/challenged — why]
- Impact Integrity: [validated/challenged — why]
- Capability Building: [validated/challenged — why]
- Strategic Differentiation: [validated/challenged — why]
- Narrative Meaning: [validated/challenged — why]
- Structural Coherence: [validated/challenged — why]
- Decision Velocity: [validated/challenged — why]

**6. Synergies & Emergent Patterns**
- Cross-domain patterns or scalable insights discovered.
- Emergent harmonies between drivers.

**7. New Possibilities**
- New strategy paths or opportunities not initially anticipated.
- Improvements to flow, measurement, or structure.

**8. Summary & Roadmap**
- What was analyzed
- What matters most
- Concrete next steps linking findings to real-world actions

RULES:
- Use the structured table formats above — minimize narrative prose.
- Be specific to the actual system, not generic.
- After completing the analysis, use save_finding to record each strategic insight, gap, or opportunity identified.`;
}

async function executeTool(
  name: string,
  input: Record<string, string>,
  sessionId: string
): Promise<string> {
  switch (name) {
    case "web_search":
      return executeWebSearch(input.query);
    case "fetch_url":
      return executeFetchUrl(input.url);
    case "save_finding":
      return executeSaveFinding(input, sessionId);
    case "pcf_decompose":
      return executePcfDecompose(input, sessionId);
    case "strategic_research":
      return executeStrategicResearch(input);
    default:
      return `Unknown tool: ${name}`;
  }
}

// ---------------------------------------------------------------------------
// Chat endpoint with tool use loop
// ---------------------------------------------------------------------------

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
    return NextResponse.json(
      { error: "Missing sessionId or message" },
      { status: 400 }
    );
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

  const systemMessage =
    messages.find((m) => m.role === "system")?.content || "";

  // Call Claude API
  const apiKey = getAnthropicKey();

  if (!apiKey) {
    const fallback =
      "AI consulting is not configured yet. Add ANTHROPIC_API_KEY to .env.local to enable Claude-powered consulting sessions.";
    await addMessage(sessionId, "assistant", fallback);
    return NextResponse.json({ reply: fallback });
  }

  try {
    // Tool use loop — Claude may call tools multiple times before responding
    let currentMessages = [...anthropicMessages];
    let maxIterations = 10; // safety limit
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (maxIterations > 0) {
      maxIterations--;

      // Call with retry on rate limit
      let response: Response | null = null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let data: any = null;

      for (let attempt = 0; attempt < 3; attempt++) {
        response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "prompt-caching-2024-07-31",
          },
          body: JSON.stringify({
            model: "claude-sonnet-4-20250514",
            max_tokens: 4096,
            system: [
              {
                type: "text",
                text: systemMessage,
                cache_control: { type: "ephemeral" },
              },
            ],
            messages: currentMessages,
            tools,
          }),
        });

        if (response.status === 429) {
          // Rate limited — wait and retry
          const retryAfter = response.headers.get("retry-after");
          const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : (attempt + 1) * 15000;
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

      // Accumulate token usage
      if (data.usage) {
        totalInputTokens += data.usage.input_tokens || 0;
        totalOutputTokens += data.usage.output_tokens || 0;
      }

      // Check if Claude wants to use tools
      if (data.stop_reason === "tool_use") {
        // Build assistant message with tool use blocks
        const assistantContent = data.content;
        currentMessages.push({
          role: "assistant",
          content: assistantContent,
        });

        // Execute each tool call and build tool results
        const toolResults: {
          type: "tool_result";
          tool_use_id: string;
          content: string;
        }[] = [];

        for (const block of assistantContent) {
          if (block.type === "tool_use") {
            const result = await executeTool(block.name, block.input, sessionId);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: result,
            });
          }
        }

        // Add tool results as user message
        currentMessages.push({
          role: "user",
          content: toolResults as unknown as string,
        });

        // Continue the loop — Claude will process tool results
        continue;
      }

      // Claude responded with text (no more tool calls)
      const reply = data.content
        ?.filter((b: { type: string }) => b.type === "text")
        .map((b: { text: string }) => b.text)
        .join("\n") || "No response generated.";

      // Save assistant message
      await addMessage(sessionId, "assistant", reply);

      // Calculate cost (Claude Sonnet 4: $3/MTok input, $15/MTok output)
      const inputCost = (totalInputTokens / 1_000_000) * 3;
      const outputCost = (totalOutputTokens / 1_000_000) * 15;
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
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          total_tokens: totalInputTokens + totalOutputTokens,
          cost_usd: Math.round(totalCost * 1000000) / 1000000,
          model: "claude-sonnet-4-20250514",
        });
      } catch {
        // Don't fail the request if usage tracking fails
      }

      return NextResponse.json({
        reply,
        usage: {
          input_tokens: totalInputTokens,
          output_tokens: totalOutputTokens,
          total_tokens: totalInputTokens + totalOutputTokens,
          cost_usd: Math.round(totalCost * 10000) / 10000,
        },
      });
    }

    // If we hit max iterations
    const fallback = "The research took too many steps. Please try a more specific question.";
    await addMessage(sessionId, "assistant", fallback);
    return NextResponse.json({ reply: fallback, usage: { input_tokens: totalInputTokens, output_tokens: totalOutputTokens, total_tokens: totalInputTokens + totalOutputTokens, cost_usd: 0 } });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "AI request failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
