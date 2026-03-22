"use server";

import { createServerSupabase } from "./supabase-server";

export async function getDashboardStats() {
  const supabase = await createServerSupabase();

  const [clients, projects, invoices, sessions] = await Promise.all([
    supabase.from("clients").select("id, status"),
    supabase.from("projects").select("id, status, phase, name, target_launch_date, client_id, clients(company_name)").eq("status", "active").order("target_launch_date", { ascending: true }),
    supabase.from("invoices").select("id, status, total_amount, invoice_number, due_date, client_id, clients(company_name)"),
    supabase.from("consulting_sessions").select("id, status"),
  ]);

  const activeClients = (clients.data || []).filter((c) => c.status === "active").length;
  const totalClients = (clients.data || []).length;

  const activeProjects = (projects.data || []);

  const allInvoices = invoices.data || [];
  const outstanding = allInvoices
    .filter((i) => ["sent", "viewed", "overdue", "partial"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.total_amount), 0);
  const paid = allInvoices
    .filter((i) => i.status === "paid")
    .reduce((sum, i) => sum + Number(i.total_amount), 0);
  const overdueInvoices = allInvoices.filter((i) => i.status === "overdue");

  const activeSessions = (sessions.data || []).filter((s) => s.status === "active").length;

  // Upcoming deadlines (projects with target_launch_date in next 30 days)
  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcoming = activeProjects.filter((p) => {
    if (!p.target_launch_date) return false;
    const d = new Date(p.target_launch_date);
    return d >= now && d <= thirtyDays;
  });

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return {
    activeClients,
    totalClients,
    activeProjects: activeProjects.length,
    outstanding,
    paid,
    overdueCount: overdueInvoices.length,
    overdueInvoices: overdueInvoices as any[],
    activeSessions,
    upcomingDeadlines: upcoming as any[],
    recentProjects: activeProjects.slice(0, 5) as any[],
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
