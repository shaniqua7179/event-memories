# 02 · Database

Status: **draft for review** (2026-09-22). This is the design; the real SQL will live in `supabase/migrations/` once approved.

## Entity map

```
platform_admins ─┐
                 │
events ──1:1── event_settings
   │   └─1:1── event_branding
   │
   ├──< event_admins >── auth.users (admins only)
   │
   ├──< contributors            (guests: display name, optional email, device id)
   │        │
   │        └──< submissions    (one "Share a Memory" = one submission)
   │                 │
   │                 ├──< media      (each photo / video)
   │                 └──< messages   (guestbook note, optional)
   │
   ├──< media ──< comments      (optional per event)
   ├──< collections ──< collection_media >── media   (phase 2)
   ├──< upload_attempts         (rate limiting)
   └──< audit_log               (admin actions)
```

## Tables

Types are Postgres. Every table has RLS enabled. `id` is `uuid default gen_random_uuid()` unless noted; every table has `created_at timestamptz default now()`.

### `events`
| Column | Type | Notes |
|---|---|---|
| id | uuid | |
| slug | text unique | URL key, e.g. `epps60th` (lowercase letters, numbers, dashes) |
| name | text | "Dancing Through the Decades" |
| honoree | text | "Oscar D. Epps, Sr." |
| occasion | text | "60th Birthday Celebration" |
| event_type | text | birthday, wedding, anniversary, church, conference, corporate, reunion, graduation, gala, other |
| starts_at / ends_at | timestamptz | |
| timezone | text | e.g. `America/Chicago` |
| status | text | `draft` (admins only) · `live` · `archived` (read-only memory site) · `disabled` (offline) |
| custom_domain | text null | later |

