# 01 · Architecture

Status: **draft for review** (2026-09-22)

## What we're building

A reusable event memory platform. Every event gets its own branded experience at `/event/<slug>` where guests relive the celebration (living photo wall, guestbook, slideshow) and add their own photos, videos, and messages without an app or account. Organizers moderate and manage everything from an admin dashboard.

First event: **Dancing Through the Decades** — Oscar D. Epps, Sr. 60th Birthday (`/event/epps60th`, served at `epps60th.com/memories`).

Guiding principle: **SCAN → EXPERIENCE → EXPLORE → REMEMBER → UPLOAD → SHARE → KEEP EXPLORING.** The technology disappears behind the experience.

## System overview

```
 Guest phone / TV / Admin laptop
            │
            ▼
 ┌──────────────────────────────┐
 │  Next.js app (Netlify)       │  Pages rendered on the server for fast first paint
 │  /event/[slug]  experience   │  and rich link previews (iMessage, Facebook).
 │  /event/[slug]/live  TV wall │
 │  /admin  dashboard           │
 └──────────────┬───────────────┘
                │ supabase-js (public anon key only)
                ▼
 ┌──────────────────────────────┐
 │  Supabase                    │
 │  • Postgres + RLS  (data)    │  Public can only READ approved, public content.
 │  • Edge Functions  (writes)  │  Guests can only WRITE through Edge Functions,
 │  • Storage + CDN   (files)   │  which validate and rate-limit, then hand out
 │  • Auth            (admins)  │  one-time signed upload URLs.
 │  • Realtime        (live)    │  New approvals push to the wall and TV instantly.
 └──────────────────────────────┘
```

### Responsibilities

| Layer | Does | Never does |
|---|---|---|
| Browser (guest) | Pick files, shrink photos, make thumbnails, check video length, upload to signed URLs, show progress/retry | Hold secrets; write directly to tables or storage |
| Edge Functions | Validate event is open, limits, file types/sizes, rate limits; create records; issue signed upload URLs; verify uploads; apply moderation mode | Trust anything the browser claims without checking |
| Postgres + RLS | Store everything; decide who can read what; enforce statuses | Let the public see pending/hidden content or contributor emails |
| Storage | Hold originals, web versions, thumbnails, video, posters | Accept files outside the paths the Edge Function signed |
| Admin (signed in) | Moderate, edit, feature, download, configure — scoped to events they manage | Touch events they don't manage |

## Technology choices

| Need | Choice | Why |
|---|---|---|
| Framework | **Next.js (App Router), JavaScript + JSDoc types** | Server rendering for speed and per-event link previews; per-event routes; custom domains later via middleware. Runs on Netlify. |
| Styling | **Tailwind CSS + per-event CSS variables** | Each event's colors/fonts come from the database and are applied as tokens, so nothing is hard-coded to the 60th. |
| Motion | **Motion (Framer Motion)** + CSS | Page transitions, text entrances, parallax, photo-wall drift. All respect `prefers-reduced-motion`. |
| Backend | **Supabase** (existing project *Epps 60th Memories*) | Already set up; Postgres + RLS + Storage + Realtime + Edge Functions in one place. |
| Photo processing | **In the browser** before upload (canvas), verified by Edge Function | Phones upload 0.3–1.5 MB instead of 5–12 MB; fast on cellular; no paid image service needed. |
| Video | Direct upload with length/size limits, poster frame captured in browser | Supabase does not transcode. A transcoding service (Mux / Cloudflare Stream) can be added later if needed. |
| Hosting | **Netlify** (existing account) | Already hosts `epps60th.com`. |
| Source control | GitHub `shaniqua7179/event-memories` (private) | |

## Routes

| URL | Who | Purpose |
|---|---|---|
| `/event/[slug]` | Everyone | The experience: cinematic hero, living wall, featured memories, guestbook teaser, share CTA |
| `/event/[slug]/share` | Guests (QR target) | The share flow (photos, videos, message) |
| `/event/[slug]/gallery` | Everyone | Full wall: flowing collage + masonry, filters (latest, featured, videos, collections), lightbox |
| `/event/[slug]/guestbook` | Everyone | The digital memory book |
| `/event/[slug]/live` | Organizer, on a TV/projector | Auto-rotating photos, videos, messages; new approvals appear instantly |
| `/admin` | Admins | Sign in, list of events |
| `/admin/[slug]/review` | Admins | Fast review queue (approve / hide / reject / feature / crop) |
| `/admin/[slug]/media`, `/messages` | Admins | Search, filter, bulk download, edit |
| `/admin/[slug]/settings`, `/branding`, `/stats` | Admins | Event settings, look & feel, storage and upload stats |

`epps60th.com/memories` will point at `/event/epps60th` via a Netlify rewrite, so the address guests already have keeps working. Custom domains per event can be added later.

