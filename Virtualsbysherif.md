# Visual by Sherif — Website Guide

---

## Live Website

- **Domain:** `visualbysherif.com` / `www.visualbysherif.com`
- **Hosting:** Vercel — project `visualbysherif-2026`
- **GitHub:** https://github.com/sherifdeenolusesi-design/visualbysherif

---

## Admin Access (You Only)

Go to: `https://visualbysherif.com/admin-login`

Password: `sherif2025`

- Sessions and Client menus appear immediately after login
- Stays logged in for **7 days**
- To change the password: go to Vercel → Settings → Environment Variables → edit `ADMIN_PASSWORD`

---

## What Clients See (No Password Needed)

**Visible to everyone:**
- Home page with slideshow
- Explore → Portfolio, Shop, Blog
- Book, About, FAQ, Contact
- Shop & product pages
- Stripe checkout

**Hidden from public (admin only):**
- Sessions menu (Contract, Invoice, QR, AI Art Studio, AI Photo Studio, etc.)
- Client menu (Gallery, Selection Session)

---

## DNS Configuration (Namecheap)

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | @ | 76.76.21.21 | 30 min |
| CNAME Record | www | cname.vercel-dns.com | 30 min |

Nameservers: **Namecheap BasicDNS**

---

## Vercel Environment Variables

| Key | Description |
|-----|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase admin key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe public key |
| `OPENAI_API_KEY` | OpenAI API key |
| `REPLICATE_API_TOKEN` | Replicate API token |
| `ADMIN_PASSWORD` | sherif2025 |
| `ADMIN_TOKEN` | vbs-sherif-admin-2025-xk9 |
| `NEXT_PUBLIC_SITE_URL` | https://visualbysherif.com |

---

## Sessions Tools (Admin Only)

| Tool | URL |
|------|-----|
| Contract Generator | /sessions/contract |
| Invoice Generator | /sessions/invoice |
| Deposit Invoice | /sessions/deposit |
| Travel Quote | /sessions/travel-quote |
| Event Quote | /sessions/event-quote |
| QR Code Generator | /sessions/qr-generator |
| AI Art Studio | /sessions/art-generator |
| AI Photo Studio | /sessions/photo-studio |

---

## Deploying Updates

Any time you make changes, run in terminal:
```
cd c:\visualsbysherif
git add .
git commit -m "describe your change"
git push
```
Vercel auto-deploys within 2 minutes.
