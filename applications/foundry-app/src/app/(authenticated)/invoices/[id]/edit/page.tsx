import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getInvoice,
  updateInvoice,
  getClientsForInvoice,
  getProjectsForInvoice,
  getServiceItems,
} from "@/lib/invoices";
import InvoiceForm from "@/components/InvoiceForm";

export default async function EditInvoicePage({
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

  const [clients, projects, serviceItems] = await Promise.all([
    getClientsForInvoice(),
    getProjectsForInvoice(),
    getServiceItems(),
  ]);

  const boundUpdate = updateInvoice.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/invoices/${id}`}
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to {invoice.invoice_number}
        </Link>
        <h1 className="text-xl font-semibold mt-2">Edit Invoice</h1>
      </div>
      <InvoiceForm
        invoice={invoice}
        clients={clients}
        projects={projects}
        serviceItems={serviceItems}
        defaultInvoiceNumber={invoice.invoice_number}
        action={boundUpdate}
      />
    </div>
  );
}
