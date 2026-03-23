"use client";

import { useState, useTransition } from "react";
import type { ServiceItem } from "@/types/database";

const categories = ["setup", "hosting", "design", "development", "support", "other"];

export default function ServiceItemList({
  items: initialItems,
  createAction,
  updateAction,
}: {
  items: ServiceItem[];
  createAction: (formData: FormData) => Promise<void>;
  updateAction: (id: string, formData: FormData) => Promise<void>;
}) {
  const [items, setItems] = useState(initialItems);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = (formData: FormData) => {
    startTransition(async () => {
      await createAction(formData);
      // Optimistic: add to list
      const newItem: ServiceItem = {
        id: crypto.randomUUID(),
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        default_price: Number(formData.get("default_price")) || 0,
        category: (formData.get("category") as string) || null,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setItems((prev) => [...prev, newItem]);
      setShowForm(false);
    });
  };

  const handleUpdate = (id: string, formData: FormData) => {
    startTransition(async () => {
      await updateAction(id, formData);
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                name: formData.get("name") as string,
                description: (formData.get("description") as string) || null,
                default_price: Number(formData.get("default_price")) || 0,
                category: (formData.get("category") as string) || null,
                is_active: formData.get("is_active") !== "false",
              }
            : item
        )
      );
      setEditId(null);
    });
  };

  const toggleActive = (item: ServiceItem) => {
    const fd = new FormData();
    fd.set("name", item.name);
    fd.set("description", item.description || "");
    fd.set("default_price", String(item.default_price));
    fd.set("category", item.category || "");
    fd.set("is_active", item.is_active ? "false" : "true");
    handleUpdate(item.id, fd);
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setShowForm(!showForm); setEditId(null); }}
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          {showForm ? "Cancel" : "+ New Service Item"}
        </button>
      </div>

      {showForm && (
        <div
          className="border rounded-lg p-4"
          style={{ borderColor: "var(--border)", background: "var(--bg-secondary)" }}
        >
          <ServiceItemForm onSubmit={handleCreate} isPending={isPending} />
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No service items yet. Create one to use in invoices.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Name</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Category</th>
                <th className="text-right px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Default Price</th>
                <th className="text-center px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Active</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr
                  key={item.id}
                  className="border-t"
                  style={{
                    borderColor: "var(--border)",
                    opacity: item.is_active ? 1 : 0.5,
                  }}
                >
                  {editId === item.id ? (
                    <td colSpan={5} className="p-4" style={{ background: "var(--bg-secondary)" }}>
                      <ServiceItemForm
                        item={item}
                        onSubmit={(fd) => handleUpdate(item.id, fd)}
                        onCancel={() => setEditId(null)}
                        isPending={isPending}
                      />
                    </td>
                  ) : (
                    <>
                      <td className="px-4 py-3">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 capitalize" style={{ color: "var(--text-secondary)" }}>
                        {item.category || "\u2014"}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${Number(item.default_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleActive(item)}
                          className="text-xs"
                          style={{ color: item.is_active ? "var(--green)" : "var(--text-muted)" }}
                        >
                          {item.is_active ? "✓ Yes" : "✕ No"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => { setEditId(item.id); setShowForm(false); }}
                          className="text-xs hover:underline"
                          style={{ color: "var(--accent)" }}
                        >
                          Edit
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ServiceItemForm({
  item,
  onSubmit,
  onCancel,
  isPending,
}: {
  item?: ServiceItem;
  onSubmit: (formData: FormData) => void;
  onCancel?: () => void;
  isPending: boolean;
}) {
  return (
    <form
      action={onSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      <div>
        <label className="block text-xs font-medium mb-1">
          Name <span style={{ color: "var(--red)" }}>*</span>
        </label>
        <input
          name="name"
          required
          defaultValue={item?.name ?? ""}
          className="w-full text-sm"
          placeholder="e.g., WordPress Setup"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Default Price</label>
        <input
          name="default_price"
          type="number"
          step="0.01"
          min="0"
          defaultValue={item?.default_price ?? ""}
          className="w-full text-sm"
          placeholder="0.00"
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Category</label>
        <select
          name="category"
          defaultValue={item?.category ?? ""}
          className="w-full text-sm"
        >
          <option value="">None</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Description</label>
        <input
          name="description"
          defaultValue={item?.description ?? ""}
          className="w-full text-sm"
          placeholder="Optional details"
        />
      </div>
      <div className="sm:col-span-2 flex gap-2 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="px-3 py-1.5 rounded-md text-xs font-medium text-white"
          style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? "Saving..." : item ? "Update" : "Add Service Item"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 rounded-md text-xs font-medium"
            style={{ background: "var(--bg-tertiary)", color: "var(--text-secondary)" }}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
