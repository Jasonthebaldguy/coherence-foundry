"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase-server";
import type { Task, TaskStatus, ProjectPhase } from "@/types/database";

export async function getTasks(projectId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("created_at");

  if (error) throw error;
  return data as Task[];
}

export async function createTask(projectId: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const record = {
    project_id: projectId,
    name: formData.get("name") as string,
    description: (formData.get("description") as string) || null,
    phase: (formData.get("phase") as Exclude<ProjectPhase, "complete">) || "build",
    status: (formData.get("status") as TaskStatus) || "open",
    priority: (formData.get("priority") as Task["priority"]) || "medium",
    section: (formData.get("section") as string) || "Backlog",
    due_date: (formData.get("due_date") as string) || null,
  };

  const { error } = await supabase.from("tasks").insert(record);
  if (error) throw error;

  revalidatePath(`/projects/${projectId}`);
}

export async function updateTaskStatus(
  taskId: string,
  projectId: string,
  formData: FormData
) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const status = formData.get("status") as TaskStatus;

  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId);

  if (error) throw error;

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteTask(taskId: string, projectId: string) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw error;

  revalidatePath(`/projects/${projectId}`);
}
