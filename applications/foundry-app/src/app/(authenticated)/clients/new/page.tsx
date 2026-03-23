import Link from "next/link";
import ClientForm from "@/components/ClientForm";
import { createClient } from "@/lib/clients";

export default function NewClientPage() {
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
        <h1 className="text-xl font-semibold mt-2">New Client</h1>
      </div>
      <ClientForm action={createClient} />
    </div>
  );
}
