"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";
import type { ConsultingSession, ConsultingMessage } from "@/types/database";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getSessions(opts?: {
  status?: string;
  clientId?: string;
}) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("consulting_sessions")
    .select("*, clients(company_name)")
    .order("started_at", { ascending: false });

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as ConsultingSession[];
}

export async function getSession(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("consulting_sessions")
    .select("*, clients(company_name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as ConsultingSession;
}

export async function getMessages(sessionId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("consulting_messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at");

  if (error) throw error;
  return data as ConsultingMessage[];
}

export async function getClientsForSession() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name")
    .in("status", ["active", "prospect"])
    .order("company_name");

  if (error) throw error;
  return data as { id: string; company_name: string }[];
}

// ---------------------------------------------------------------------------
// Client context builder
// ---------------------------------------------------------------------------

async function buildClientContext(clientId: string): Promise<string> {
  const supabase = await createServerSupabase();

  // Fetch all client data in parallel
  const [
    { data: client },
    { data: projects },
    { data: invoices },
    { data: sessions },
    { data: godaddy },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single(),
    supabase
      .from("projects")
      .select("name, phase, status, priority, estimated_budget, start_date, target_launch_date, description")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("invoices")
      .select("invoice_number, invoice_type, amount, total_amount, status, due_date")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
    supabase
      .from("consulting_sessions")
      .select("session_type, title, summary, status, started_at")
      .eq("client_id", clientId)
      .eq("status", "complete")
      .order("started_at", { ascending: false }),
    supabase
      .from("godaddy_accounts")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle(),
  ]);

  if (!client) return "";

  const lines: string[] = [];
  lines.push("=== CLIENT CONTEXT ===");
  lines.push(`Company: ${client.company_name}`);
  if (client.industry) lines.push(`Industry: ${client.industry}`);
  if (client.website) lines.push(`Website: ${client.website}`);
  if (client.contact_name) lines.push(`Contact: ${client.contact_name}`);
  if (client.contact_email) lines.push(`Email: ${client.contact_email}`);
  if (client.contact_phone) lines.push(`Phone: ${client.contact_phone}`);
  lines.push(`Status: ${client.status}`);

  // Brand info
  if (client.brand_colors || client.brand_fonts || client.brand_notes) {
    lines.push("");
    lines.push("--- Brand ---");
    if (client.brand_colors && typeof client.brand_colors === "object") {
      const colors = Object.entries(client.brand_colors)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      if (colors) lines.push(`Colors: ${colors}`);
    }
    if (client.brand_fonts && typeof client.brand_fonts === "object") {
      const fonts = Object.entries(client.brand_fonts)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      if (fonts) lines.push(`Fonts: ${fonts}`);
    }
    if (client.brand_notes) lines.push(`Brand notes: ${client.brand_notes}`);
  }

  if (client.notes) {
    lines.push("");
    lines.push(`--- Notes ---`);
    lines.push(client.notes);
  }

  // Projects
  if (projects && projects.length > 0) {
    lines.push("");
    lines.push("--- Projects ---");
    for (const p of projects) {
      const budget = p.estimated_budget ? ` | Budget: $${Number(p.estimated_budget).toLocaleString()}` : "";
      const dates = [
        p.start_date ? `Start: ${p.start_date}` : null,
        p.target_launch_date ? `Launch: ${p.target_launch_date}` : null,
      ].filter(Boolean).join(", ");
      lines.push(`• ${p.name} — Phase: ${p.phase}, Status: ${p.status}, Priority: ${p.priority}${budget}`);
      if (dates) lines.push(`  ${dates}`);
      if (p.description) lines.push(`  ${p.description.slice(0, 200)}`);
    }
  }

  // GoDaddy hosting
  if (godaddy) {
    lines.push("");
    lines.push("--- Hosting (GoDaddy) ---");
    if (godaddy.domain) lines.push(`Domain: ${godaddy.domain}`);
    if (godaddy.hosting_plan) lines.push(`Plan: ${godaddy.hosting_plan}`);
    const checks = [
      godaddy.wordpress_installed ? "✓ WordPress" : "✗ WordPress",
      godaddy.avada_installed ? "✓ Avada" : "✗ Avada",
      godaddy.ssl_configured ? "✓ SSL" : "✗ SSL",
      godaddy.dns_configured ? "✓ DNS" : "✗ DNS",
      godaddy.admin_access_granted ? "✓ Admin access" : "✗ Admin access",
      godaddy.handover_complete ? "✓ Handover" : "✗ Handover",
    ];
    lines.push(`Setup: ${checks.join(", ")}`);
    // Include dynamic checklist items if present
    if (godaddy.checklist_items && Array.isArray(godaddy.checklist_items) && godaddy.checklist_items.length > 0) {
      const custom = godaddy.checklist_items
        .map((ci: { label: string; done: boolean }) => `${ci.done ? "✓" : "✗"} ${ci.label}`)
        .join(", ");
      lines.push(`Custom: ${custom}`);
    }
    if (godaddy.setup_notes) lines.push(`Notes: ${godaddy.setup_notes}`);
  }

  // Invoices summary
  if (invoices && invoices.length > 0) {
    lines.push("");
    lines.push("--- Invoices ---");
    const paid = invoices.filter((i) => i.status === "paid");
    const outstanding = invoices.filter((i) =>
      ["sent", "viewed", "overdue", "partial"].includes(i.status)
    );
    const paidTotal = paid.reduce((s, i) => s + Number(i.total_amount), 0);
    const outTotal = outstanding.reduce((s, i) => s + Number(i.total_amount), 0);
    lines.push(
      `${invoices.length} invoices | $${paidTotal.toLocaleString()} paid | $${outTotal.toLocaleString()} outstanding`
    );
    for (const inv of invoices.slice(0, 5)) {
      lines.push(`• ${inv.invoice_number} (${inv.invoice_type}) — $${Number(inv.total_amount).toFixed(2)} [${inv.status}]`);
    }
  }

  // Previous consulting sessions (the key context footnotes)
  if (sessions && sessions.length > 0) {
    lines.push("");
    lines.push("--- Previous Consulting Sessions ---");
    for (const s of sessions) {
      const date = new Date(s.started_at).toLocaleDateString();
      lines.push(`• [${date}] ${s.session_type.toUpperCase()}: ${s.title || "Untitled"}`);
      if (s.summary) {
        lines.push(`  Summary: ${s.summary}`);
      }
    }
  }

  lines.push("=== END CLIENT CONTEXT ===");
  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// System prompt builder (reads from app_settings)
