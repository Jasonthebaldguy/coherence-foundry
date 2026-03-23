"use client";

import { useActionState } from "react";

const sessionTypes = [
  { value: "discovery", label: "Discovery", desc: "Understand business goals, audience, and requirements" },
  { value: "branding", label: "Branding", desc: "Define visual identity, colors, fonts, and tone" },
  { value: "scope_review", label: "Scope Review", desc: "Review project scope, features, and timeline" },
  { value: "deliverables", label: "Deliverables", desc: "Compile action items, decisions, and commitments from all prior sessions" },
  { value: "strategy", label: "Full Strategy", desc: "Comprehensive strategy built from distilled insights across all sessions" },
  { value: "general", label: "General", desc: "Open-ended consulting conversation" },
] as const;

export default function NewSessionForm({
  clients,
  action,
}: {
  clients: { id: string; company_name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await action(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Something went wrong";
      }
    },
    null
  );

  return (
    <form action={formAction} className="space-y-6 max-w-xl">
      {error && (
        <div className="px-4 py-3 rounded-md text-sm" style={{ background: "var(--red)", color: "#fff" }}>
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Client <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <select name="client_id" required className="w-full">
          <option value="">Select a client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.company_name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Session Type</label>
        <div className="space-y-2">
          {sessionTypes.map((t) => (
            <label
              key={t.value}
              className="flex items-start gap-3 p-3 rounded-lg border cursor-pointer"
              style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
            >
              <input
                type="radio"
                name="session_type"
                value={t.value}
                defaultChecked={t.value === "discovery"}
                className="mt-0.5"
              />
              <div>
                <span className="text-sm font-medium">{t.label}</span>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {t.desc}
                </p>
              </div>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input name="title" placeholder="Optional session title" className="w-full" />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-4 py-2 rounded-md text-sm font-medium text-white"
        style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? "Starting..." : "Start Session"}
      </button>
    </form>
  );
}
