# Virtual by Sherif — Setup Guide

## 1. Install Dependencies
```bash
npm install
```

## 2. Configure Environment Variables
Copy the example file and fill in your credentials:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...

NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Set Up Supabase Database
1. Go to your Supabase Dashboard → SQL Editor → New Query
2. Paste the entire contents of `supabase/migrations/001_initial.sql`
3. Click **Run**

## 4. Create Storage Buckets in Supabase
Go to **Storage** in your Supabase Dashboard and create:
- `portfolio` — Public
- `client-galleries` — Private
- `blog` — Public
- `shop` — Public

For each **public** bucket, add a storage policy:
- Policy name: `Public read`
- Operation: `SELECT`
- Target roles: `anon`, `authenticated`

## 5. Run Development Server
```bash
npm run dev
```
Open http://localhost:3000

## 6. Deploy to Vercel
```bash
npm install -g vercel
vercel
```
Add all `.env.local` variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## Project Structure
```
app/
  page.tsx              ← Home
  portfolio/page.tsx    ← Masonry gallery with lightbox
  gallery/
    page.tsx            ← Client gallery lookup
    [slug]/page.tsx     ← Password-protected client gallery
  booking/page.tsx      ← Booking form with date picker
  blog/
    page.tsx            ← Blog listing
    [slug]/page.tsx     ← Blog post
  shop/
    page.tsx            ← Print shop
    [id]/page.tsx       ← Product detail + Stripe checkout
    success/page.tsx    ← Order confirmation
  about/page.tsx        ← Bio + gear list
  contact/page.tsx      ← Contact form
  api/
    booking/route.ts
    contact/route.ts
    gallery/verify/route.ts
    checkout/route.ts

components/
  layout/               ← Navbar, Footer
  portfolio/            ← MasonryGrid, Lightbox
  gallery/              ← GalleryUnlock, PhotoGrid
  booking/              ← BookingForm
  blog/                 ← BlogCard
  shop/                 ← ProductCard, ProductBuySection
  contact/              ← ContactForm

supabase/migrations/    ← SQL schema
```

## Adding Your Content

### Upload Portfolio Photos
1. Go to Supabase Storage → `portfolio` bucket
2. Upload your images
3. Copy the public URL
4. In SQL Editor: `INSERT INTO photos (title, url, category, width, height, order_index) VALUES ('...', '...', 'Portraits', 1200, 800, 1);`

### Create a Client Gallery
```sql
INSERT INTO client_galleries (name, slug, password_hash, description)
VALUES ('Smith Wedding', 'smith-wedding-2024', 'your-password-here', 'Your photos are ready!');
```
Then upload photos to the `client-galleries` bucket and insert rows into `client_gallery_photos`.

### Add a Blog Post
Use the SQL editor or build an admin UI. Content supports HTML.

### Add a Print Product
1. Upload the image to the `shop` bucket
2. Insert into `print_products` with price in **cents** (e.g., `$75.00` = `7500`)
