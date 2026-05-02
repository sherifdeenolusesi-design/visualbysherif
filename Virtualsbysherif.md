# Visual by Sherif — Website Access Guide

## What Clients See (No Password Needed)

Your clients will see the **full public website** — completely normal, nothing unusual:

**Visible to everyone (no password needed):**
- Home page with slideshow
- Explore → Portfolio, Shop, Journal
- Book, About, FAQ, Contact
- Shop & product pages
- Stripe checkout

**Hidden from everyone except you:**
- Sessions menu (Contract, Invoice, QR, AI Art Studio, etc.)
- Client menu (Gallery, Selection Session)

If a client accidentally types `/sessions/...` or `/gallery` in the URL bar, they get redirected to the password login page — they just can't get past it without the password.

So your clients experience a clean, professional photography website with no trace of your internal tools.

---

## Admin Access (You Only)

Go to: `http://localhost:3000/admin-login`

Password: `sherif2025`

- Sessions and Client menus appear immediately after login
- Stays logged in for **7 days**
- To change the password, edit `ADMIN_PASSWORD` in `.env.local`
