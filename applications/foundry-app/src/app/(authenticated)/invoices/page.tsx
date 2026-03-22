import Link from "next/link";
import { getInvoices } from "@/lib/invoices";
import Badge from "@/components/Badge";
import InvoiceSearch from "@/components/InvoiceSearch";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const params = await searchParams;
  const invoices = await getInvoices({
    status: params.status,
    search: params.q,
  });

  const totalOutstanding = invoices
    .filter((i) => ["sent", "viewed", "overdue", "partial"].includes(i.status))
    .reduce((sum, i) => sum + Number(i.total_amount), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Invoices</h1>
          {totalOutstanding > 0 && (
            <p className="text-sm mt-0.5" style={{ color: "var(--text-muted)" }}>
              ${totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })} outstanding
            </p>
          )}
        </div>
        <Link
          href="/invoices/new"
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New Invoice
        </Link>
      </div>

      <InvoiceSearch />

      {invoices.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }} className="text-sm mt-8">
          No invoices found. Create an invoice for a client or project.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Invoice #</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Client</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Type</th>
                <th className="text-right px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Total</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Due</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/invoices/${inv.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {inv.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {inv.clients?.company_name ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3 capitalize" style={{ color: "var(--text-secondary)" }}>
                    {inv.invoice_type}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {inv.due_date || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={inv.status} />
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
