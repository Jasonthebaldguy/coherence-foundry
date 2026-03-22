import Link from "next/link";
import { notFound } from "next/navigation";
import { getProject, updateProject, getClientsForSelect } from "@/lib/projects";
import ProjectForm from "@/components/ProjectForm";

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const clients = await getClientsForSelect();
  const boundUpdate = updateProject.bind(null, id);

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/projects/${id}`}
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to {project.name}
        </Link>
        <h1 className="text-xl font-semibold mt-2">Edit Project</h1>
      </div>
      <ProjectForm project={project} clients={clients} action={boundUpdate} />
    </div>
  );
}
