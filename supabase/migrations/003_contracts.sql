-- ============================================================
-- Contracts History — Save all generated contracts
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create table contracts (
  id               uuid primary key default gen_random_uuid(),
  ref              text not null,
  client_name      text,
  client_email     text,
  project_type     text,
  event_date       text,
  total_amount     numeric default 0,
  deposit_amount   numeric default 0,
  status           text default 'draft',
  form_data        jsonb not null,
  client_sig       text,
  photographer_sig text,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table contracts enable row level security;
create policy "Public read contracts"   on contracts for select using (true);
create policy "Public insert contracts" on contracts for insert with check (true);
create policy "Public update contracts" on contracts for update using (true);
create policy "Public delete contracts" on contracts for delete using (true);
