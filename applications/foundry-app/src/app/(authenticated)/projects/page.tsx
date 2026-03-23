import Link from "next/link";
import { getProjects } from "@/lib/projects";
import Badge from "@/components/Badge";
import ProjectSearch from "@/components/ProjectSearch";

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ phase?: string; q?: string }>;
}) {
  const params = await searchParams;
  const projects = await getProjects({
    phase: params.phase,
    search: params.q,
  });

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

      <ProjectSearch />

      {projects.length === 0 ? (
        <p style={{ color: "var(--text-muted)" }} className="text-sm mt-8">
          No projects found. Create a client first, then start a project.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-secondary)" }}>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Project</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Client</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Phase</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Priority</th>
                <th className="text-left px-4 py-2.5 font-medium" style={{ color: "var(--text-secondary)" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-t"
                  style={{ borderColor: "var(--border)" }}
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${project.id}`}
                      className="font-medium hover:underline"
                      style={{ color: "var(--accent)" }}
                    >
                      {project.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3" style={{ color: "var(--text-secondary)" }}>
                    {project.clients?.company_name ?? "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={project.phase} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={project.priority} />
                  </td>
                  <td className="px-4 py-3">
                    <Badge value={project.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
