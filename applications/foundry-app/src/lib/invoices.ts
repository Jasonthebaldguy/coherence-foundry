"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase-server";
import type { Invoice, InvoiceStatus } from "@/types/database";

export async function getInvoices(opts?: {
  status?: string;
  clientId?: string;
  projectId?: string;
  search?: string;
}) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("invoices")
    .select("*, clients(company_name), projects(name)")
    .order("created_at", { ascending: false });

  if (opts?.status && opts.status !== "all") {
    query = query.eq("status", opts.status);
  }
  if (opts?.clientId) {
    query = query.eq("client_id", opts.clientId);
  }
  if (opts?.projectId) {
    query = query.eq("project_id", opts.projectId);
  }
  if (opts?.search) {
    query = query.or(
      `invoice_number.ilike.%${opts.search}%,description.ilike.%${opts.search}%`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Invoice[];
}

export async function getInvoice(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("invoices")
    .select("*, clients(company_name), projects(name)")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Invoice;
}

export async function getNextInvoiceNumber() {
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from("invoices")
    .select("invoice_number")
    .order("created_at", { ascending: false })
    .limit(1);

  if (data && data.length > 0) {
    const last = data[0].invoice_number;
    const match = last.match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10) + 1;
      return `CF-${String(num).padStart(4, "0")}`;
    }
  }
  return "CF-0001";
}

export async function getClientsForInvoice() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("clients")
    .select("id, company_name")
    .in("status", ["active", "prospect"])
    .order("company_name");

  if (error) throw error;
  return data as { id: string; company_name: string }[];
}

export async function getProjectsForInvoice(clientId?: string) {
  const supabase = await createServerSupabase();
  let query = supabase
    .from("projects")
    .select("id, name, client_id")
    .neq("status", "archived")
    .order("name");

  if (clientId) {
    query = query.eq("client_id", clientId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as { id: string; name: string; client_id: string }[];
}

export async function createInvoice(formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const amount = Number(formData.get("amount")) || 0;
  const taxAmount = Number(formData.get("tax_amount")) || 0;

  const record = {
    client_id: formData.get("client_id") as string,
    project_id: (formData.get("project_id") as string) || null,
    invoice_number: formData.get("invoice_number") as string,
    invoice_type: (formData.get("invoice_type") as Invoice["invoice_type"]) || "milestone",
    description: (formData.get("description") as string) || null,
    amount,
    tax_amount: taxAmount,
    total_amount: amount + taxAmount,
    status: "draft" as InvoiceStatus,
    due_date: (formData.get("due_date") as string) || null,
  };

  const { data, error } = await supabase
    .from("invoices")
    .insert(record)
    .select()
    .single();

  if (error) throw error;

  revalidatePath("/invoices");
  redirect(`/invoices/${data.id}`);
}

export async function updateInvoice(id: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const amount = Number(formData.get("amount")) || 0;
  const taxAmount = Number(formData.get("tax_amount")) || 0;

  const record = {
    client_id: formData.get("client_id") as string,
    project_id: (formData.get("project_id") as string) || null,
    invoice_number: formData.get("invoice_number") as string,
    invoice_type: (formData.get("invoice_type") as Invoice["invoice_type"]) || "milestone",
    description: (formData.get("description") as string) || null,
    amount,
    tax_amount: taxAmount,
    total_amount: amount + taxAmount,
    due_date: (formData.get("due_date") as string) || null,
  };

  const { error } = await supabase
    .from("invoices")
    .update(record)
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
  redirect(`/invoices/${id}`);
}

export async function updateInvoiceStatus(id: string, formData: FormData) {
  "use server";
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const status = formData.get("status") as InvoiceStatus;
  const updates: Record<string, unknown> = { status };

  if (status === "sent") {
    updates.sent_at = new Date().toISOString();
  } else if (status === "paid") {
    updates.paid_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("invoices")
    .update(updates)
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${id}`);
}
