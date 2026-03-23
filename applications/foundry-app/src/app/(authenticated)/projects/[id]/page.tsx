import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject } from "@/lib/projects";
import { getTasks } from "@/lib/tasks";
import { getInvoices } from "@/lib/invoices";
import Badge from "@/components/Badge";
import Card from "@/components/Card";
import TaskBoard from "@/components/TaskBoard";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const tasks = await getTasks(id);
  const invoices = await getInvoices({ projectId: id });

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/projects"
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to Projects
        </Link>
      </div>

      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <Badge value={project.phase} />
            <Badge value={project.status} />
          </div>
          {project.clients?.company_name && (
            <Link
              href={`/clients/${project.client_id}`}
              className="text-sm mt-1 inline-block hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              {project.clients.company_name}
            </Link>
          )}
        </div>
        <Link
          href={`/projects/${id}/edit`}
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
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Priority</p>
          <div className="mt-1"><Badge value={project.priority} /></div>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Budget</p>
          <p className="text-sm font-medium mt-1">
            {project.estimated_budget
              ? `$${Number(project.estimated_budget).toLocaleString()}`
              : "\u2014"}
          </p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Start</p>
          <p className="text-sm font-medium mt-1">{project.start_date || "\u2014"}</p>
        </Card>
        <Card>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Target Launch</p>
          <p className="text-sm font-medium mt-1">{project.target_launch_date || "\u2014"}</p>
        </Card>
      </div>

      {project.description && (
        <Card className="mb-6">
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Description
          </h2>
          <p className="text-sm whitespace-pre-wrap">{project.description}</p>
        </Card>
      )}

      <div className="mb-6">
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--text-muted)" }}>
          Tasks
        </h2>
        <TaskBoard projectId={id} tasks={tasks} />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Invoices
          </h2>
          <Link
            href={`/invoices/new`}
            className="text-xs hover:underline"
            style={{ color: "var(--accent)" }}
          >
            + New Invoice
          </Link>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No invoices for this project yet.
          </p>
        ) : (
          <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--bg-secondary)" }}>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-secondary)" }}>Invoice #</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-secondary)" }}>Type</th>
                  <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--text-secondary)" }}>Total</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-secondary)" }}>Due</th>
                  <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t" style={{ borderColor: "var(--border)" }}>
                    <td className="px-3 py-2">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-medium hover:underline"
                        style={{ color: "var(--accent)" }}
                      >
                        {inv.invoice_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2 capitalize" style={{ color: "var(--text-secondary)" }}>
                      {inv.invoice_type}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      ${Number(inv.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--text-secondary)" }}>
                      {inv.due_date || "\u2014"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge value={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {project.notes && (
        <Card>
          <h2 className="text-sm font-semibold mb-2" style={{ color: "var(--text-muted)" }}>
            Notes
          </h2>
          <p className="text-sm whitespace-pre-wrap">{project.notes}</p>
        </Card>
      )}
    </div>
  );
}
