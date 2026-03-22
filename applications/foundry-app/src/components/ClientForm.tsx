"use client";

import { useActionState } from "react";
import type { Client } from "@/types/database";

const industries = [
  "Restaurant / Food",
  "Retail / E-commerce",
  "Professional Services",
  "Health & Wellness",
  "Real Estate",
  "Construction / Trades",
  "Creative / Design",
  "Technology",
  "Nonprofit",
  "Education",
  "Other",
];

export default function ClientForm({
  client,
  action,
}: {
  client?: Client;
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
          Company Info
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Company Name <span style={{ color: "var(--red)" }}>*</span>
            </label>
            <input
              name="company_name"
              required
              defaultValue={client?.company_name ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Contact Name</label>
            <input
              name="contact_name"
              defaultValue={client?.contact_name ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              name="contact_email"
              type="email"
              defaultValue={client?.contact_email ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              name="contact_phone"
              type="tel"
              defaultValue={client?.contact_phone ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Website</label>
            <input
              name="website"
              type="url"
              placeholder="https://"
              defaultValue={client?.website ?? ""}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Industry</label>
            <select name="industry" defaultValue={client?.industry ?? ""} className="w-full">
              <option value="">Select...</option>
              {industries.map((i) => (
                <option key={i} value={i}>{i}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Status</label>
            <select name="status" defaultValue={client?.status ?? "prospect"} className="w-full">
              <option value="prospect">Prospect</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Brand Kit
        </h2>
        <div>
          <label className="block text-sm font-medium mb-1">Brand Notes</label>
          <textarea
            name="brand_notes"
            rows={3}
            defaultValue={client?.brand_notes ?? ""}
            className="w-full"
            placeholder="Colors, fonts, tone of voice, inspiration links..."
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          Notes
        </h2>
        <textarea
          name="notes"
          rows={4}
          defaultValue={client?.notes ?? ""}
          className="w-full"
          placeholder="Internal notes about this client..."
        />
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving..." : client ? "Update Client" : "Create Client"}
        </button>
      </div>
    </form>
  );
}
