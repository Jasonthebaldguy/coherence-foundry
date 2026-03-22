"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase-server";
import type { GoDaddyAccount, ChecklistItem } from "@/types/database";
import { DEFAULT_CHECKLIST } from "./godaddy-defaults";

export async function getGoDaddyAccount(clientId: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("godaddy_accounts")
    .select("*")
    .eq("client_id", clientId)
    .maybeSingle();

  if (error) throw error;
  return data as GoDaddyAccount | null;
}

export async function upsertGoDaddyAccount(clientId: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // Parse checklist items from form
  const itemsJson = formData.get("checklist_items") as string;
  const checklist: ChecklistItem[] = itemsJson
    ? JSON.parse(itemsJson)
    : DEFAULT_CHECKLIST;

  const record = {
    client_id: clientId,
    domain: (formData.get("domain") as string) || null,
    hosting_plan: (formData.get("hosting_plan") as string) || null,
    godaddy_email: (formData.get("godaddy_email") as string) || null,
    wordpress_installed: checklist.some((i) => i.key === "wordpress_installed" && i.done),
    avada_installed: checklist.some((i) => i.key === "avada_installed" && i.done),
    ssl_configured: checklist.some((i) => i.key === "ssl_configured" && i.done),
    dns_configured: checklist.some((i) => i.key === "dns_configured" && i.done),
    admin_access_granted: checklist.some((i) => i.key === "admin_access_granted" && i.done),
    handover_complete: checklist.some((i) => i.key === "handover_complete" && i.done),
    checklist_items: checklist,
    setup_notes: (formData.get("setup_notes") as string) || null,
  };

  // Check if record exists
  const existing = await getGoDaddyAccount(clientId);

  if (existing) {
    const { error } = await supabase
      .from("godaddy_accounts")
      .update(record)
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("godaddy_accounts")
      .insert(record);
    if (error) throw error;
  }

  revalidatePath(`/clients/${clientId}`);
}
