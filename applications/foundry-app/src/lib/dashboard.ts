"use server";

import { createServerSupabase, createServiceSupabase } from "./supabase-server";

export async function getDashboardStats() {
  const supabase = await createServerSupabase();
  const serviceSupabase = createServiceSupabase();

  const [clients, projects, invoices, sessions, usage] = await Promise.all([
    supabase.from("clients").select("id, status"),
    supabase.from("projects").select("id, status, phase, name, target_launch_date, client_id, clients(company_name)").eq("status", "active").order("target_launch_date", { ascending: true }),
    supabase.from("invoices").select("id, status, total_amount, invoice_number, due_date, client_id, clients(company_name)"),
    supabase.from("consulting_sessions").select("id, status"),
    serviceSupabase.from("api_usage").select("input_tokens, output_tokens, total_tokens, cost_usd, created_at"),
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

  const now = new Date();

  // API usage stats
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const allUsage: any[] = usage.data || [];
  const totalTokens = allUsage.reduce((s: number, u: any) => s + (u.total_tokens || 0), 0);
  const totalCost = allUsage.reduce((s: number, u: any) => s + Number(u.cost_usd || 0), 0);

  // This month's usage
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const monthUsage = allUsage.filter((u: any) => u.created_at >= monthStart);
  const monthTokens = monthUsage.reduce((s: number, u: any) => s + (u.total_tokens || 0), 0);
  const monthCost = monthUsage.reduce((s: number, u: any) => s + Number(u.cost_usd || 0), 0);

  // Today's usage
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const todayUsage = allUsage.filter((u: any) => u.created_at >= todayStart);
  const todayCost = todayUsage.reduce((s: number, u: any) => s + Number(u.cost_usd || 0), 0);
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // Upcoming deadlines (projects with target_launch_date in next 30 days)
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
    apiUsage: {
      totalTokens,
      totalCost: Math.round(totalCost * 10000) / 10000,
      monthTokens,
      monthCost: Math.round(monthCost * 10000) / 10000,
      todayCost: Math.round(todayCost * 10000) / 10000,
      requestCount: allUsage.length,
      monthRequests: monthUsage.length,
    },
  };
  /* eslint-enable @typescript-eslint/no-explicit-any */
}
