-- Migration 005: Document context integration
-- Adds AI context toggle and text extraction to documents

-- Add context fields to documents
alter table public.documents
  add column if not exists include_in_context boolean not null default false,
  add column if not exists extracted_text text,
  add column if not exists description text;

-- Index for quickly finding context documents per client
create index if not exists idx_documents_client_context
  on public.documents(client_id) where include_in_context = true;

-- Create storage bucket for document uploads
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

-- Allow authenticated users to upload/read documents
create policy "auth_upload" on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid() is not null);

create policy "auth_read" on storage.objects for select
  using (bucket_id = 'documents' and auth.uid() is not null);

create policy "auth_delete" on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid() is not null);
