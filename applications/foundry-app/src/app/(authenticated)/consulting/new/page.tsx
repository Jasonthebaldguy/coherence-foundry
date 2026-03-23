import Link from "next/link";
import { createSession, getClientsForSession } from "@/lib/consulting";
import NewSessionForm from "@/components/NewSessionForm";

export default async function NewSessionPage() {
  const clients = await getClientsForSession();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/consulting"
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to Consulting
        </Link>
        <h1 className="text-xl font-semibold mt-2">New Consulting Session</h1>
      </div>
      <NewSessionForm clients={clients} action={createSession} />
    </div>
  );
}
