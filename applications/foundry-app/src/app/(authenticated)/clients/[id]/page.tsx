import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { getGoDaddyAccount } from "@/lib/godaddy";
import { getProjects } from "@/lib/projects";
import { getInvoices } from "@/lib/invoices";
import { getSessions } from "@/lib/consulting";
import { createServerSupabase, createServiceSupabase } from "@/lib/supabase-server";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import GoDaddyChecklist from "@/components/GoDaddyChecklist";
import DocumentUpload from "@/components/DocumentUpload";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let client;
  try {
    client = await getClient(id);
  } catch {
    notFound();
  }

  const supabase = await createServerSupabase();
  const godaddy = await getGoDaddyAccount(id);
  const projects = await getProjects({ clientId: id });
  const invoices = await getInvoices({ clientId: id });
  const sessions = await getSessions({ clientId: id });

  const serviceSupabase = createServiceSupabase();
  const { data: documents } = await serviceSupabase
    .from("documents")
    .select("id, filename, media_type, file_size, doc_type, include_in_context, description, uploaded_at")
    .eq("client_id", id)
    .order("uploaded_at", { ascending: false });

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/clients"
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to Clients
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{client.company_name}</h1>
            <Badge value={client.status} />
          </div>
          {client.industry && (
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              {client.industry}
            </p>
          )}
        </div>
        <Link
          href={`/clients/${id}/edit`}
          className="px-3 py-1.5 rounded-md text-sm font-medium"
          style={{
            background: "var(--bg-tertiary)",
            color: "var(--text-secondary)",
          }}
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <Card>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            Contact
          </h2>
          <dl className="space-y-2 text-sm">
            {client.contact_name && (
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Name</dt>
                <dd>{client.contact_name}</dd>
              </div>
            )}
            {client.contact_email && (
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Email</dt>
                <dd>
                  <a href={`mailto:${client.contact_email}`} style={{ color: "var(--accent)" }}>
                    {client.contact_email}
                  </a>
                </dd>
              </div>
            )}
            {client.contact_phone && (
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Phone</dt>
                <dd>{client.contact_phone}</dd>
              </div>
            )}
            {client.website && (
              <div>
                <dt style={{ color: "var(--text-muted)" }}>Website</dt>
                <dd>
                  <a
                    href={client.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--accent)" }}
                  >
                    {client.website}
                  </a>
                </dd>
              </div>
            )}
            {!client.contact_name && !client.contact_email && !client.contact_phone && !client.website && (
              <p style={{ color: "var(--text-muted)" }}>No contact info yet.</p>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
            Brand Kit
          </h2>
          {client.brand_notes ? (
            <p className="text-sm whitespace-pre-wrap">{client.brand_notes}</p>
          ) : (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No brand notes yet. Edit client to add brand info.
            </p>
          )}
        </Card>
      </div>

      <div className="mb-6">
        <GoDaddyChecklist clientId={id} initial={godaddy} />
      </div>

      {client.notes && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Notes
          </h2>
          <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
        </Card>
      )}

      <div className="mb-6">
        <DocumentUpload clientId={id} documents={documents || []} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Projects
            </h2>
            <Link
              href={`/projects/new`}
              className="text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              + New
            </Link>
          </div>
          {projects.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No projects yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {projects.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/projects/${p.id}`}
                    className="hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {p.name}
                  </Link>
                  <Badge value={p.phase} />
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Invoices
            </h2>
            <Link
              href={`/invoices/new`}
              className="text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              + New
            </Link>
          </div>
          {invoices.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No invoices yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/invoices/${inv.id}`}
                    className="hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {inv.invoice_number}
                  </Link>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      ${Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                    <Badge value={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
              Consulting
            </h2>
            <Link
              href={`/consulting/new`}
              className="text-xs hover:underline"
              style={{ color: "var(--accent)" }}
            >
              + New
            </Link>
          </div>
          {sessions.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              No sessions yet.
            </p>
          ) : (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li key={s.id} className="flex items-center justify-between text-sm">
                  <Link
                    href={`/consulting/${s.id}`}
                    className="hover:underline"
                    style={{ color: "var(--accent)" }}
                  >
                    {s.title || s.session_type}
                  </Link>
                  <Badge value={s.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
