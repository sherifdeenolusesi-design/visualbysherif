-- ============================================================
-- Virtual by Sherif — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Portfolio photos
create table photos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  url          text not null,
  category     text not null default 'Uncategorized',
  width        integer default 1200,
  height       integer default 800,
  order_index  integer default 0,
  created_at   timestamptz default now()
);

alter table photos enable row level security;
create policy "Anyone can view photos" on photos for select using (true);
create policy "Service role can manage photos" on photos using (auth.role() = 'service_role');

-- Client galleries
create table client_galleries (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  cover_image   text,
  password_hash text not null,  -- store plain or hashed password
  expires_at    timestamptz,
  created_at    timestamptz default now()
);

alter table client_galleries enable row level security;
create policy "Anyone can view gallery metadata" on client_galleries for select using (true);
create policy "Service role can manage galleries" on client_galleries using (auth.role() = 'service_role');

-- Client gallery photos (private — served only after password verification)
create table client_gallery_photos (
  id          uuid primary key default gen_random_uuid(),
  gallery_id  uuid references client_galleries(id) on delete cascade,
  url         text not null,
  filename    text not null,
  size_bytes  bigint default 0,
  created_at  timestamptz default now()
);

alter table client_gallery_photos enable row level security;
create policy "Service role can manage gallery photos" on client_gallery_photos using (auth.role() = 'service_role');

-- Blog posts
create table blog_posts (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text not null unique,
  content      text not null default '',
  excerpt      text not null default '',
  cover_image  text,
  published    boolean default false,
  published_at timestamptz,
  tags         text[] default '{}',
  created_at   timestamptz default now()
);

alter table blog_posts enable row level security;
create policy "Anyone can view published posts" on blog_posts for select using (published = true);
create policy "Service role can manage posts" on blog_posts using (auth.role() = 'service_role');

-- Booking requests
create table bookings (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text,
  session_type   text not null,
  preferred_date date not null,
  message        text,
  status         text not null default 'pending'
                   check (status in ('pending', 'confirmed', 'cancelled')),
  created_at     timestamptz default now()
);

alter table bookings enable row level security;
create policy "Anyone can submit a booking" on bookings for insert with check (true);
create policy "Service role can manage bookings" on bookings using (auth.role() = 'service_role');

-- Contact messages
create table contacts (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  created_at timestamptz default now()
);

alter table contacts enable row level security;
create policy "Anyone can submit contact" on contacts for insert with check (true);
create policy "Service role can manage contacts" on contacts using (auth.role() = 'service_role');

-- Print products
create table print_products (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text not null default '',
  price           integer not null,  -- in cents (e.g. 7500 = $75.00)
  image_url       text not null,
  category        text not null default 'Fine Art',
  sizes           text[] not null default '{}',
  stock           integer not null default 0,
  stripe_price_id text,
  created_at      timestamptz default now()
);

alter table print_products enable row level security;
create policy "Anyone can view products" on print_products for select using (true);
create policy "Service role can manage products" on print_products using (auth.role() = 'service_role');

-- Orders
create table orders (
  id                uuid primary key default gen_random_uuid(),
  customer_name     text not null,
  customer_email    text not null,
  product_id        uuid references print_products(id),
  size              text not null,
  quantity          integer not null default 1,
  total             integer not null,  -- in cents
  status            text not null default 'pending'
                      check (status in ('pending', 'paid', 'shipped', 'delivered')),
  stripe_session_id text,
  created_at        timestamptz default now()
);

alter table orders enable row level security;
create policy "Service role can manage orders" on orders using (auth.role() = 'service_role');

-- ============================================================
-- Storage buckets
-- Create these manually in: Supabase Dashboard → Storage
-- ============================================================
-- 1. "portfolio"       — Public bucket (portfolio photos)
-- 2. "client-galleries"— Private bucket (client photos)
-- 3. "blog"            — Public bucket (blog cover images)
-- 4. "shop"            — Public bucket (product images)
--
-- For the portfolio bucket, add a public policy:
--   Name: "Public read"
--   Allowed operation: SELECT
--   Target roles: anon, authenticated
-- ============================================================

-- Sample data — delete before going live
insert into photos (title, description, url, category, width, height, order_index) values
  ('Golden Hour Portrait', 'Shot at sunset in the park', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800', 'Portraits', 800, 1200, 1),
  ('City Lights', null, 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800', 'Landscape', 1200, 800, 2),
  ('Wedding Moment', 'First dance captured', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800', 'Events', 1200, 800, 3);

insert into blog_posts (title, slug, content, excerpt, published, published_at, tags) values
  ('5 Tips for Golden Hour Photography',
   'golden-hour-tips',
   '<p>Golden hour is the magical window just after sunrise and before sunset...</p><p>Here are my top five tips to make the most of this beautiful light.</p>',
   'Make the most of the most beautiful light of the day with these essential tips.',
   true,
   now(),
   array['Tips', 'Lighting']);

insert into print_products (title, description, price, image_url, category, sizes, stock) values
  ('City at Dusk',
   'A stunning cityscape captured at dusk, printed on museum-quality archival paper.',
   7500,
   'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800',
   'Landscape',
   array['8x10"', '11x14"', '16x20"', '24x30"'],
   25);