// ---------------------------------------------------------------------------

async function buildSystemPrompt(
  sessionType: string,
  clientId: string
): Promise<string> {
  const supabase = await createServerSupabase();

  // Fetch prompts and org settings from database
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", [
      "prompt_base",
      `prompt_${sessionType}`,
      "org_name",
      "org_description",
      "org_methodology",
      "org_standards",
    ]);

  const s: Record<string, string> = {};
  for (const row of settings || []) {
    s[row.key] = row.value;
  }

  // Fallback if settings table isn't seeded yet
  const basePrompt =
    s.prompt_base ||
    "You are a web development consultant. Be concise, practical, and focused on actionable next steps.";
  const typePrompt = s[`prompt_${sessionType}`] || "";

  // Build org context
  const orgLines: string[] = [];
  orgLines.push("=== ORGANIZATION CONTEXT ===");
  if (s.org_name) orgLines.push(`Company: ${s.org_name}`);
  if (s.org_description) orgLines.push(`About: ${s.org_description}`);
  if (s.org_methodology) {
    orgLines.push("");
    orgLines.push("--- Methodology ---");
    orgLines.push(s.org_methodology);
  }
  if (s.org_standards) {
    orgLines.push("");
    orgLines.push("--- Technical Standards ---");
    orgLines.push(s.org_standards);
  }
  orgLines.push("=== END ORGANIZATION CONTEXT ===");

  // Build client context
  const clientContext = await buildClientContext(clientId);

  // Also fetch research findings for this client
  const { data: findings } = await supabase
    .from("research_findings")
    .select("finding_type, title, content, relevance, source_url")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })
    .limit(20);

  let findingsContext = "";
  if (findings && findings.length > 0) {
    const fLines: string[] = [];
    fLines.push("=== RESEARCH FINDINGS ===");
    for (const f of findings) {
      fLines.push(
        `• [${f.finding_type}] ${f.title} (${f.relevance} relevance)`
      );
      fLines.push(`  ${f.content.slice(0, 300)}`);
      if (f.source_url) fLines.push(`  Source: ${f.source_url}`);
    }
    fLines.push("=== END RESEARCH FINDINGS ===");
    findingsContext = fLines.join("\n");
  }

  // Fetch documents marked for AI context, filtered by session type and priority
  const { data: contextDocs } = await supabase
    .from("documents")
    .select("filename, doc_type, description, extracted_text, relevant_session_types, context_priority")
    .eq("client_id", clientId)
    .eq("include_in_context", true)
    .not("extracted_text", "is", null)
    .or(`relevant_session_types.eq.{},relevant_session_types.cs.{${sessionType}}`)
    .order("context_priority", { ascending: false });

  let docsContext = "";
  if (contextDocs && contextDocs.length > 0) {
    // Token budget: estimate chars used by other context, leave room for docs
    const MAX_CONTEXT_CHARS = 320_000; // ~80k tokens at 4 chars/token
    const otherContextLength =
      basePrompt.length +
      typePrompt.length +
      orgLines.join("\n").length +
      clientContext.length +
      findingsContext.length;
    let charBudget = MAX_CONTEXT_CHARS - otherContextLength;

    const dLines: string[] = [];
    dLines.push("=== CLIENT DOCUMENTS ===");
    for (const d of contextDocs) {
      const docSize = (d.extracted_text?.length || 0) + (d.filename.length + 50);
      if (charBudget - docSize < 0 && dLines.length > 1) break; // always include at least one
      dLines.push(`--- ${d.filename} (${d.doc_type}) ---`);
      if (d.description) dLines.push(`Description: ${d.description}`);
      if (d.extracted_text) {
        dLines.push(d.extracted_text);
      }
      dLines.push("");
      charBudget -= docSize;
    }
    dLines.push("=== END CLIENT DOCUMENTS ===");
    docsContext = dLines.join("\n");
  }

  // For deliverables and strategy sessions, inject prior session content
  let priorSessionsContext = "";
  if (sessionType === "deliverables" || sessionType === "strategy") {
    const { data: completedSessions } = await supabase
      .from("consulting_sessions")
      .select("id, session_type, title, summary, started_at")
      .eq("client_id", clientId)
      .eq("status", "complete")
      .order("started_at", { ascending: true });

    if (completedSessions && completedSessions.length > 0) {
      const pLines: string[] = [];
      pLines.push("=== PRIOR SESSION CONTENT ===");
      pLines.push(`${completedSessions.length} completed sessions for this client.\n`);

      for (const cs of completedSessions) {
        const date = new Date(cs.started_at).toLocaleDateString();
        pLines.push(`--- [${date}] ${cs.session_type.toUpperCase()}: ${cs.title || "Untitled"} ---`);

        if (cs.summary) {
          pLines.push(cs.summary);
        } else {
          // No summary — fetch messages and build a compact transcript
          const { data: sessionMsgs } = await supabase
            .from("consulting_messages")
            .select("role, content")
            .eq("session_id", cs.id)
            .neq("role", "system")
            .order("created_at");

          if (sessionMsgs && sessionMsgs.length > 0) {
            for (const m of sessionMsgs) {
              // Truncate individual messages to keep context manageable
              const content = m.content.length > 500
                ? m.content.slice(0, 500) + "..."
                : m.content;
              pLines.push(`[${m.role.toUpperCase()}]: ${content}`);
            }
          }
        }
        pLines.push("");
      }

      pLines.push("=== END PRIOR SESSION CONTENT ===");
      priorSessionsContext = pLines.join("\n");
    }
  }

  // Type-specific prompt fallbacks for new session types
  let effectiveTypePrompt = typePrompt;
  if (!effectiveTypePrompt) {
    if (sessionType === "deliverables") {
      effectiveTypePrompt = `You are compiling deliverables from prior consulting sessions. Your job is to extract and organize:

1. DECISIONS MADE: Every decision agreed upon across all sessions, with context
2. ACTION ITEMS: Every commitment, task, or next step — who owns it, what's the scope, any conditions
3. OPEN ITEMS: Unresolved questions or dependencies that block progress
4. TIMELINE: Any dates, deadlines, or sequencing discussed

Present these as a structured, actionable checklist grouped by category. Reference which session each item came from. Flag any contradictions between sessions. Ask clarifying questions if commitments are ambiguous.`;
    } else if (sessionType === "strategy") {
      effectiveTypePrompt = `You are building a comprehensive strategy from the full history of consulting sessions with this client. All prior session content is provided in context.

Your role:
1. SYNTHESIZE: Identify the through-lines, patterns, and strategic direction across all sessions
2. STRUCTURE: Organize findings into a coherent strategic framework
3. GAPS: Identify what's missing — areas not yet explored, decisions deferred, assumptions untested
4. RECOMMEND: Propose a strategic roadmap that connects findings to concrete outcomes
5. PRIORITIZE: Help the client focus on what matters most given constraints and goals

Build on what's been established. Don't re-discover — synthesize and advance. Reference specific prior session findings to ground your recommendations.`;
    }
  }

  // Assemble: base + type + org + client + prior sessions + findings + documents
  const parts = [basePrompt];
  if (effectiveTypePrompt) parts.push(effectiveTypePrompt);
  parts.push(orgLines.join("\n"));
  parts.push(clientContext);
  if (priorSessionsContext) parts.push(priorSessionsContext);
  if (findingsContext) parts.push(findingsContext);
  if (docsContext) parts.push(docsContext);

  return parts.join("\n\n");
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export async function createSession(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const clientId = formData.get("client_id") as string;
  const sessionType =
    (formData.get("session_type") as ConsultingSession["session_type"]) || "discovery";
  const title = (formData.get("title") as string) || `${sessionType} session`;

  const { data, error } = await supabase
    .from("consulting_sessions")
    .insert({
      client_id: clientId,
      session_type: sessionType,
      title,
      status: "active",
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Build context-rich system prompt
  const systemPrompt = await buildSystemPrompt(sessionType, clientId);
  await supabase.from("consulting_messages").insert({
    session_id: data.id,
    role: "system",
    content: systemPrompt,
  });

  revalidatePath("/consulting");
  redirect(`/consulting/${data.id}`);
}

export async function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("consulting_messages").insert({
    session_id: sessionId,
    role,
    content,
  });
  if (error) throw error;
}

export async function deleteSession(sessionId: string) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Delete messages, usage, and session (messages cascade via FK, usage cascades too)
  const { error } = await supabase
    .from("consulting_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) throw error;

  revalidatePath("/consulting");
}

export async function completeSession(sessionId: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const summary = (formData.get("summary") as string) || null;

  const { error } = await supabase
    .from("consulting_sessions")
    .update({
      status: "complete",
      summary,
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  if (error) throw error;

  revalidatePath("/consulting");
  revalidatePath(`/consulting/${sessionId}`);
}
