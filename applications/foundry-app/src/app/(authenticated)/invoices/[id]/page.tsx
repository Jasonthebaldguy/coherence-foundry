import Link from "next/link";
import { notFound } from "next/navigation";
import { getInvoice } from "@/lib/invoices";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import InvoiceStatusAction from "@/components/InvoiceStatusAction";

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let invoice;
  try {
    invoice = await getInvoice(id);
  } catch {
    notFound();
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/invoices"
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to Invoices
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{invoice.invoice_number}</h1>
            <Badge value={invoice.status} />
            <Badge value={invoice.invoice_type} />
          </div>
          <div className="flex gap-4 mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {invoice.clients?.company_name && (
              <Link
                href={`/clients/${invoice.client_id}`}
                className="hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                {invoice.clients.company_name}
              </Link>
            )}
            {invoice.projects?.name && (
              <Link
                href={`/projects/${invoice.project_id}`}
                className="hover:underline"
                style={{ color: "var(--text-muted)" }}
              >
                {invoice.projects.name}
              </Link>
            )}
          </div>
        </div>
        <Link
          href={`/invoices/${id}/edit`}
          className="px-3 py-1.5 rounded-md text-sm font-medium"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Amount</p>
          <p className="text-lg font-semibold mt-1">
            ${Number(invoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Tax</p>
          <p className="text-lg font-semibold mt-1">
            ${Number(invoice.tax_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Total</p>
          <p className="text-lg font-semibold mt-1">
            ${Number(invoice.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Due Date</p>
          <p className="text-sm font-medium mt-1">{invoice.due_date || "\u2014"}</p>
        </Card>
      </div>

      <div className="mb-6">
        <InvoiceStatusAction invoiceId={id} currentStatus={invoice.status} />
      </div>

      {invoice.description && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Description
          </h2>
          <p className="text-sm whitespace-pre-wrap">{invoice.description}</p>
        </Card>
      )}

      <Card className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
          Timeline
        </h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt style={{ color: "var(--text-muted)" }}>Created</dt>
            <dd>{new Date(invoice.created_at).toLocaleDateString()}</dd>
          </div>
          {invoice.sent_at && (
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Sent</dt>
              <dd>{new Date(invoice.sent_at).toLocaleDateString()}</dd>
            </div>
          )}
          {invoice.paid_at && (
            <div className="flex justify-between">
              <dt style={{ color: "var(--text-muted)" }}>Paid</dt>
              <dd>{new Date(invoice.paid_at).toLocaleDateString()}</dd>
            </div>
          )}
        </dl>
      </Card>

      {invoice.square_invoice_url && (
        <Card>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Square
          </h2>
          <a
            href={invoice.square_invoice_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm hover:underline"
            style={{ color: "var(--accent)" }}
          >
            View in Square &rarr;
          </a>
        </Card>
      )}
    </div>
  );
}
