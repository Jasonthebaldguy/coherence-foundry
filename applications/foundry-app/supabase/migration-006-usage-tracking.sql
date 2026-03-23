-- Migration 006: API usage tracking
-- Track token usage and cost per consulting session

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
create policy "auth_all" on public.api_usage for all using (auth.uid() is not null);

create index idx_api_usage_session on public.api_usage(session_id);
create index idx_api_usage_created on public.api_usage(created_at);
