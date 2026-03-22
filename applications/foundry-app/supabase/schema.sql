-- =============================================================================
-- Coherence Foundry — Database Schema
-- Run in Supabase SQL editor
-- =============================================================================

-- Users (extends auth.users)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  role text not null default 'admin'
    check (role in ('admin', 'member')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Clients
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  website text,
  industry text,
  notes text,
  status text not null default 'active'
    check (status in ('prospect', 'active', 'inactive', 'archived')),
  brand_colors jsonb,
  brand_fonts jsonb,
  brand_notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- GoDaddy Accounts
create table public.godaddy_accounts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  domain text,
  hosting_plan text,
  godaddy_email text,
  wordpress_installed boolean not null default false,
  avada_installed boolean not null default false,
  ssl_configured boolean not null default false,
  dns_configured boolean not null default false,
  admin_access_granted boolean not null default false,
  handover_complete boolean not null default false,
  setup_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Projects
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  name text not null,
  description text,
  phase text not null default 'discovery'
    check (phase in (
      'discovery', 'branding', 'scope', 'build', 'qa', 'launch', 'handover', 'complete'
    )),
  status text not null default 'active'
    check (status in ('active', 'paused', 'complete', 'archived')),
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  estimated_budget numeric(10,2),
  start_date date,
  target_launch_date date,
  notes text,
  created_by uuid references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  phase text not null default 'build'
    check (phase in (
      'discovery', 'branding', 'scope', 'build', 'qa', 'launch', 'handover'
    )),
  status text not null default 'open'
    check (status in ('open', 'in-progress', 'done', 'blocked', 'parked')),
  priority text not null default 'medium'
    check (priority in ('high', 'medium', 'low')),
  section text default 'Backlog',
  due_date date,
  assignee_id uuid references public.users(id),
  sort_order integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Milestones
create table public.milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete cascade not null,
  name text not null,
  description text,
  phase text not null,
  due_date date,
  completed boolean not null default false,
  completed_at timestamptz,
  invoice_on_complete boolean not null default false,
  sort_order integer default 0,
  created_at timestamptz not null default now()
);

-- Invoices
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  milestone_id uuid references public.milestones(id) on delete set null,
  invoice_number text not null unique,
  invoice_type text not null default 'milestone'
    check (invoice_type in ('consultation', 'deposit', 'milestone', 'final', 'other')),
  description text,
  amount numeric(10,2) not null,
  tax_amount numeric(10,2) default 0,
  total_amount numeric(10,2) not null,
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'canceled')),
  square_invoice_id text unique,
  square_invoice_url text,
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Payments
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  amount numeric(10,2) not null,
  square_payment_id text unique,
  status text not null default 'pending'
    check (status in ('pending', 'completed', 'failed', 'refunded')),
  method text,
  received_at timestamptz,
  created_at timestamptz not null default now()
);

-- Consulting Sessions
create table public.consulting_sessions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  project_id uuid references public.projects(id) on delete set null,
  session_type text not null default 'discovery'
    check (session_type in ('discovery', 'branding', 'scope_review', 'general')),
  status text not null default 'active'
    check (status in ('active', 'complete')),
  title text,
  summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_by uuid references public.users(id)
);

-- Consulting Messages
create table public.consulting_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.consulting_sessions(id) on delete cascade not null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Documents
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  session_id uuid references public.consulting_sessions(id) on delete set null,
  uploaded_by uuid references public.users(id),
  filename text not null,
  storage_path text not null,
  media_type text not null,
  file_size integer,
  doc_type text default 'general'
    check (doc_type in (
      'brand_asset', 'mockup', 'content', 'contract', 'report', 'general'
    )),
  uploaded_at timestamptz not null default now()
);

-- Consulting Reports
create table public.consulting_reports (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.consulting_sessions(id) on delete cascade not null,
  client_id uuid references public.clients(id) on delete cascade not null,
  report_type text not null default 'discovery'
    check (report_type in ('discovery', 'branding', 'scope', 'audit')),
  content text not null,
  created_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security (single-admin model)
-- =============================================================================

alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.godaddy_accounts enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.milestones enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.consulting_sessions enable row level security;
alter table public.consulting_messages enable row level security;
alter table public.documents enable row level security;
alter table public.consulting_reports enable row level security;

-- Authenticated users can access all rows
create policy "auth_all" on public.users for all using (auth.uid() is not null);
create policy "auth_all" on public.clients for all using (auth.uid() is not null);
create policy "auth_all" on public.godaddy_accounts for all using (auth.uid() is not null);
create policy "auth_all" on public.projects for all using (auth.uid() is not null);
create policy "auth_all" on public.tasks for all using (auth.uid() is not null);
create policy "auth_all" on public.milestones for all using (auth.uid() is not null);
create policy "auth_all" on public.invoices for all using (auth.uid() is not null);
create policy "auth_all" on public.payments for all using (auth.uid() is not null);
create policy "auth_all" on public.consulting_sessions for all using (auth.uid() is not null);
create policy "auth_all" on public.consulting_messages for all using (auth.uid() is not null);
create policy "auth_all" on public.documents for all using (auth.uid() is not null);
create policy "auth_all" on public.consulting_reports for all using (auth.uid() is not null);

-- =============================================================================
-- Indexes
-- =============================================================================

create index idx_projects_client on public.projects(client_id);
create index idx_projects_phase on public.projects(phase);
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_status on public.tasks(status);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_project on public.invoices(project_id);
create index idx_invoices_status on public.invoices(status);
create index idx_payments_invoice on public.payments(invoice_id);
create index idx_consulting_sessions_client on public.consulting_sessions(client_id);
create index idx_consulting_messages_session on public.consulting_messages(session_id);
create index idx_documents_project on public.documents(project_id);
create index idx_godaddy_client on public.godaddy_accounts(client_id);
