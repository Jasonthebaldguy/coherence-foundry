import Link from "next/link";
import { getServiceItems, createServiceItem, updateServiceItem } from "@/lib/invoices";
import Card from "@/components/Card";
import ServiceItemList from "@/components/ServiceItemList";

export default async function ServiceItemsPage() {
  const items = await getServiceItems(false); // include inactive

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
        <h1 className="text-xl font-semibold mt-2">Saved Service Items</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Reusable line items you can add to any invoice.
        </p>
      </div>

      <ServiceItemList
        items={items}
        createAction={createServiceItem}
        updateAction={updateServiceItem}
      />
    </div>
  );
}
