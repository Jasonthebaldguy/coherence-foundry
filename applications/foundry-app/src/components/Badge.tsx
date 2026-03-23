const colorMap: Record<string, { bg: string; text: string }> = {
  // Status
  active: { bg: "var(--green)", text: "#fff" },
  prospect: { bg: "var(--yellow)", text: "#fff" },
  inactive: { bg: "var(--text-muted)", text: "#fff" },
  archived: { bg: "var(--border)", text: "var(--text-secondary)" },
  paused: { bg: "var(--orange)", text: "#fff" },
  complete: { bg: "var(--green)", text: "#fff" },
  // Priority
  high: { bg: "var(--red)", text: "#fff" },
  medium: { bg: "var(--yellow)", text: "#fff" },
  low: { bg: "var(--border)", text: "var(--text-secondary)" },
  // Task status
  open: { bg: "var(--accent-light)", text: "var(--accent)" },
  "in-progress": { bg: "var(--yellow)", text: "#fff" },
  done: { bg: "var(--green)", text: "#fff" },
  blocked: { bg: "var(--red)", text: "#fff" },
  parked: { bg: "var(--text-muted)", text: "#fff" },
  // Invoice status
  draft: { bg: "var(--border)", text: "var(--text-secondary)" },
  sent: { bg: "var(--accent)", text: "#fff" },
  viewed: { bg: "var(--accent)", text: "#fff" },
  paid: { bg: "var(--green)", text: "#fff" },
  partial: { bg: "var(--yellow)", text: "#fff" },
  overdue: { bg: "var(--red)", text: "#fff" },
  canceled: { bg: "var(--text-muted)", text: "#fff" },
  // Phases
  discovery: { bg: "#9775fa", text: "#fff" },
  branding: { bg: "#f783ac", text: "#fff" },
  scope: { bg: "#4dabf7", text: "#fff" },
  build: { bg: "var(--accent)", text: "#fff" },
  qa: { bg: "var(--orange)", text: "#fff" },
  launch: { bg: "var(--green)", text: "#fff" },
  handover: { bg: "#20c997", text: "#fff" },
};

export default function Badge({ value }: { value: string }) {
  const colors = colorMap[value] ?? {
    bg: "var(--border)",
    text: "var(--text-secondary)",
  };
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
      style={{ background: colors.bg, color: colors.text }}
    >
      {value}
    </span>
  );
}
