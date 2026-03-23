"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

const phases = [
  "all", "discovery", "branding", "scope", "build", "qa", "launch", "handover", "complete",
] as const;

export default function ProjectSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentPhase = searchParams.get("phase") || "all";
  const currentSearch = searchParams.get("q") || "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    startTransition(() => {
      router.push(`/projects?${params.toString()}`);
    });
  }

  return (
    <div className="flex flex-col gap-3 mb-4">
      <div className="flex gap-1 flex-wrap">
        {phases.map((p) => (
          <button
            key={p}
            onClick={() => update("phase", p === "all" ? "" : p)}
            className="px-2.5 py-1 rounded-md text-xs font-medium capitalize transition-colors"
            style={{
              background:
                currentPhase === p || (p === "all" && !searchParams.get("phase"))
                  ? "var(--accent)"
                  : "var(--bg-tertiary)",
              color:
                currentPhase === p || (p === "all" && !searchParams.get("phase"))
                  ? "#fff"
                  : "var(--text-secondary)",
            }}
          >
            {p}
          </button>
        ))}
      </div>
      <input
        type="search"
        placeholder="Search projects..."
        defaultValue={currentSearch}
        onChange={(e) => update("q", e.target.value)}
        className="max-w-xs"
        style={{ opacity: isPending ? 0.7 : 1 }}
      />
    </div>
  );
}
