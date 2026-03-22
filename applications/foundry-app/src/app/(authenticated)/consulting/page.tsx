import Link from "next/link";

export default function ConsultingPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Consulting</h1>
        <Link
          href="/consulting/new"
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New Session
        </Link>
      </div>
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        No consulting sessions yet. Start a discovery session with a client.
      </p>
    </div>
  );
}
