"use client";

import { useActionState, useState } from "react";
import { createTask, updateTaskStatus, deleteTask } from "@/lib/tasks";
import type { Task, TaskStatus } from "@/types/database";
import Badge from "./Badge";

const columns: { status: TaskStatus; label: string }[] = [
  { status: "open", label: "Open" },
  { status: "in-progress", label: "In Progress" },
  { status: "blocked", label: "Blocked" },
  { status: "done", label: "Done" },
  { status: "parked", label: "Parked" },
];

function AddTaskForm({ projectId }: { projectId: string }) {
  const boundCreate = createTask.bind(null, projectId);
  const [error, formAction, isPending] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await boundCreate(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Failed to add task";
      }
    },
    null
  );

  return (
    <form action={formAction} className="flex gap-2 mb-4">
      <input
        name="name"
        required
        placeholder="Add a task..."
        className="flex-1 text-sm"
      />
      <select name="priority" className="text-sm w-24">
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="low">Low</option>
      </select>
      <button
        type="submit"
        disabled={isPending}
        className="px-3 py-1.5 rounded-md text-xs font-medium text-white shrink-0"
        style={{ background: "var(--accent)", opacity: isPending ? 0.7 : 1 }}
      >
        {isPending ? "..." : "+ Add"}
      </button>
      {error && (
        <span className="text-xs self-center" style={{ color: "var(--red)" }}>
          {error}
        </span>
      )}
    </form>
  );
}

function TaskCard({
  task,
  projectId,
}: {
  task: Task;
  projectId: string;
}) {
  const boundUpdateStatus = updateTaskStatus.bind(null, task.id, projectId);
  const [, statusAction] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await boundUpdateStatus(formData);
        return null;
      } catch {
        return "Failed";
      }
    },
    null
  );

  const boundDelete = deleteTask.bind(null, task.id, projectId);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await boundDelete();
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div
      className="p-3 rounded-md border text-sm group"
      style={{ background: "var(--bg-primary)", borderColor: "var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-medium">{task.name}</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="opacity-0 group-hover:opacity-100 text-xs px-1 transition-opacity shrink-0"
          style={{ color: "var(--red)" }}
          title="Delete task"
        >
          &times;
        </button>
      </div>
      {task.description && (
        <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <Badge value={task.priority} />
        <form action={statusAction} className="ml-auto">
          <select
            name="status"
            defaultValue={task.status}
            onChange={(e) => {
              const form = e.target.closest("form");
              if (form) form.requestSubmit();
            }}
            className="text-xs py-0.5 px-1 border-0"
            style={{ background: "transparent", color: "var(--text-muted)" }}
          >
            {columns.map((c) => (
              <option key={c.status} value={c.status}>
                {c.label}
              </option>
            ))}
          </select>
        </form>
      </div>
    </div>
  );
}

export default function TaskBoard({
  projectId,
  tasks,
}: {
  projectId: string;
  tasks: Task[];
}) {
  return (
    <div>
      <AddTaskForm projectId={projectId} />

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {columns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          return (
            <div key={col.status}>
              <div className="flex items-center gap-2 mb-3">
                <h3
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: "var(--text-muted)" }}
                >
                  {col.label}
                </h3>
                <span
                  className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "var(--bg-tertiary)", color: "var(--text-muted)" }}
                >
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-2 min-h-[60px]">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} projectId={projectId} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
