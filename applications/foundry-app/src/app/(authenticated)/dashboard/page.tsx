import Link from "next/link";
import { getDashboardStats } from "@/lib/dashboard";
import Badge from "@/components/Badge";

export default async function DashboardPage() {
  const stats = await getDashboardStats();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Active Clients"
          value={String(stats.activeClients)}
          sub={`${stats.totalClients} total`}
        />
        <StatCard
          title="Active Projects"
          value={String(stats.activeProjects)}
        />
        <StatCard
          title="Outstanding"
          value={`$${stats.outstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          alert={stats.overdueCount > 0}
          sub={stats.overdueCount > 0 ? `${stats.overdueCount} overdue` : undefined}
        />
        <StatCard
          title="Total Paid"
          value={`$${stats.paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div
          className="p-4 rounded-lg border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Active Projects
            </h2>
            <Link href="/projects" className="text-xs hover:underline" style={{ color: "var(--accent)" }}>
              View all
            </Link>
          </div>
          {stats.recentProjects.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No active projects.</p>
          ) : (
            <ul className="space-y-2">
              {stats.recentProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/projects/${p.id}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                      {p.name}
                    </Link>
                    {p.clients?.company_name && (
                      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                        {p.clients.company_name}
                      </span>
                    )}
                  </div>
                  <Badge value={p.phase} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div
          className="p-4 rounded-lg border"
          style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Upcoming Deadlines
            </h2>
          </div>
          {stats.upcomingDeadlines.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No deadlines in the next 30 days.</p>
          ) : (
            <ul className="space-y-2">
              {stats.upcomingDeadlines.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <Link href={`/projects/${p.id}`} className="hover:underline" style={{ color: "var(--accent)" }}>
                    {p.name}
                  </Link>
                  <span style={{ color: "var(--text-muted)" }}>{p.target_launch_date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {stats.overdueCount > 0 && (
          <div
            className="p-4 rounded-lg border md:col-span-2"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--red)" }}
          >
            <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--red)" }}>
              Overdue Invoices
            </h2>
            <ul className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {stats.overdueInvoices.map((inv: any) => (
                <li key={inv.id} className="flex items-center justify-between text-sm">
                  <div>
                    <Link href={`/invoices/${inv.id}`} className="hover:underline font-medium" style={{ color: "var(--red)" }}>
                      {inv.invoice_number}
                    </Link>
                    {inv.clients?.[0]?.company_name && (
                      <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                        {inv.clients[0].company_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">
                      ${Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    {inv.due_date && (
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Due {inv.due_date}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  alert,
}: {
  title: string;
  value: string;
  sub?: string;
  alert?: boolean;
}) {
  return (
    <div
      className="p-4 rounded-lg border"
      style={{
        background: "var(--bg-secondary)",
        borderColor: alert ? "var(--red)" : "var(--border)",
      }}
    >
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <p className="text-2xl font-semibold mt-1" style={{ color: alert ? "var(--red)" : undefined }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-0.5" style={{ color: alert ? "var(--red)" : "var(--text-muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}
