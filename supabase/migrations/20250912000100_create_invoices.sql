-- Create invoices table
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  filename text not null,
  file_url text not null,
  size bigint not null,
  content_type text not null default 'application/pdf',
  created_at timestamptz not null default now(),
  created_by uuid
);

-- Enable RLS and basic policies
alter table public.invoices enable row level security;

do $$ begin
  create policy invoices_select_auth on public.invoices
    for select to authenticated using (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy invoices_insert_auth on public.invoices
    for insert to authenticated with check (true);
exception when duplicate_object then null; end $$;


