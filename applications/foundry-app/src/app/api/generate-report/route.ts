import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, reportType } = await request.json();

  if (!sessionId || !reportType) {
    return NextResponse.json(
      { error: "Missing sessionId or reportType" },
      { status: 400 }
    );
  }

  // Get session info
  const { data: session, error: sessionError } = await supabase
    .from("consulting_sessions")
    .select("*, clients(company_name, industry, website, brand_colors, brand_fonts, brand_notes)")
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Get all research findings for this client
  const { data: findings } = await supabase
    .from("research_findings")
    .select("*")
    .eq("client_id", session.client_id)
    .order("relevance", { ascending: true }) // high first
    .order("created_at", { ascending: false });

  // Get conversation summary from messages
  const { data: messages } = await supabase
    .from("consulting_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .neq("role", "system")
    .order("created_at");

  // Build the prompt for report generation
  const findingsText = (findings || [])
    .map(
      (f: { finding_type: string; title: string; content: string; source_url: string | null; relevance: string }) =>
        `[${f.finding_type.toUpperCase()} | ${f.relevance}] ${f.title}\n${f.content}${f.source_url ? `\nSource: ${f.source_url}` : ""}`
    )
    .join("\n\n");

  const conversationText = (messages || [])
    .map((m: { role: string; content: string }) => `${m.role === "user" ? "Consultant" : "AI"}: ${m.content}`)
    .join("\n\n");

  const reportPrompts: Record<string, string> = {
    discovery: `Generate a professional Discovery Brief based on the consulting session and research findings below. Include:
1. Client Overview (company, industry, goals)
2. Current State Assessment (existing online presence, pain points)
3. Target Audience Profile
4. Competitor Landscape (from research findings)
5. Feature Requirements (must-have vs nice-to-have)
6. Content Needs
7. Technical Requirements
8. Timeline & Budget Alignment
9. Recommended Next Steps

Format as clean markdown.`,
    branding: `Generate a Brand Direction Report based on the consulting session and research findings below. Include:
1. Brand Overview (company positioning, values)
2. Visual Identity Recommendations
   - Primary & secondary color palette (with hex codes if found)
   - Typography recommendations
   - Imagery style and tone
3. Competitor Brand Analysis (from research findings)
4. Industry Design Trends
5. Tone of Voice Guidelines
6. Brand Kit Summary
7. Recommended Next Steps

Format as clean markdown.`,
    scope: `Generate a Project Scope Document based on the consulting session and research findings below. Include:
1. Project Overview
2. Pages & Features (detailed list with descriptions)
3. Technical Specifications (WordPress/Avada, plugins, integrations)
4. Content Requirements per page
5. Design Requirements
6. Hosting & Infrastructure (GoDaddy setup details)
7. Timeline with milestones
8. Budget Breakdown
9. Out of Scope items
10. Risks & Assumptions
11. Sign-off Criteria

Format as clean markdown.`,
    audit: `Generate a Website Audit Report based on the consulting session and research findings below. Include:
1. Current Site Assessment
2. Design Analysis
3. Content Quality Review
4. Technical Assessment (speed, mobile, SEO)
5. Competitor Comparison
6. Improvement Recommendations (prioritized)
7. Estimated Effort per improvement

Format as clean markdown.`,
  };

  const systemPrompt = `You are a professional web development consultant generating a formal report for Coherence Foundry. Be thorough, specific, and actionable. Reference actual findings and conversation details — do not make up information.`;

  const userPrompt = `${reportPrompts[reportType] || reportPrompts.discovery}

--- RESEARCH FINDINGS ---
${findingsText || "No research findings recorded for this client yet."}

--- CONSULTING SESSION TRANSCRIPT ---
${conversationText || "No conversation transcript available."}

--- CLIENT INFO ---
Company: ${session.clients?.company_name || "Unknown"}
Industry: ${session.clients?.industry || "Not specified"}
Website: ${session.clients?.website || "None"}`;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
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
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Anthropic API error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const content =
      data.content?.[0]?.type === "text"
        ? data.content[0].text
        : "Failed to generate report.";

    // Save report to database
    const findingIds = (findings || []).map((f: { id: string }) => f.id);
    const { data: report, error: reportError } = await supabase
      .from("consulting_reports")
      .insert({
        session_id: sessionId,
        client_id: session.client_id,
        report_type: reportType,
        content,
        generated_from: findingIds,
      })
      .select()
      .single();

    if (reportError) throw reportError;

    return NextResponse.json({
      report: {
        id: report.id,
        content,
        report_type: reportType,
      },
    });
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : "Report generation failed";
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
