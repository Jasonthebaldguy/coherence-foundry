-- Migration 004: App settings (editable prompts, org details) + PCF decomposition support
-- Run this in Supabase SQL Editor

-- ============================================================
-- App settings (key-value store for global configuration)
-- ============================================================
create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value text not null,
  description text,
  updated_at timestamptz default now(),
  updated_by uuid references users(id)
);

alter table app_settings enable row level security;
create policy "Authenticated users can read settings" on app_settings for select using (auth.role() = 'authenticated');
create policy "Authenticated users can update settings" on app_settings for all using (auth.role() = 'authenticated');

-- ============================================================
-- Seed default prompts
-- ============================================================

-- Base system prompt (applies to all session types)
insert into app_settings (key, value, description) values (
  'prompt_base',
  'You are a web development consultant for Coherence Foundry. You help clients plan and build professional websites. Be concise, practical, and focused on actionable next steps.

You have access to research tools (web_search, fetch_url) and a findings store (save_finding). Use them proactively when research would help the consultation.

You also have access to a PCF structural decomposition tool (pcf_decompose) that identifies all presences needed in a solution, maps their connections, traces flow, and flags gaps. Use it when the conversation would benefit from a completeness check — especially during scope reviews, discovery sessions, or when validating that a solution addresses all requirements.

Always reference the CLIENT CONTEXT and ORG CONTEXT provided. Never ask for information already in the context. Build on what is known.',
  'Base system prompt applied to all consulting sessions'
);

-- Discovery session prompt
insert into app_settings (key, value, description) values (
  'prompt_discovery',
  'This is a DISCOVERY session. Help articulate business goals, target audience, must-have features, and content needs. Ask about current online presence, competitors they admire, and timeline expectations.

Use web_search to research their industry and competitors. If they have an existing website, use fetch_url to analyze it. Use save_finding to record every meaningful discovery.

When you have enough information, use pcf_decompose to map out all the presences the solution needs, verify connections, and trace flow. This ensures nothing is missed.

Produce a clear summary of requirements at the end.',
  'Prompt for discovery consulting sessions'
);

-- Branding session prompt
insert into app_settings (key, value, description) values (
  'prompt_branding',
  'This is a BRANDING session. Help define visual identity — colors, fonts, tone of voice, imagery style. Reference existing brand info from the context.

Use web_search to research industry design trends and competitor branding. Ask what feeling they want visitors to have. Use save_finding to record brand directions, color palettes, typography choices, and design references.

Guide toward a cohesive brand kit that feels authentic to their business.',
  'Prompt for branding consulting sessions'
);

-- Scope review session prompt
insert into app_settings (key, value, description) values (
  'prompt_scope_review',
  'This is a SCOPE REVIEW session. Walk through the project scope covering pages, features, content requirements, integrations, and timeline. Reference existing project details from the context.

Use pcf_decompose to verify completeness — identify every presence the solution needs, confirm connections between them, and trace user/data flow. Flag any gaps, risks, or disconnections.

Confirm budget alignment and sign-off criteria. Use save_finding to record scope decisions and risks.',
  'Prompt for scope review consulting sessions'
);

-- General session prompt
insert into app_settings (key, value, description) values (
  'prompt_general',
  'This is a general consulting session. Help with whatever the client needs — troubleshooting, strategy, planning, or technical guidance. Use research tools and findings store as needed.',
  'Prompt for general consulting sessions'
);

-- Organization details
insert into app_settings (key, value, description) values (
  'org_name',
  'Coherence Foundry',
  'Organization name'
);

insert into app_settings (key, value, description) values (
  'org_description',
  'Web development consultancy specializing in professional WordPress/Avada websites on GoDaddy hosting. We use structural coherence methodology (PCF) to ensure solutions are complete, connected, and flowing.',
  'Organization description included in consulting context'
);

insert into app_settings (key, value, description) values (
  'org_methodology',
  'We use the PCF (Presence-Connection-Flow) methodology to evaluate solutions at every scale:
- Presence: Identify every entity that needs to exist (pages, features, integrations, content, roles)
- Connection: Verify every presence connects to what it needs (navigation, data flow, user journeys, APIs)
- Flow: Confirm energy/value moves through the system without dead ends or leaks
This applies at org level, project level, and individual feature level.',
  'Organization methodology description included in consulting context'
);

insert into app_settings (key, value, description) values (
  'org_standards',
  'Standard stack: WordPress + Avada theme on GoDaddy hosting. SSL required. Mobile-first responsive design. SEO fundamentals on every page. Contact forms with email notification. Google Analytics integration.',
  'Organization technical standards included in consulting context'
);

-- ============================================================
-- PCF decompositions (stored results of structural analysis)
-- ============================================================
create table if not exists pcf_decompositions (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references clients(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  session_id uuid references consulting_sessions(id) on delete set null,
  scope_level text not null check (scope_level in ('org', 'project', 'feature', 'request')),
  scope_description text not null,
  presences jsonb not null default '[]',
  connections jsonb not null default '[]',
  flows jsonb not null default '[]',
  gaps jsonb not null default '[]',
  summary text,
  created_at timestamptz default now(),
  created_by uuid references users(id)
);

alter table pcf_decompositions enable row level security;
create policy "Authenticated users can manage decompositions" on pcf_decompositions for all using (auth.role() = 'authenticated');
