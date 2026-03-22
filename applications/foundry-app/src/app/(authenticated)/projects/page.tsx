import Link from "next/link";

export default function ProjectsPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold">Projects</h1>
        <Link
          href="/projects/new"
          className="px-3 py-1.5 rounded-md text-sm font-medium text-white"
          style={{ background: "var(--accent)" }}
        >
          + New Project
        </Link>
      </div>
      <p style={{ color: "var(--text-muted)" }} className="text-sm">
        No projects yet. Create a client first, then start a project.
      </p>
    </div>
  );
}
