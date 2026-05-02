-- ============================================================
-- Conference Room — Real-time Photo Selection
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Conference sessions
create table conference_sessions (
  id           uuid primary key default gen_random_uuid(),
  session_name text not null,
  photographer_id text,
  client_email text,
  client_name  text,
  status       text not null default 'active'
                 check (status in ('active', 'locked', 'completed')),
  expires_at   timestamptz,
  created_at   timestamptz default now()
);

alter table conference_sessions enable row level security;
create policy "Public read conference sessions"   on conference_sessions for select using (true);
create policy "Public insert conference sessions" on conference_sessions for insert with check (true);
create policy "Public update conference sessions" on conference_sessions for update using (true);

-- Session photos
create table session_photos (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references conference_sessions(id) on delete cascade,
  photo_url    text not null,
  storage_path text,
  filename     text,
  order_index  integer default 0,
  created_at   timestamptz default now()
);

alter table session_photos enable row level security;
create policy "Public read session_photos"   on session_photos for select using (true);
create policy "Public insert session_photos" on session_photos for insert with check (true);
create policy "Public delete session_photos" on session_photos for delete using (true);

-- Photo selections
create table photo_selections (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid references conference_sessions(id) on delete cascade,
  photo_id     uuid references session_photos(id) on delete cascade,
  selected_by  text not null,
  is_favourite boolean default false,
  comment      text,
  selected_at  timestamptz default now(),
  unique(session_id, photo_id)
);

alter table photo_selections enable row level security;
create policy "Public read selections"   on photo_selections for select using (true);
create policy "Public insert selections" on photo_selections for insert with check (true);
create policy "Public update selections" on photo_selections for update using (true);
create policy "Public delete selections" on photo_selections for delete using (true);

-- Enable Realtime for live sync
-- NOTE: Also enable in Supabase Dashboard → Database → Replication
alter publication supabase_realtime add table photo_selections;
alter publication supabase_realtime add table session_photos;
alter publication supabase_realtime add table conference_sessions;

-- ============================================================
-- Storage bucket
-- Create manually in: Supabase Dashboard → Storage
--   Name: "conference-sessions"
--   Public: Yes
-- ============================================================
