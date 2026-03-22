export default function DashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Active Projects" value="—" />
        <Card title="Upcoming Deadlines" value="—" />
        <Card title="Outstanding Invoices" value="—" />
        <Card title="Recent Payments" value="—" />
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div
      className="p-4 rounded-lg border"
      style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
    >
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        {title}
      </p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  );
}
