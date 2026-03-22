"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "./supabase-server";
import type { GoDaddyAccount } from "@/types/database";

type GoDaddyUpsert = Omit<GoDaddyAccount, "id" | "created_at" | "updated_at">;

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

  const record: GoDaddyUpsert = {
    client_id: clientId,
    domain: (formData.get("domain") as string) || null,
    hosting_plan: (formData.get("hosting_plan") as string) || null,
    godaddy_email: (formData.get("godaddy_email") as string) || null,
    wordpress_installed: formData.get("wordpress_installed") === "on",
    avada_installed: formData.get("avada_installed") === "on",
    ssl_configured: formData.get("ssl_configured") === "on",
    dns_configured: formData.get("dns_configured") === "on",
    admin_access_granted: formData.get("admin_access_granted") === "on",
    handover_complete: formData.get("handover_complete") === "on",
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
