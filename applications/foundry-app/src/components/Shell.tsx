"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-client";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: "◉" },
  { href: "/clients", label: "Clients", icon: "◎" },
  { href: "/projects", label: "Projects", icon: "◫" },
  { href: "/invoices", label: "Invoices", icon: "▤" },
  { href: "/consulting", label: "Consulting", icon: "◆" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div className="min-h-screen flex">
      <aside
        className="w-56 border-r flex flex-col shrink-0"
        style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}
      >
        <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h1 className="text-sm font-semibold tracking-tight">Coherence Foundry</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Web Development Studio
          </p>
        </div>

        <nav className="flex-1 p-2 space-y-0.5">
          {nav.map(({ href, label, icon }) => {
            const active =
              href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
                style={{
                  background: active ? "var(--bg-tertiary)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-secondary)",
                }}
              >
                <span className="text-xs">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 rounded-md text-sm text-left transition-colors"
            style={{ color: "var(--text-muted)" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
