"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { completeSession } from "@/lib/consulting";
import type { ConsultingMessage } from "@/types/database";

interface Usage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
}

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
  const [sessionUsage, setSessionUsage] = useState<Usage>({
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    cost_usd: 0,
  });
  const [lastUsage, setLastUsage] = useState<Usage | null>(null);
  const [distilling, setDistilling] = useState(false);
  const [distillationText, setDistillationText] = useState("");
  const [showDistillation, setShowDistillation] = useState(false);
  const [summaryValue, setSummaryValue] = useState("");
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

        // Track usage
        if (data.usage) {
          setLastUsage(data.usage);
          setSessionUsage((prev) => ({
            input_tokens: prev.input_tokens + data.usage.input_tokens,
            output_tokens: prev.output_tokens + data.usage.output_tokens,
            total_tokens: prev.total_tokens + data.usage.total_tokens,
            cost_usd: Math.round((prev.cost_usd + data.usage.cost_usd) * 10000) / 10000,
          }));
        }
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

  async function handleDistill() {
    if (distilling || messages.length === 0) return;
    setDistilling(true);

    try {
      const res = await fetch("/api/distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });

      const data = await res.json();

      if (data.error) {
        setDistillationText(`Error: ${data.error}`);
      } else {
        setDistillationText(data.distillation);
        if (data.usage) {
          setLastUsage(data.usage);
          setSessionUsage((prev) => ({
            input_tokens: prev.input_tokens + data.usage.input_tokens,
            output_tokens: prev.output_tokens + data.usage.output_tokens,
            total_tokens: prev.total_tokens + data.usage.total_tokens,
            cost_usd: Math.round((prev.cost_usd + data.usage.cost_usd) * 10000) / 10000,
          }));
        }
      }
      setShowDistillation(true);
    } catch {
      setDistillationText("Failed to distill conversation.");
      setShowDistillation(true);
    } finally {
      setDistilling(false);
    }
  }

  function formatTokens(n: number): string {
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return String(n);
  }

  function formatCost(n: number): string {
    if (n < 0.01) return `$${n.toFixed(4)}`;
    return `$${n.toFixed(2)}`;
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 220px)" }}>
      {/* Token usage bar */}
      <div
        className="flex items-center justify-between px-3 py-1.5 mb-2 rounded text-xs"
        style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
      >
        <div className="flex items-center gap-4">
          <span>
            Session: {formatTokens(sessionUsage.total_tokens)} tokens
          </span>
          <span>
            Cost: {formatCost(sessionUsage.cost_usd)}
          </span>
        </div>
        {lastUsage && (
          <div className="flex items-center gap-3">
            <span>
              Last: {formatTokens(lastUsage.input_tokens)} in / {formatTokens(lastUsage.output_tokens)} out
            </span>
            <span>
              {formatCost(lastUsage.cost_usd)}
            </span>
          </div>
        )}
      </div>

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

          {/* Distillation + Complete Session */}
          <div
            className="p-3 rounded-lg border space-y-3"
            style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <button
                onClick={handleDistill}
                disabled={distilling || sending || messages.length === 0}
                className="px-3 py-1.5 rounded-md text-xs font-medium shrink-0"
                style={{
                  background: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                  opacity: distilling || sending || messages.length === 0 ? 0.5 : 1,
                }}
              >
                {distilling ? "Distilling..." : "Distill"}
              </button>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Lossless concept extraction from conversation
              </span>
            </div>

            {showDistillation && distillationText && (
              <div className="space-y-2">
                <div
                  className="p-3 rounded text-xs whitespace-pre-wrap max-h-64 overflow-y-auto"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-primary)" }}
                >
                  {distillationText}
                </div>
                <button
                  onClick={() => {
                    setSummaryValue(distillationText);
                    setShowDistillation(false);
                  }}
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  Use as Summary
                </button>
              </div>
            )}

            <form action={completeAction} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  Session summary (optional)
                </label>
                <textarea
                  name="summary"
                  value={summaryValue}
                  onChange={(e) => setSummaryValue(e.target.value)}
                  placeholder="Brief summary of outcomes... or click Distill to auto-generate"
                  className="w-full text-sm"
                  rows={summaryValue ? 4 : 1}
                  style={{ resize: "vertical" }}
                />
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
        </div>
      ) : (
        <p className="text-sm text-center py-2" style={{ color: "var(--text-muted)" }}>
          This session is complete.
        </p>
      )}
    </div>
  );
}
