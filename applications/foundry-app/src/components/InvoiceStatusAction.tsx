"use client";

import { useActionState } from "react";
import { updateInvoiceStatus } from "@/lib/invoices";
import type { InvoiceStatus } from "@/types/database";

const transitions: Record<string, { label: string; to: InvoiceStatus; color: string }[]> = {
  draft: [
    { label: "Mark as Sent", to: "sent", color: "var(--accent)" },
    { label: "Cancel", to: "canceled", color: "var(--text-muted)" },
  ],
  sent: [
    { label: "Mark as Paid", to: "paid", color: "var(--green)" },
    { label: "Mark Overdue", to: "overdue", color: "var(--red)" },
    { label: "Cancel", to: "canceled", color: "var(--text-muted)" },
  ],
  viewed: [
    { label: "Mark as Paid", to: "paid", color: "var(--green)" },
    { label: "Mark Overdue", to: "overdue", color: "var(--red)" },
  ],
  overdue: [
    { label: "Mark as Paid", to: "paid", color: "var(--green)" },
    { label: "Cancel", to: "canceled", color: "var(--text-muted)" },
  ],
  partial: [
    { label: "Mark as Paid", to: "paid", color: "var(--green)" },
  ],
};

export default function InvoiceStatusAction({
  invoiceId,
  currentStatus,
}: {
  invoiceId: string;
  currentStatus: InvoiceStatus;
}) {
  const boundAction = updateInvoiceStatus.bind(null, invoiceId);
  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await boundAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null
  );

  const available = transitions[currentStatus];
  if (!available || available.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap">
      {available.map((t) => (
        <form key={t.to} action={formAction}>
          <input type="hidden" name="status" value={t.to} />
          <button
            type="submit"
            disabled={isPending}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
            style={{ background: t.color, opacity: isPending ? 0.7 : 1 }}
          >
            {t.label}
          </button>
        </form>
      ))}
      {error && (
        <span className="text-xs self-center" style={{ color: "var(--red)" }}>{error}</span>
      )}
    </div>
  );
}