### `event_settings` (1:1 with events)
| Column | Default | Notes |
|---|---|---|
| moderation_mode | `approval` | `approval` = everything waits for review · `auto` = publish immediately (admins can still hide) |
| uploads_open | true | Master switch for new submissions |
| uploads_close_at | null | Optional automatic close |
| allow_photos / allow_videos / allow_messages | true / false / true | Videos off until the Pro plan decision |
| allow_comments | false | Comments on photos (the current site has them) |
| downloads_enabled | true | **Global override**: when false, no download buttons anywhere, regardless of contributor choice |
| max_files_per_submission | 30 | |
| max_photo_source_mb | 40 | Largest original a phone may pick (it's shrunk before upload) |
| max_video_seconds | 60 | |
| max_video_mb | 50 | Cannot exceed the plan's file limit |
| display_px / thumb_px | 2000 / 480 | Web sizes |
| keep_high_res | false | Also store a ~4000 px copy for downloads/printing |
| slideshow_seconds | 6 | |
| wall_style | `flow` | `flow` (drifting collage) · `masonry` · `grid` |
| require_email | false | Email always optional unless the organizer turns this on |

### `event_branding` (1:1 with events)
Colors (background, surface, accent, text, heading, muted) and fonts (display, UI) as JSON; logo, hero video (phone and desktop), hero poster, and background media paths; headline, welcome message, upload instructions, thank-you message; hashtags; help phone and email; social share caption and link-preview image.

### `platform_admins`
`user_id uuid pk → auth.users`. You. Can create events and manage all of them.

### `event_admins`
`event_id`, `user_id`, `role` (`owner` | `moderator`). Primary key (event_id, user_id).

### `contributors`
| Column | Notes |
|---|---|
| event_id | |
| display_name | 1–60 chars; shown publicly |
| email | optional; **never publicly readable** |
| device_id_hash | SHA-256 of the anonymous ID stored in the guest's browser; groups uploads and enforces limits |
| blocked | admin can block a spammer |

### `submissions`
One tap of "Share" = one submission. Groups everything a guest sent at once.

| Column | Notes |
|---|---|
| event_id, contributor_id | |
| display_name | copied from contributor at send time, so public reads never touch the contributors table |
| caption | optional words applied to the photos in this submission |
| allow_download | guest's choice: "Allow others to download" |
| show_publicly | guest's choice: "Show in the public gallery" (if false, only organizers see it) |
| state | `open` (uploading) · `complete` · `abandoned` |
| ip_hash, user_agent | abuse investigation only; not public |

### `media`
| Column | Notes |
|---|---|
| event_id, submission_id, contributor_id | |
| kind | `photo` · `video` |
| status | `uploading` · `pending` · `approved` · `hidden` · `rejected` |
| featured | boolean; only meaningful when approved |
| display_name, caption | denormalized for fast public reads; caption editable per item |
| allow_download, show_publicly | per-item copy of the guest's choices (admin can tighten; can't loosen beyond the guest's choice) |
| width, height, duration_ms, bytes, mime | |
| taken_at | from photo metadata when available, for "the night in order" sorting |
| sha256 | duplicate detection within an event |
| original_path, display_path, thumb_path, poster_path, highres_path | storage paths (see storage doc) |
| edit_version, pre_edit_display_path | crop/rotate history; the guest's original is never overwritten |
| approved_at, reviewed_at, reviewed_by | |
| sort_key | defaults to approved_at; lets organizers pin or reorder |

Indexes: `(event_id, status, show_publicly, sort_key desc, id)` for the public wall; `(event_id, status, created_at)` for the review queue; unique `(event_id, sha256)`.

### `messages` (guestbook)
`event_id`, `contributor_id`, `submission_id` (null if sent without photos), `display_name`, `body` (1–2000 chars), `kind` (`wish` · `memory` · `thanks` · `funny` · `other`), `status`, `featured`, `reviewed_*`. A message can be shown next to the photos from the same submission.

### `comments` (optional, per event)
`media_id`, `contributor_id`, `display_name`, `body` (≤ 500), `status`, `reviewed_*`.

### `collections` / `collection_media` (phase 2)
Organizer-made groupings ("Grand Entrance", "The Dance Floor", "Speeches"), with order.

### `upload_attempts`
`event_id`, `device_id_hash`, `ip_hash`, `files`, `bytes`, `created_at`. Read only by Edge Functions to enforce limits (defaults below). Old rows purged after 30 days.

### `audit_log`
`event_id`, `actor_user_id`, `action` (approve, hide, reject, feature, delete, edit, settings…), `target_type`, `target_id`, `details jsonb`, `created_at`.

## Status rules

- Guest submission arrives → media/messages created as `uploading`; after verification they become `pending` (approval mode) or `approved` (auto mode).
- **Featured** is a flag, not a status, so "featured" always implies "approved"; un-approving clears it.
- `hidden` = off the site, can be restored. `rejected` = off the site and files scheduled for deletion after 30 days.
- A database trigger enforces these (guests can never set status; only the verify step or an admin can).

## Row Level Security

Helper functions (security definer, fixed `search_path`, not callable as RPC by anon unless noted):

- `is_platform_admin()` → caller is in `platform_admins`
- `is_event_admin(event_id, min_role default 'moderator')` → platform admin or listed in `event_admins`
- `event_is_public(event_id)` → event status is `live` or `archived`

| Table | Public (anon) | Admins |
|---|---|---|
| events, event_branding | read if `event_is_public` | read/write own events |
| event_settings | read only the public-safe columns (via a view) | read/write own events |
| media | read if `status = 'approved' and show_publicly and event_is_public` | full on own events |
| messages, comments | read if approved and event public | full on own events |
| contributors, submissions, upload_attempts, audit_log | **none** | read own events (audit_log append-only via trigger) |
| event_admins, platform_admins | none | read own rows; owners manage their event's moderators |

**No insert/update/delete policies exist for `anon`.** All guest writes happen inside Edge Functions.

## Rate-limit defaults (per event, configurable)

| Limit | Default |
|---|---|
| Submissions per device per hour | 10 |
| Files per device per day | 150 |
| Files per IP per hour | 300 (shared Wi-Fi at a venue) |
| Messages per device per hour | 10 |

## Coexistence and migration from the current Epps site

The current live page uses tables named `events`, `photos`, `notes`, `comments`, `video_offers`, `admins` in the same Supabase project. The new `events` table needs that name, so:

1. **Rename the old tables** to `legacy_events`, `legacy_photos`, etc., and update the current site's `core.js` in the same few minutes (table names in queries, plus the `photo_exists` function body). Policies and triggers survive renames. The live page keeps working.
2. **Create the new schema** (this document).
3. **Copy the data:** `legacy_events` → `events` + settings + branding (from `config.js`); each distinct guest name → `contributors`; `legacy_photos` → `media` (paths re-pointed to copied files, status and captions kept); `legacy_notes` → `messages`; `legacy_comments` → `comments`. Files are copied into the new storage layout.
4. **Re-sync right before cutover**, since guests keep uploading to the old site until then.
5. **Cutover:** point `epps60th.com/memories` at the new app; close uploads on the legacy tables.
6. Drop the legacy tables after a safe period, and only after you approve.
