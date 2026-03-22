"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";
import type { Client } from "@/types/database";

type ClientInsert = Omit<Client, "id" | "created_at" | "updated_at" | "created_by">;
type ClientUpdate = Partial<ClientInsert>;

export async function getClients(opts?: {
  status?: string;
  search?: string;
}) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("clients")
    .select("*")
    .order("updated_at", { ascending: false });

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }

  if (opts?.search) {
    query = query.or(
      `company_name.ilike.%${opts.search}%,contact_name.ilike.%${opts.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Client[];
}

export async function getClient(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Client;
}

export async function createClient(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const record: ClientInsert = {
    company_name: formData.get("company_name") as string,
    contact_name: (formData.get("contact_name") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    website: (formData.get("website") as string) || null,
    industry: (formData.get("industry") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: (formData.get("status") as Client["status"]) || "prospect",
    brand_colors: null,
    brand_fonts: null,
    brand_notes: (formData.get("brand_notes") as string) || null,
  };

  const { data, error } = await supabase
    .from("clients")
    .insert({ ...record, created_by: user.id })
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClient(id: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const record: ClientUpdate = {
    company_name: formData.get("company_name") as string,
    contact_name: (formData.get("contact_name") as string) || null,
    contact_email: (formData.get("contact_email") as string) || null,
    contact_phone: (formData.get("contact_phone") as string) || null,
    website: (formData.get("website") as string) || null,
    industry: (formData.get("industry") as string) || null,
    notes: (formData.get("notes") as string) || null,
    status: (formData.get("status") as Client["status"]) || "active",
    brand_notes: (formData.get("brand_notes") as string) || null,
  };

  const { error } = await supabase
    .from("clients")
    .update(record)
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  redirect(`/clients/${id}`);
}
