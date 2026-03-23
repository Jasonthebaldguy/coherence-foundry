import Link from "next/link";
import ProjectForm from "@/components/ProjectForm";
import { createProject, getClientsForSelect } from "@/lib/projects";

export default async function NewProjectPage() {
  const clients = await getClientsForSelect();

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/projects"
          className="text-sm hover:underline"
          style={{ color: "var(--text-muted)" }}
        >
          &larr; Back to Projects
        </Link>
        <h1 className="text-xl font-semibold mt-2">New Project</h1>
      </div>
      <ProjectForm clients={clients} action={createProject} />
    </div>
  );
}
