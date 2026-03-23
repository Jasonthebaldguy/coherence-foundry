-- Migration 007: Smart context management + distillation tracking
-- Creates api_usage table (from migration 006 if not yet applied),
-- adds session-type filtering and priority to documents,
-- and call_type to api_usage for distinguishing chat vs distill calls.

-- Create api_usage table if it doesn't exist (migration 006)
create table if not exists public.api_usage (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.consulting_sessions(id) on delete cascade not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  total_tokens integer not null default 0,
  cost_usd numeric(10, 6) not null default 0,
  model text not null default 'claude-sonnet-4-20250514',
  created_at timestamptz not null default now()
);

alter table public.api_usage enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'api_usage' and policyname = 'auth_all') then
    create policy "auth_all" on public.api_usage for all using (auth.uid() is not null);
  end if;
end $$;

create index if not exists idx_api_usage_session on public.api_usage(session_id);
create index if not exists idx_api_usage_created on public.api_usage(created_at);

-- Smart context: session type filtering and priority for documents
alter table public.documents
  add column if not exists relevant_session_types text[] default '{}',
  add column if not exists context_priority integer not null default 50;

-- Usage tracking: distinguish chat vs distill calls
alter table public.api_usage
  add column if not exists call_type text not null default 'chat';

-- Add deliverables and strategy session types
alter table public.consulting_sessions
  drop constraint if exists consulting_sessions_session_type_check;
alter table public.consulting_sessions
  add constraint consulting_sessions_session_type_check
  check (session_type in ('discovery', 'branding', 'scope_review', 'deliverables', 'strategy', 'general'));
