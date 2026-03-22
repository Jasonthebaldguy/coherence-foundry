"use client";

import { useActionState, useState } from "react";
import { upsertGoDaddyAccount } from "@/lib/godaddy";
import { DEFAULT_CHECKLIST } from "@/lib/godaddy-defaults";
import type { GoDaddyAccount, ChecklistItem } from "@/types/database";
import Card from "./Card";

export default function GoDaddyChecklist({
  clientId,
  initial,
}: {
  clientId: string;
  initial: GoDaddyAccount | null;
}) {
  const [items, setItems] = useState<ChecklistItem[]>(
    initial?.checklist_items?.length ? initial.checklist_items : DEFAULT_CHECKLIST
  );
  const [newLabel, setNewLabel] = useState("");

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

  function toggleItem(key: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? { ...item, done: !item.done } : item
      )
    );
  }

  function addItem() {
    const label = newLabel.trim();
    if (!label) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_");
    setItems((prev) => [...prev, { key, label, done: false }]);
    setNewLabel("");
  }

  function removeItem(key: string) {
    setItems((prev) => prev.filter((item) => item.key !== key));
  }

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
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
        <input type="hidden" name="checklist_items" value={JSON.stringify(items)} />

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
          {items.map((item) => (
            <div
              key={item.key}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm group"
              style={{ background: "var(--bg-primary)" }}
            >
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.key)}
                className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
              />
              <span className="flex-1" style={{ textDecoration: item.done ? "line-through" : "none", color: item.done ? "var(--text-muted)" : "var(--text-primary)" }}>
                {item.label}
              </span>
              <button
                type="button"
                onClick={() => removeItem(item.key)}
                className="opacity-0 group-hover:opacity-100 text-xs px-1.5 py-0.5 rounded transition-opacity"
                style={{ color: "var(--red)" }}
                title="Remove step"
              >
                &times;
              </button>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
            placeholder="Add a step..."
            className="flex-1 text-sm"
          />
          <button
            type="button"
            onClick={addItem}
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            + Add
          </button>
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
