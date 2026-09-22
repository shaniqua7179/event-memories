# 03 · Storage and uploads

Status: **draft for review** (2026-09-22)

## Buckets

| Bucket | Access | Holds | Why |
|---|---|---|---|
| `event-media` | **Public read** (CDN), no public write | Display versions, thumbnails, video files, poster frames, branding media | Fast CDN delivery with long cache times for hundreds of images. Paths contain random IDs, so they can't be guessed or listed. |
| `event-private` | **Private** (signed URLs only), no public write | High-res copies and anything not yet approved that needs protecting | Downloads of high-res files happen only through short-lived signed links, and only when downloading is allowed. |

Both buckets restrict MIME types (`image/jpeg`, `image/webp`, `image/png`, `video/mp4`, `video/quicktime`) and have per-bucket size limits (never above the plan's global limit).

Trade-off, stated honestly: a **pending** item's thumbnail sits in the public bucket at an unguessable URL. Nobody can find it without the exact link, and it isn't shown anywhere public until approved. When an item is **rejected or deleted**, its files are removed. If you'd like pending items fully private, we can stage them in `event-private` and copy on approval. That's slower to review, so it isn't the default.

## Folder layout

```
event-media/
  events/{event_id}/
    optimized/{media_id}.jpg          display version (~2000 px long edge)
    optimized/{media_id}-e{n}.jpg     cropped/rotated edit n (original kept)
    thumbnails/{media_id}.jpg         ~480 px
    thumbnails/{media_id}-e{n}.jpg
    videos/{media_id}.mp4|.mov
    posters/{media_id}.jpg            video poster frame
    branding/{file}                   logo, hero video, hero poster

event-private/
  events/{event_id}/
    originals/{media_id}.jpg          high-res copy (~4000 px), only if keep_high_res
```

- File names are **always generated** (`{media_id}` is a UUID). A guest's original file name is never used as a path. It's stored as metadata only, cleaned of special characters.
- Edited versions get a new name (`-e2`), so CDN and browser caches never show a stale crop.
- The database row holds every path, which is how event, contributor, versions, caption, permissions, date, and status stay linked.

## Photo pipeline (guest's phone)

1. The guest picks photos. On iPhone, the photo picker already hands the browser JPEGs; HEIC files from computers are converted or politely rejected.
2. Each photo is checked: type, and source size ≤ `max_photo_source_mb`. Oversized or unsupported files get a clear message ("This file is a PDF. Only photos and videos can be shared.").
3. The browser corrects orientation, then makes:
   - **display** version: 2000 px long edge, JPEG quality ~0.82 (typically 300 KB–1 MB)
   - **thumbnail**: 480 px, quality ~0.78 (typically 40–80 KB)
   - **high-res** (only if `keep_high_res`): 4000 px, quality ~0.9
   - a SHA-256 fingerprint of the original, to skip duplicates
4. Location data (GPS) is stripped. Canvas re-encoding removes it automatically, and the "taken at" time is read first and sent separately.

## Video pipeline

1. Check type (`mp4`/`mov`), size ≤ `max_video_mb`, and length ≤ `max_video_seconds` by reading the video's metadata in the browser. Too long: "This video is 2 min 10 s. Please trim it to under 60 seconds in your Photos app, then try again."
2. Capture a poster frame (about 1 second in) as a JPEG thumbnail.
3. Upload the file as-is, using resumable upload for anything over 6 MB, so a weak venue signal doesn't restart from zero.
4. Playback uses the poster until tapped, with `preload="none"` on the wall.
5. Later option: a transcoding service for consistent quality and smaller files. Not needed to launch.

## Submission flow (server side)

```
Guest browser                       Edge Function                         Postgres / Storage
─────────────                       ─────────────                         ──────────────────
1. POST start-submission  ───────►  check event live + uploads open
   {event, name, email?, device,    check allow_* and per-file limits
    files:[{kind,bytes,type,         check rate limits (upload_attempts)
    w,h,duration,sha256}],           skip duplicates by sha256
    caption, message?, choices}      create contributor/submission/media  ─► rows state=uploading
                                     createSignedUploadUrl per variant    ─► exact paths only
                         ◄───────   {submission_id, uploads:[{media_id, urls}]}
2. Upload each variant to its
   signed URL (progress per file,
   3 at a time, retry on failure)   ─────────────────────────────────────► Storage
3. POST complete-submission ─────►  for each media: confirm objects exist,
   {submission_id, done:[ids]}       size matches, content-type allowed,
                                     first bytes match JPEG/MP4 signature
                                     status → pending | approved (mode)   ─► rows updated
                                     unfinished items → abandoned
                         ◄───────   {accepted, rejected:[{id, reason}]}
4. Confirmation screen
```

A nightly cleanup removes abandoned uploads older than 24 hours, and files of rejected items older than 30 days.

## What the guest sees

- Each photo tile shows **Getting ready → Uploading 42% → Sent ✓**, or **Didn't send · Tap to retry** with the reason.
- The overall bar reads, for example, "Sending 12 of 30 · keep this page open." The screen stays awake during uploads.
- If they leave mid-way, the next visit offers: "You were sharing 30 photos. 18 were sent. Send the other 12?"
- Confirmation says exactly what happened: "27 photos and your message were received. 3 were already here, so we skipped them. The family reviews everything first, so they'll appear soon." In auto mode: "They're on the wall now. See them."

## Download rules

A download button appears only when **all** of these are true:
`event_settings.downloads_enabled` **and** `media.allow_download` (guest's choice) **and** the item is approved and public.

The display version downloads from the CDN with a friendly file name (`Epps60th-Denise-12.jpg`). High-res copies download through a short-lived signed URL. Admins can always download everything, including bulk ZIPs of selected items, built in the browser to avoid server costs.
