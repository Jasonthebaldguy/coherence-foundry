import Link from "next/link";
import { getClients } from "@/lib/clients";
import Badge from "@/components/Badge";
import ClientSearch from "@/components/ClientSearch";

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const clients = await getClients({
    status: params.status,
    search: params.q,
  });

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

      <ClientSearch />

      {clients.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }} className="text-sm mt-8">
          No clients found. Create your first client to get started.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Company</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Contact</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Industry</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  key={client.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/clients/${client.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {client.company_name}
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {client.contact_name || "\u2014"}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {client.industry || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={client.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
