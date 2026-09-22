# Event Memories

A reusable, mobile-first event memory platform: guests scan a QR code, relive the event through a living photo wall, and share their own photos, videos, and messages — no app or account needed. Organizers moderate everything from a simple dashboard.

First event: **Dancing Through the Decades** — Oscar D. Epps, Sr. 60th Birthday Celebration (September 20, 2026), served at `epps60th.com/memories`.

## Status

Planning. The current live Epps page is a separate static site (`Desktop\EPPS60TH\memories`) and keeps running until this platform replaces it.

## Stack (planned)

- **Frontend:** Next.js (React), hosted on Netlify
- **Backend:** Supabase — Postgres with Row Level Security, Storage, Auth (admins only), Realtime, Edge Functions
- **Supabase project:** Epps 60th Memories (`gcsaoraaphuxvtmnripv`)

## Layout

- `docs/` — architecture, database, storage, roles, and journey specs
- `source-media/` — original assets (stock footage lives here locally; large video files are not committed — see `source-media/stock/LICENSES.md`)

## Security

Never commit keys. The Supabase `service_role` key belongs only in server-side environment variables (Netlify / Supabase secrets), never in browser code or this repo.
