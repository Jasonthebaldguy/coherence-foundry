"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { completeSession } from "@/lib/consulting";
import type { ConsultingMessage } from "@/types/database";

export default function ChatUI({
  sessionId,
  initialMessages,
  isComplete,
}: {
  sessionId: string;
  initialMessages: ConsultingMessage[];
  isComplete: boolean;
}) {
  const [messages, setMessages] = useState(
    initialMessages.filter((m) => m.role !== "system")
  );
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const boundComplete = completeSession.bind(null, sessionId);
  const [completeError, completeAction, completing] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await boundComplete(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed";
      }
    },
    null
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), session_id: sessionId, role: "user", content: text, created_at: new Date().toISOString() },
    ]);
    setSending(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), session_id: sessionId, role: "assistant", content: `Error: ${data.error}`, created_at: new Date().toISOString() },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), session_id: sessionId, role: "assistant", content: data.reply, created_at: new Date().toISOString() },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), session_id: sessionId, role: "assistant", content: "Failed to get a response. Please try again.", created_at: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
      <div
        className="flex-1 overflow-y-auto space-y-4 p-4 rounded-lg border mb-4"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        {messages.length === 0 && (
          <p className="text-sm text-center py-8" style={{ color: "var(--text-muted)" }}>
            Start the conversation by typing a message below.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className="max-w-[80%] px-4 py-2.5 rounded-lg text-sm whitespace-pre-wrap"
              style={{
                background: msg.role === "user" ? "var(--accent)" : "var(--bg-tertiary)",
                color: msg.role === "user" ? "#fff" : "var(--text-primary)",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div
              className="px-4 py-2.5 rounded-lg text-sm"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
            >
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!isComplete ? (
        <div className="space-y-3">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={sending}
              className="flex-1"
              style={{ opacity: sending ? 0.7 : 1 }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="px-4 py-2 rounded-md text-sm font-medium text-white shrink-0"
              style={{ background: "var(--accent)", opacity: sending || !input.trim() ? 0.5 : 1 }}
            >
              Send
            </button>
          </form>
          <form action={completeAction} className="flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                Session summary (optional)
              </label>
              <input name="summary" placeholder="Brief summary of outcomes..." className="w-full text-sm" />
            </div>
            <button
              type="submit"
              disabled={completing}
              className="px-3 py-2 rounded-md text-xs font-medium shrink-0"
              style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
            >
              {completing ? "..." : "Complete Session"}
            </button>
          </form>
          {completeError && (
            <p className="text-xs" style={{ color: "var(--red)" }}>{completeError}</p>
          )}
        </div>
      ) : (
        <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>
          This session is complete.
        </p>
      )}
    </div>
  );
}
