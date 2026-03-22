import Link from "next/link";

export default function InvoicesPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Invoices</h1>
        <Link
          href="/invoices/new"
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New Invoice
        </Link>
      </div>
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        No invoices yet. Create an invoice for a client or project.
      </p>
    </div>
  );
}
