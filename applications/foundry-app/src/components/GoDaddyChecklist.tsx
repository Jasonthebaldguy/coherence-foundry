"use client";

import { useActionState } from "react";
import { upsertGoDaddyAccount } from "@/lib/godaddy";
import type { GoDaddyAccount } from "@/types/database";
import Card from "./Card";

const checklistItems: { key: keyof GoDaddyAccount; label: string }[] = [
  { key: "wordpress_installed", label: "WordPress Installed" },
  { key: "avada_installed", label: "Avada Theme Installed" },
  { key: "ssl_configured", label: "SSL Certificate Configured" },
  { key: "dns_configured", label: "DNS Configured" },
  { key: "admin_access_granted", label: "Admin Access Granted to Client" },
  { key: "handover_complete", label: "Handover Complete" },
];

export default function GoDaddyChecklist({
  clientId,
  initial,
}: {
  clientId: string;
  initial: GoDaddyAccount | null;
}) {
  const boundAction = upsertGoDaddyAccount.bind(null, clientId);

  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await boundAction(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed to save";
      }
    },
    null
  );

  const completed = initial
    ? checklistItems.filter((item) => initial[item.key] === true).length
    : 0;
  const total = checklistItems.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          GoDaddy Hosting Setup
        </h2>
        <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
          {completed}/{total} complete
        </span>
      </div>

      <div
        className="h-2 rounded-full mb-4 overflow-hidden"
        style={{ background: "var(--bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            background: pct === 100 ? "var(--green)" : "var(--accent)",
          }}
        />
      </div>

      {error && (
        <div
          className="px-3 py-2 rounded-md text-sm mb-4"
          style={{ background: "var(--red)", color: "#fff" }}
        >
          {error}
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Domain
            </label>
            <input
              name="domain"
              placeholder="example.com"
              defaultValue={initial?.domain ?? ""}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              Hosting Plan
            </label>
            <input
              name="hosting_plan"
              placeholder="Economy, Deluxe..."
              defaultValue={initial?.hosting_plan ?? ""}
              className="w-full text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
              GoDaddy Email
            </label>
            <input
              name="godaddy_email"
              type="email"
              defaultValue={initial?.godaddy_email ?? ""}
              className="w-full text-sm"
            />
          </div>
        </div>

        <div className="space-y-2">
          {checklistItems.map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer"
              style={{ background: "var(--bg-primary)" }}
            >
              <input
                type="checkbox"
                name={key}
                defaultChecked={initial ? (initial[key] as boolean) : false}
                className="w-4 h-4 accent-[var(--accent)]"
              />
              {label}
            </label>
          ))}
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: "var(--text-muted)" }}>
            Setup Notes
          </label>
          <textarea
            name="setup_notes"
            rows={2}
            defaultValue={initial?.setup_notes ?? ""}
            className="w-full text-sm"
            placeholder="Any notes about the hosting setup..."
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving..." : "Save Hosting Setup"}
        </button>
      </form>
    </Card>
  );
}
