import Link from "next/link";
import { getSessions } from "@/lib/consulting";
import Badge from "@/components/Badge";

export default async function ConsultingPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const sessions = await getSessions({ status: params.status });

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

      <div className="flex gap-1 mb-4">
        {["all", "active", "complete"].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/consulting" : `/consulting?status=${s}`}
            className="px-3 py-1.5 rounded-md text-xs font-medium capitalize"
            style={{
              background:
                (params.status || "all") === s ? "var(--accent)" : "var(--bg-tertiary)",
              color:
                (params.status || "all") === s ? "#fff" : "var(--text-secondary)",
            }}
          >
            {s}
          </Link>
        ))}
      </div>

      {sessions.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }} className="text-sm mt-8">
          No consulting sessions yet. Start a discovery session with a client.
        </p>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/consulting/${session.id}`}
              className="block p-4 rounded-lg border transition-colors hover:border-[var(--accent)]"
              style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{session.title || "Untitled"}</span>
                  <span className="text-xs ml-2" style={{ color: "var(--text-muted)" }}>
                    {session.clients?.company_name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge value={session.session_type} />
                  <Badge value={session.status} />
                </div>
              </div>
              {session.summary && (
                <p className="text-xs mt-1 line-clamp-1" style={{ color: "var(--text-muted)" }}>
                  {session.summary}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
