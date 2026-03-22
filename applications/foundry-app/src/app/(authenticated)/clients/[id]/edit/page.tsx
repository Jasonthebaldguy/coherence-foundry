import Link from "next/link";
import { notFound } from "next/navigation";
import { getClient, updateClient } from "@/lib/clients";
import ClientForm from "@/components/ClientForm";

export default async function EditClientPage({
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

  const boundUpdate = updateClient.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/clients/${id}`}
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to {client.company_name}
        </Link>
        <h1 className="text-xl font-semibold mt-2">Edit Client</h1>
      </div>
      <ClientForm client={client} action={boundUpdate} />
    </div>
  );
}
