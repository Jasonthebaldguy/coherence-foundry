"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";
import type { Project, ProjectPhase } from "@/types/database";

export async function getProjects(opts?: {
  status?: string;
  phase?: string;
  clientId?: string;
  search?: string;
}) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("projects")
    .select("*, clients(company_name)")
    .order("updated_at", { ascending: false });

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts?.phase && opts.phase !== "all") {
    query = query.eq("phase", opts.phase);
  }
  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }
  if (opts?.search) {
    query = query.ilike("name", `%${opts.search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Project[];
}

export async function getProject(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("projects")
    .select("*, clients(company_name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Project;
}

export async function getClientsForSelect() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name")
    .in("status", ["active", "prospect"])
    .order("company_name");

  if (error) throw error;
  return data as { id: string; company_name: string }[];
}

export async function createProject(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const record = {
    client_id: formData.get("client_id") as string,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    phase: (formData.get("phase") as ProjectPhase) || "discovery",
    status: (formData.get("status") as Project["status"]) || "active",
    priority: (formData.get("priority") as Project["priority"]) || "medium",
    estimated_budget: formData.get("estimated_budget")
      ? Number(formData.get("estimated_budget"))
      : null,
    start_date: (formData.get("start_date") as string) || null,
    target_launch_date: (formData.get("target_launch_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from("projects")
    .insert(record)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const record = {
    client_id: formData.get("client_id") as string,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    phase: (formData.get("phase") as ProjectPhase) || "discovery",
    status: (formData.get("status") as Project["status"]) || "active",
    priority: (formData.get("priority") as Project["priority"]) || "medium",
    estimated_budget: formData.get("estimated_budget")
      ? Number(formData.get("estimated_budget"))
      : null,
    start_date: (formData.get("start_date") as string) || null,
    target_launch_date: (formData.get("target_launch_date") as string) || null,
    notes: (formData.get("notes") as string) || null,
  };

  const { error } = await supabase
    .from("projects")
    .update(record)
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/projects");
  revalidatePath(`/projects/${id}`);
  redirect(`/projects/${id}`);
}
