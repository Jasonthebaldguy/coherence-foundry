"use client";

import { useActionState } from "react";
import type { Project } from "@/types/database";

const phases = [
  "discovery", "branding", "scope", "build", "qa", "launch", "handover", "complete",
] as const;

export default function ProjectForm({
  project,
  clients,
  action,
}: {
  project?: Project;
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
    <form action={formAction} className="space-y-6 max-w-2xl">
      {error && (
        <div
          className="px-4 py-3 rounded-md text-sm"
          style={{ background: "var(--red)", color: "#fff" }}
        >
          {error}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Project Details
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Project Name <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              name="name"
              required
              defaultValue={project?.name ?? ""}
              className="w-full"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Client <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <select
              name="client_id"
              required
              defaultValue={project?.client_id ?? ""}
              className="w-full"
            >
              <option value="">Select a client...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phase</label>
            <select name="phase" defaultValue={project?.phase ?? "discovery"} className="w-full">
              {phases.map((p) => (
                <option key={p} value={p} className="capitalize">{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select name="status" defaultValue={project?.status ?? "active"} className="w-full">
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="complete">Complete</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select name="priority" defaultValue={project?.priority ?? "medium"} className="w-full">
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estimated Budget</label>
            <input
              name="estimated_budget"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              defaultValue={project?.estimated_budget ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Date</label>
            <input
              name="start_date"
              type="date"
              defaultValue={project?.start_date ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Target Launch</label>
            <input
              name="target_launch_date"
              type="date"
              defaultValue={project?.target_launch_date ?? ""}
              className="w-full"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Description
        </h2>
        <textarea
          name="description"
          rows={3}
          defaultValue={project?.description ?? ""}
          className="w-full"
          placeholder="What's this project about?"
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Notes
        </h2>
        <textarea
          name="notes"
          rows={3}
          defaultValue={project?.notes ?? ""}
          className="w-full"
          placeholder="Internal notes..."
        />
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving..." : project ? "Update Project" : "Create Project"}
        </button>
      </div>
    </form>
  );
}
