# React CMS with MySQL

A small full-stack app: **Vite + React** for the storefront and admin UI, **Express + MySQL** for the API. You can create **pages** (with slug and body text), manage **products**, and **publish** products onto specific pages. Only products marked **published** appear on the public site.

## Prerequisites

- Node.js 18+
- MySQL 8 (or compatible)

## Setup

1. **Clone or open this folder** as your project root.

2. **Create the database** (from the `server` folder, after configuring `.env`):

   ```bash
   cp server/.env.example server/.env
   ```

   Edit `server/.env` with your MySQL credentials, `JWT_SECRET`, and `ADMIN_PASSWORD`.

3. **Apply the schema**:

   ```bash
   npm install
   npm run db:init -w server
   ```

4. **Run API + frontend** (two processes via the root script):

   ```bash
   npm install
   npm run dev
   ```

   - Site: [http://localhost:5173](http://localhost:5173)
   - API: [http://localhost:4000](http://localhost:4000)

   The Vite dev server proxies `/api` to the API.

## Using the admin

1. Open [http://localhost:5173/admin/login](http://localhost:5173/admin/login) and sign in with `ADMIN_PASSWORD`.
2. **Pages**: create pages; each gets a URL like `/p/your-slug`.
3. **Products**: add name, price, optional image URL and description; toggle **Published** when ready for the public.
4. On a page row, click **Products** to choose which products appear on that page and in what order. Save assignments.

Public pages only list products that are both **linked to that page** and **published**.

## Production notes

- Set `NODE_ENV=production`, use a strong `JWT_SECRET`, and serve the built client (`npm run build -w client`) behind your host of choice.
- Set `CLIENT_ORIGIN=https://bearriverquilting.com` on the server (or rely on the production default). This controls Stripe return URLs such as `/customize/success?session_id=…`, cart checkout success, CORS, and email links.
- Use HTTPS so the auth cookie can use `secure: true` (already tied to `NODE_ENV` in the server code).
