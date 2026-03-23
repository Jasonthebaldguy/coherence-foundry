import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession, getMessages } from "@/lib/consulting";
import Badge from "@/components/Badge";
import ChatUI from "@/components/ChatUI";

export default async function ConsultingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let session;
  try {
    session = await getSession(id);
  } catch {
    notFound();
  }

  const messages = await getMessages(id);

  return (
    <div>
      <div className="mb-4">
        <Link
          href="/consulting"
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to Consulting
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <h1 className="text-lg font-semibold">{session.title || "Untitled Session"}</h1>
        <Badge value={session.session_type} />
        <Badge value={session.status} />
        {session.clients?.company_name && (
          <span className="text-sm" style={{ color: "var(--text-muted)" }}>
            {session.clients.company_name}
          </span>
        )}
      </div>

      <ChatUI
        key={id}
        sessionId={id}
        initialMessages={messages}
        isComplete={session.status === "complete"}
        sessionSummary={session.summary}
      />
    </div>
  );
}
