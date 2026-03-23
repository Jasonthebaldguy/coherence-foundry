"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase-server";

// ---------------------------------------------------------------------------
// Read settings
// ---------------------------------------------------------------------------

export async function getSetting(key: string): Promise<string | null> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", key)
    .single();
  return data?.value ?? null;
}

export async function getSettings(keys: string[]): Promise<Record<string, string>> {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", keys);

  const result: Record<string, string> = {};
  for (const row of data || []) {
    result[row.key] = row.value;
  }
  return result;
}

export async function getAllSettings(): Promise<
  { id: string; key: string; value: string; description: string | null }[]
> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("app_settings")
    .select("id, key, value, description")
    .order("key");

  if (error) throw error;
  return data || [];
}

// ---------------------------------------------------------------------------
// Write settings
// ---------------------------------------------------------------------------

export async function updateSetting(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const key = formData.get("key") as string;
  const value = formData.get("value") as string;

  const { error } = await supabase
    .from("app_settings")
    .update({ value, updated_at: new Date().toISOString(), updated_by: user.id })
    .eq("key", key);

  if (error) throw error;

  revalidatePath("/settings");
}

// ---------------------------------------------------------------------------
// Org context builder (for consulting prompts)
// ---------------------------------------------------------------------------

export async function buildOrgContext(): Promise<string> {
  const keys = ["org_name", "org_description", "org_methodology", "org_standards"];
  const settings = await getSettings(keys);

  const lines: string[] = [];
  lines.push("=== ORGANIZATION CONTEXT ===");
  if (settings.org_name) lines.push(`Company: ${settings.org_name}`);
  if (settings.org_description) lines.push(`About: ${settings.org_description}`);
  if (settings.org_methodology) {
    lines.push("");
    lines.push("--- Methodology ---");
    lines.push(settings.org_methodology);
  }
  if (settings.org_standards) {
    lines.push("");
    lines.push("--- Technical Standards ---");
    lines.push(settings.org_standards);
  }
  lines.push("=== END ORGANIZATION CONTEXT ===");

  return lines.join("\n");
}
