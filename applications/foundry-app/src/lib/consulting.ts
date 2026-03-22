"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";
import type { ConsultingSession, ConsultingMessage } from "@/types/database";

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

export async function createSession(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const clientId = formData.get("client_id") as string;
  const sessionType = (formData.get("session_type") as ConsultingSession["session_type"]) || "discovery";
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

  // Add system prompt as first message
  const systemPrompt = getSystemPrompt(sessionType);
  await supabase.from("consulting_messages").insert({
    session_id: data.id,
    role: "system",
    content: systemPrompt,
  });

  revalidatePath("/consulting");
  redirect(`/consulting/${data.id}`);
}

export async function addMessage(sessionId: string, role: "user" | "assistant", content: string) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("consulting_messages").insert({
    session_id: sessionId,
    role,
    content,
  });
  if (error) throw error;
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

function getSystemPrompt(sessionType: string): string {
  const base = `You are a web development consultant for Coherence Foundry. You help clients plan and build professional WordPress/Avada websites on GoDaddy hosting. Be concise, practical, and focused on actionable next steps.`;

  switch (sessionType) {
    case "discovery":
      return `${base}\n\nThis is a DISCOVERY session. Help the client articulate their business goals, target audience, must-have features, and content needs. Ask about their current online presence, competitors they admire, and timeline expectations. Produce a clear summary of requirements at the end.`;
    case "branding":
      return `${base}\n\nThis is a BRANDING session. Help the client define their visual identity — colors, fonts, tone of voice, imagery style. Ask about their existing brand materials, industry conventions, and what feeling they want visitors to have. Guide them toward a cohesive brand kit.`;
    case "scope_review":
      return `${base}\n\nThis is a SCOPE REVIEW session. Walk through the project scope with the client. Cover pages, features, content requirements, integrations, and timeline. Identify any gaps or risks. Confirm budget alignment and sign-off criteria.`;
    default:
      return base;
  }
}
