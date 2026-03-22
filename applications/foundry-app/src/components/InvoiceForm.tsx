"use client";

import { useActionState } from "react";
import type { Invoice } from "@/types/database";

const invoiceTypes = [
  { value: "consultation", label: "Consultation" },
  { value: "deposit", label: "Deposit" },
  { value: "milestone", label: "Milestone" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
] as const;

export default function InvoiceForm({
  invoice,
  clients,
  projects,
  defaultInvoiceNumber,
  action,
}: {
  invoice?: Invoice;
  clients: { id: string; company_name: string }[];
  projects: { id: string; name: string; client_id: string }[];
  defaultInvoiceNumber: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await action(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong";
      }
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6 max-w-2xl">
      {error && (
        <div
          className="px-4 py-3 rounded-md text-sm"
          style={{ background: "var(--red)", color: "#fff" }}
        >
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Invoice Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Invoice # <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              name="invoice_number"
              required
              defaultValue={invoice?.invoice_number ?? defaultInvoiceNumber}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              name="invoice_type"
              defaultValue={invoice?.invoice_type ?? "milestone"}
              className="w-full"
            >
              {invoiceTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Client <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select
              name="client_id"
              required
              defaultValue={invoice?.client_id ?? ""}
              className="w-full"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Project</label>
            <select
              name="project_id"
              defaultValue={invoice?.project_id ?? ""}
              className="w-full"
            >
              <option value="">None</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Amount
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Amount <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              defaultValue={invoice?.amount ?? ""}
              className="w-full"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tax</label>
            <input
              name="tax_amount"
              type="number"
              step="0.01"
              min="0"
              defaultValue={invoice?.tax_amount ?? "0"}
              className="w-full"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <input
              name="due_date"
              type="date"
              defaultValue={invoice?.due_date ?? ""}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Description
        </h2>
        <textarea
          name="description"
          rows={3}
          defaultValue={invoice?.description ?? ""}
          className="w-full"
          placeholder="Line items, scope of work, etc."
        />
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
        </button>
      </div>
    </form>
  );
}
