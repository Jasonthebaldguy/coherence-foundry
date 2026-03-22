import Link from "next/link";

export default function ClientsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Clients</h1>
        <Link
          href="/clients/new"
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New Client
        </Link>
      </div>
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        No clients yet. Create your first client to get started.
      </p>
    </div>
  );
}
