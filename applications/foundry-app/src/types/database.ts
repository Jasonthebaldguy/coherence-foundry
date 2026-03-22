export interface User {
  id: string;
  full_name: string | null;
  role: "admin" | "member";
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  company_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  website: string | null;
  industry: string | null;
  notes: string | null;
  status: "prospect" | "active" | "inactive" | "archived";
  brand_colors: Record<string, string> | null;
  brand_fonts: Record<string, string> | null;
  brand_notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface GoDaddyAccount {
  id: string;
  client_id: string;
  domain: string | null;
  hosting_plan: string | null;
  godaddy_email: string | null;
  wordpress_installed: boolean;
  avada_installed: boolean;
  ssl_configured: boolean;
  dns_configured: boolean;
  admin_access_granted: boolean;
  handover_complete: boolean;
  setup_notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ProjectPhase =
  | "discovery"
  | "branding"
  | "scope"
  | "build"
  | "qa"
  | "launch"
  | "handover"
  | "complete";

export interface Project {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  phase: ProjectPhase;
  status: "active" | "paused" | "complete" | "archived";
  priority: "high" | "medium" | "low";
  estimated_budget: number | null;
  start_date: string | null;
  target_launch_date: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  clients?: Pick<Client, "company_name">;
}

export type TaskStatus = "open" | "in-progress" | "done" | "blocked" | "parked";

export interface Task {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  phase: Exclude<ProjectPhase, "complete">;
  status: TaskStatus;
  priority: "high" | "medium" | "low";
  section: string;
  due_date: string | null;
  assignee_id: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Milestone {
  id: string;
  project_id: string;
  name: string;
  description: string | null;
  phase: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  invoice_on_complete: boolean;
  sort_order: number;
  created_at: string;
}

export type InvoiceStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "paid"
  | "partial"
  | "overdue"
  | "canceled";

export interface Invoice {
  id: string;
  client_id: string;
  project_id: string | null;
  milestone_id: string | null;
  invoice_number: string;
  invoice_type: "consultation" | "deposit" | "milestone" | "final" | "other";
  description: string | null;
  amount: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  square_invoice_id: string | null;
  square_invoice_url: string | null;
  due_date: string | null;
  sent_at: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  clients?: Pick<Client, "company_name">;
  projects?: Pick<Project, "name"> | null;
}

export interface Payment {
  id: string;
  invoice_id: string;
  amount: number;
  square_payment_id: string | null;
  status: "pending" | "completed" | "failed" | "refunded";
  method: string | null;
  received_at: string | null;
  created_at: string;
}

export interface ConsultingSession {
  id: string;
  client_id: string;
  project_id: string | null;
  session_type: "discovery" | "branding" | "scope_review" | "general";
  status: "active" | "complete";
  title: string | null;
  summary: string | null;
  started_at: string;
  completed_at: string | null;
  created_by: string | null;
  // Joined fields
  clients?: Pick<Client, "company_name">;
}

export interface ConsultingMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export interface Document {
  id: string;
  project_id: string | null;
  client_id: string | null;
  session_id: string | null;
  uploaded_by: string | null;
  filename: string;
  storage_path: string;
  media_type: string;
  file_size: number | null;
  doc_type: "brand_asset" | "mockup" | "content" | "contract" | "report" | "general";
  uploaded_at: string;
}

export interface ConsultingReport {
  id: string;
  session_id: string;
  client_id: string;
  report_type: "discovery" | "branding" | "scope" | "audit";
  content: string;
  created_at: string;
}
