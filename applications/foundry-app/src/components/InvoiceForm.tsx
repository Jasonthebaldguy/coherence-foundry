"use client";

import { useActionState, useState, useCallback } from "react";
import type { Invoice, InvoiceLineItem, ServiceItem } from "@/types/database";

const invoiceTypes = [
  { value: "consultation", label: "Consultation" },
  { value: "deposit", label: "Deposit" },
  { value: "milestone", label: "Milestone" },
  { value: "final", label: "Final" },
  { value: "other", label: "Other" },
] as const;

interface LineItemRow {
  key: string; // client-side key for React
  service_item_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
}

function newRow(): LineItemRow {
  return {
    key: crypto.randomUUID(),
    service_item_id: null,
    description: "",
    quantity: 1,
    unit_price: 0,
  };
}

function existingToRows(items: InvoiceLineItem[]): LineItemRow[] {
  return items.map((li) => ({
    key: li.id,
    service_item_id: li.service_item_id,
    description: li.description,
    quantity: li.quantity,
    unit_price: li.unit_price,
  }));
}

export default function InvoiceForm({
  invoice,
  clients,
  projects,
  serviceItems,
  defaultInvoiceNumber,
  action,
}: {
  invoice?: Invoice;
  clients: { id: string; company_name: string }[];
  projects: { id: string; name: string; client_id: string }[];
  serviceItems: ServiceItem[];
  defaultInvoiceNumber: string;
  action: (formData: FormData) => Promise<void>;
}) {
  const [rows, setRows] = useState<LineItemRow[]>(
    invoice?.line_items && invoice.line_items.length > 0
      ? existingToRows(invoice.line_items)
      : [newRow()]
  );

  const [taxAmount, setTaxAmount] = useState(invoice?.tax_amount ?? 0);

  const subtotal = rows.reduce((sum, r) => sum + r.quantity * r.unit_price, 0);
  const total = subtotal + taxAmount;

  const updateRow = useCallback((key: string, field: keyof LineItemRow, value: string | number | null) => {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  }, []);

  const removeRow = useCallback((key: string) => {
    setRows((prev) => prev.filter((r) => r.key !== key));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, newRow()]);
  }, []);

  const addFromService = useCallback((si: ServiceItem) => {
    setRows((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        service_item_id: si.id,
        description: si.name + (si.description ? ` — ${si.description}` : ""),
        quantity: 1,
        unit_price: si.default_price,
      },
    ]);
  }, []);

  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        // Inject line items as JSON
        formData.set(
          "line_items",
          JSON.stringify(
            rows
              .filter((r) => r.description.trim() !== "")
              .map((r) => ({
                service_item_id: r.service_item_id,
                description: r.description,
                quantity: r.quantity,
                unit_price: r.unit_price,
              }))
          )
        );
        formData.set("amount", String(subtotal));
        formData.set("tax_amount", String(taxAmount));
        await action(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong";
      }
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6 max-w-4xl">
      {error && (
        <div
          className="px-4 py-3 rounded-md text-sm"
          style={{ background: "var(--red)", color: "#fff" }}
        >
          {error}
        </div>
      )}

      {/* Invoice Details */}
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

      {/* Line Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Line Items
          </h2>
          <div className="flex gap-2">
            {serviceItems.length > 0 && (
              <select
                className="text-xs px-2 py-1 rounded"
                style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
                value=""
                onChange={(e) => {
                  const si = serviceItems.find((s) => s.id === e.target.value);
                  if (si) addFromService(si);
                  e.target.value = "";
                }}
              >
                <option value="">+ From Saved Items</option>
                {serviceItems.map((si) => (
                  <option key={si.id} value={si.id}>
                    {si.name} — ${Number(si.default_price).toFixed(2)}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={addRow}
              className="text-xs px-2 py-1 rounded font-medium text-white"
              style={{ background: "var(--accent)" }}
            >
              + Add Line
            </button>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="text-left px-3 py-2 font-medium" style={{ color: "var(--text-secondary)", width: "50%" }}>Description</th>
                <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--text-secondary)", width: "12%" }}>Qty</th>
                <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--text-secondary)", width: "18%" }}>Unit Price</th>
                <th className="text-right px-3 py-2 font-medium" style={{ color: "var(--text-secondary)", width: "15%" }}>Total</th>
                <th className="px-3 py-2" style={{ width: "5%" }}></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-t" style={{ borderColor: "var(--border)" }}>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={row.description}
                      onChange={(e) => updateRow(row.key, "description", e.target.value)}
                      className="w-full text-sm"
                      placeholder="Description..."
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.quantity}
                      onChange={(e) => updateRow(row.key, "quantity", Number(e.target.value) || 0)}
                      className="w-full text-sm text-right"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={row.unit_price}
                      onChange={(e) => updateRow(row.key, "unit_price", Number(e.target.value) || 0)}
                      className="w-full text-sm text-right"
                    />
                  </td>
                  <td className="px-3 py-1.5 text-right font-medium text-sm">
                    ${(row.quantity * row.unit_price).toFixed(2)}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {rows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        className="text-xs hover:opacity-70"
                        style={{ color: "var(--red)" }}
                        title="Remove"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  Subtotal
                </td>
                <td className="px-3 py-2 text-right text-sm font-semibold">
                  ${subtotal.toFixed(2)}
                </td>
                <td></td>
              </tr>
              <tr>
                <td colSpan={2}></td>
                <td className="px-3 py-1.5 text-right text-sm" style={{ color: "var(--text-muted)" }}>
                  Tax
                </td>
                <td className="px-2 py-1.5">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={taxAmount}
                    onChange={(e) => setTaxAmount(Number(e.target.value) || 0)}
                    className="w-full text-sm text-right"
                  />
                </td>
                <td></td>
              </tr>
              <tr className="border-t" style={{ borderColor: "var(--border)" }}>
                <td colSpan={3} className="px-3 py-2 text-right text-sm font-semibold">
                  Total
                </td>
                <td className="px-3 py-2 text-right text-sm font-bold" style={{ color: "var(--accent)" }}>
                  ${total.toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* Due Date + Description */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
        <div>
          <label className="block text-sm font-medium mb-1">Notes</label>
          <textarea
            name="description"
            rows={2}
            defaultValue={invoice?.description ?? ""}
            className="w-full"
            placeholder="Additional notes for the client..."
          />
        </div>
      </section>

      {/* Hidden fields for server action */}
      <input type="hidden" name="line_items" value="" />
      <input type="hidden" name="amount" value={String(subtotal)} />
      <input type="hidden" name="tax_amount" value={String(taxAmount)} />

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
