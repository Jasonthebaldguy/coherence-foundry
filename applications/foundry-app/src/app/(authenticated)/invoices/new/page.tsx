import Link from "next/link";
import InvoiceForm from "@/components/InvoiceForm";
import {
  createInvoice,
  getClientsForInvoice,
  getProjectsForInvoice,
  getNextInvoiceNumber,
  getServiceItems,
} from "@/lib/invoices";

export default async function NewInvoicePage() {
  const [clients, projects, nextNumber, serviceItems] = await Promise.all([
    getClientsForInvoice(),
    getProjectsForInvoice(),
    getNextInvoiceNumber(),
    getServiceItems(),
  ]);

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
        <h1 className="text-xl font-semibold mt-2">New Invoice</h1>
      </div>
      <InvoiceForm
        clients={clients}
        projects={projects}
        serviceItems={serviceItems}
        defaultInvoiceNumber={nextNumber}
        action={createInvoice}
      />
    </div>
  );
}