## Roles and permissions

| Role | How they get in | Can |
|---|---|---|
| **Visitor** | Opens the link | See the event page and approved, public media/messages; download only where both the event and the contributor allow it |
| **Contributor (guest)** | Types a name (email optional); no account | Everything a visitor can, plus submit photos/videos/messages through Edge Functions while uploads are open. Cannot edit or delete after sending (they can ask the organizer). |
| **Event moderator** | Admin login, added to that event | Review queue, approve/hide/reject/feature, crop, edit captions, download |
| **Event owner** | Admin login, owner of that event | Moderator powers + settings, branding, open/close uploads, delete, add moderators |
| **Platform admin** | You | Everything, across all events; create events |

Guests are recognized by an anonymous device ID stored in their browser, so the site remembers their name, groups their uploads, and applies fair rate limits, still without an account.

## Security model (summary)

1. **No guest writes to tables or storage.** All guest submissions go through Edge Functions using the server-side key. The public anon key can only read approved content.
2. **Row Level Security on every table.** Admin access is checked per event (`is_event_admin(event_id)`), not globally.
3. **Signed, single-use upload URLs** for exact paths the server chose. Guests can't choose file names or locations.
4. **Validation on both sides:** allowed types, sizes, counts, and video length checked in the browser for friendly messages, then re-checked server-side (object size, content type, and the file's first bytes).
5. **Rate limits** per device and per IP, per event.
6. **Contributor emails are never public.** Public views expose only the display name.
7. **The `service_role` key lives only in Edge Function secrets**, never in the browser or the repo.
8. **Audit log** of admin actions (who approved, hid, deleted, or edited what).

Details in [02-database.md](02-database.md) and [03-storage-and-uploads.md](03-storage-and-uploads.md).

## Performance plan

- Wall loads **thumbnails only** (~480 px, ~40–80 KB), in pages of 40, with infinite scroll; full "display" version (~2000 px) loads only in the lightbox.
- Width/height stored for every item so the layout never jumps while images load.
- Supabase Storage CDN with long cache lifetimes; file paths change when an image is edited, so caches never go stale.
- Hero video: phone and desktop versions, each compressed to ~1–2 MB, with a still poster image shown instantly; not loaded at all for reduced-motion or data-saver users.
- Realtime pushes only small change notices; the page fetches the new thumbnail itself.
- Target: first meaningful view under 2.5 s on a typical 4G phone.

## Accessibility

Reduced-motion respected everywhere (the wall stops drifting, transitions become fades). Keyboard and screen-reader support in the lightbox and forms. Large touch targets (≥ 48 px). Text contrast meets WCAG AA over video and photos.

## Plan constraints to decide on

Supabase **Free plan** limits that matter here:

| Limit | Free | Pro ($25/mo) | Impact |
|---|---|---|---|
| Max file size | **50 MB** | up to 500 GB | Ceiling set by Supabase, not a target. **Photos never get near it**: they're shrunk on the phone to ~0.3–1 MB before upload, and the photo bucket's own limit stays small (currently 5 MB). It only matters for **videos**, where it caps clips at roughly 30–45 seconds of 1080p. |
| Storage | 1 GB | 100 GB included | ~1,000 photos fits; videos fill it quickly |
| Inactivity pausing | **Pauses after 7 quiet days** | Never | A memory site that goes quiet for a week would go offline until restored |

**Recommendation:** stay on Free while building. Upgrade to Pro before (a) opening video uploads to guests, or (b) the next live event, so the site can't pause during the "after the event" period that this platform is meant to extend.

## Build roadmap

Follows the 17-step order in the project brief.

| Phase | Steps | Deliverable |
|---|---|---|
| **A. Foundations** | 1–6 | These documents, approved |
| **B. Backend** | 2–4 | New tables, RLS, buckets, Edge Functions applied to Supabase; Epps data copied in; `supabase/` folder committed |
| **C. Design system** | 7 | Tokens, type, motion rules, core components; Dancing Through the Decades theme |
| **D. Experience** | 8 | Event home: cinematic hero, living wall preview, guestbook teaser, share CTA |
| **E. Sharing** | 9 | Share flow: photos, videos, message, progress, retry, confirmation |
| **F. Gallery** | 10 | Flowing collage + masonry, lightbox with swipe, video playback, downloads per permission |
| **G. Guestbook** | 11 | Memory-book presentation of messages |
| **H. Admin** | 12 | Review queue, media and message management, crop, bulk download, settings, branding, stats |
| **I. Live** | 13 | Realtime wall updates and the `/live` TV mode |
| **J. Harden and launch** | 14–17 | Performance pass, real-phone testing, security review, cutover of `epps60th.com/memories`, second-event readiness |
