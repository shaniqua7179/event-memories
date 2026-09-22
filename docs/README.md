# Docs

> **2026-09-22 direction change:** the owner decided to **keep the existing application layer** (current Supabase tables, uploads, admin, moderation, security) and focus on the public experience. **Start with [05 · Creative Direction](05-creative-direction.md).** Docs 01–04 describe a possible future backend rebuild and are **parked**; their journeys and performance notes still inform the design.

Read in order:

1. [Architecture](01-architecture.md): the big picture, technology, routes, roles, security, performance, plan limits, and roadmap
2. [Database](02-database.md): tables, statuses, access rules, rate limits, and migrating the current Epps site
3. [Storage and uploads](03-storage-and-uploads.md): buckets, folders, photo/video processing, the upload flow, and download rules
4. [Journeys](04-journeys.md): step-by-step guest and organizer experiences

## Open decisions for the owner

1. **Moderation default:** keep "approve before publishing" (current Epps behavior) or switch to auto-publish?
2. **Videos:** allow guest video uploads? If yes, upgrade to Supabase Pro first (file-size and storage limits).
3. **Comments on photos:** keep them (the current site has them) or leave them off for a cleaner experience?
4. **Pending privacy:** is "unguessable link, not shown anywhere" acceptable for items awaiting review, or should they be fully private (slower review)?
5. **Supabase Pro timing:** upgrade before the next live event, so the site can't pause after 7 quiet days.
