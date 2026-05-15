-- ============================================================
-- Invoices History — Save all generated invoices
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table invoices (
  id           uuid primary key default gen_random_uuid(),
  invoice_no   text not null,
  client_name  text,
  client_email text,
  session_type text,
  session_date date,
  total_amount numeric default 0,
  status       text default 'unpaid',
  form_data    jsonb not null,
  items        jsonb,
  bank_details jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

alter table invoices enable row level security;
create policy "Public read invoices"   on invoices for select using (true);
create policy "Public insert invoices" on invoices for insert with check (true);
create policy "Public update invoices" on invoices for update using (true);
create policy "Public delete invoices" on invoices for delete using (true);
