-- Migration 003: Research findings, invoice line items, service catalog
-- Run this in Supabase SQL Editor

-- =========================================================================
-- GATE 2: Research findings store
-- =========================================================================

create table if not exists public.research_findings (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete cascade not null,
  session_id uuid references public.consulting_sessions(id) on delete set null,
  finding_type text not null check (finding_type in (
    'competitor', 'industry_trend', 'design_reference', 'color_palette',
    'typography', 'content_pattern', 'technical_requirement', 'audience_insight',
    'brand_direction', 'feature_idea', 'risk', 'opportunity', 'general'
  )),
  title text not null,
  content text not null,
  source_url text,
  metadata jsonb default '{}',
  relevance text check (relevance in ('high', 'medium', 'low')) default 'medium',
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

create index if not exists idx_findings_client on research_findings(client_id);
create index if not exists idx_findings_session on research_findings(session_id);
create index if not exists idx_findings_type on research_findings(finding_type);

alter table research_findings enable row level security;
create policy "Authenticated users can manage findings"
  on research_findings for all using (auth.uid() is not null);

-- =========================================================================
-- GATE 3: Add generated_from to consulting_reports
-- =========================================================================

do $$ begin
  alter table consulting_reports add column generated_from jsonb default '[]';
exception when duplicate_column then null;
end $$;

-- =========================================================================
-- Service Items (reusable line items for invoices)
-- Code references table as "service_items"
-- =========================================================================

create table if not exists public.service_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  default_price numeric(10,2) not null,
  category text check (category in (
    'design', 'development', 'hosting', 'consulting', 'maintenance',
    'content', 'seo', 'training', 'other'
  )) default 'other',
  is_active boolean default true,
  created_by uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table service_items enable row level security;
create policy "Authenticated users can manage service items"
  on service_items for all using (auth.uid() is not null);

-- =========================================================================
-- Invoice Line Items
-- =========================================================================

create table if not exists public.invoice_line_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references public.invoices(id) on delete cascade not null,
  service_item_id uuid references public.service_items(id) on delete set null,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(10,2) not null,
  line_total numeric(10,2) not null default 0,
  sort_order int default 0,
  created_at timestamptz default now()
);

create index if not exists idx_line_items_invoice on invoice_line_items(invoice_id);

alter table invoice_line_items enable row level security;
create policy "Authenticated users can manage line items"
  on invoice_line_items for all using (auth.uid() is not null);

-- =========================================================================
-- Seed common web dev services
-- =========================================================================

insert into service_items (name, description, default_price, category) values
  ('Website Design & Development', 'Custom WordPress/Avada website design and build', 2500.00, 'design'),
  ('Homepage Design', 'Custom homepage layout and design', 500.00, 'design'),
  ('Interior Page Design', 'Standard interior page design and build', 250.00, 'design'),
  ('Logo Design', 'Professional logo design with revisions', 750.00, 'design'),
  ('Brand Kit', 'Colors, fonts, imagery style, tone of voice guide', 500.00, 'design'),
  ('GoDaddy Hosting Setup', 'Domain, hosting, WordPress, SSL, DNS configuration', 150.00, 'hosting'),
  ('Domain Registration', 'Annual domain registration', 20.00, 'hosting'),
  ('SSL Certificate', 'SSL certificate installation and configuration', 50.00, 'hosting'),
  ('Discovery Session', 'Initial discovery and requirements gathering', 200.00, 'consulting'),
  ('Branding Consultation', 'Brand strategy and visual identity session', 300.00, 'consulting'),
  ('Scope Review', 'Project scope review and documentation', 150.00, 'consulting'),
  ('Content Migration', 'Migrate content from existing site', 400.00, 'content'),
  ('SEO Setup', 'On-page SEO, meta tags, sitemap, analytics', 350.00, 'seo'),
  ('Monthly Maintenance', 'WordPress updates, backups, security monitoring', 100.00, 'maintenance'),
  ('Training Session', '1-hour WordPress admin training', 100.00, 'training'),
  ('Avada Theme License', 'Avada theme purchase and installation', 69.00, 'development'),
  ('Plugin Configuration', 'Install and configure WordPress plugins', 75.00, 'development'),
  ('Contact Form Setup', 'Contact form with email notifications', 100.00, 'development'),
  ('E-commerce Setup', 'WooCommerce installation and basic configuration', 500.00, 'development'),
  ('Custom Feature', 'Custom development work (per hour)', 125.00, 'development')
on conflict do nothing;
