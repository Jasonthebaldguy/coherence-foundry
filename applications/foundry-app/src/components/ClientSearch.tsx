"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const statuses = ["all", "active", "prospect", "inactive", "archived"] as const;

export default function ClientSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentStatus = searchParams.get("status") || "all";
  const currentSearch = searchParams.get("q") || "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/clients?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      <div className="flex gap-1">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => update("status", s === "all" ? "" : s)}
            className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-colors"
            style={{
              background:
                currentStatus === s || (s === "all" && !searchParams.get("status"))
                  ? "var(--accent)"
                  : "var(--bg-tertiary)",
              color:
                currentStatus === s || (s === "all" && !searchParams.get("status"))
                  ? "#fff"
                  : "var(--text-secondary)",
            }}
          >
            {s}
          </button>
        ))}
      </div>
      <input
        type="search"
        placeholder="Search clients..."
        defaultValue={currentSearch}
        onChange={(e) => update("q", e.target.value)}
        className="flex-1 max-w-xs"
        style={{ opacity: isPending ? 0.7 : 1 }}
      />
    </div>
  );
}
