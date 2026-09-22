# 05 · Creative Direction: "The Lights Are Still On"

Status: **draft for review** (2026-09-22). Governs the public experience layer. The application layer (current Supabase tables, uploads, admin, moderation, security) stays as-is underneath.

---

## A. Creative concept

### The idea
**epps60th.com is the dance floor, the morning after, and the lights never went off.**

You don't "visit a gallery." You **walk back into the room.** A giant chrome mirror ball hangs just above you, throwing hundreds of points of light across everything, including the photographs. The photos aren't in boxes. They hang and drift in the air of the room, at different depths, catching the light as it sweeps past. Somewhere, a camera flash goes off. The party is still happening, and you're invited to add your moments to the room.

### Three words
**Chrome. Light. Motion.**

### Retire / introduce
| Retire | Introduce |
|---|---|
| Black-and-gold template look | Midnight room lit by **colored light**, with chrome as the only "material" |
| Sections, cards, tabs, bordered boxes | One **continuous space** that changes as you move through it (scenes, not sections) |
| Photos in grids | Photos as **objects in the room**: floating prints at different depths, glossy, catching light |
| Buttons everywhere | **One invitation at a time**, plus one always-present chrome "Share" disc |
| Explaining the technology | The upload feels like **stepping into a photo booth** and ends with your photo flying onto the wall with a flash |

### The four beats (maps to your standard)
| Beat | Guest thinks | What causes it |
|---|---|---|
| 1. Entrance | **"Whoa."** | Darkness → mirror ball ignites → light scatters across the screen → flash → chrome headline |
| 2. The floor | **"This is fun."** | Photos drifting in depth, light sweeping over them, parallax when you move or scroll, colors shifting |
| 3. The moments | **"I want to see the pictures."** | Tap a floating photo and it's pulled forward, full screen, with a flash; swipe through the night |
| 4. Your turn | **"Wait, I have pictures too."** | "Were you there? Put yours on the wall." Photo-booth share, then *your* photo flies into the room |

### The night in scenes (one continuous scroll)

**Scene 1 · Doors (the first screen)**
Mirror ball dominant, partially cropped top-right, rotating. Light spots drift across the whole screen. Giant chrome "60" sits deep in the background. Headline in chrome lettering. Three or four real guest photos already floating in, half-lit. The only UI is the chrome Share disc (bottom-right, thumb reach).

**Scene 2 · The Floor (the living wall)**
As you scroll, the camera "descends" onto the dance floor. Photos float in three depth layers: far (small, soft focus, dim), middle, near (large, sharp, bright). Layers move at different speeds. Light beams sweep; room color shifts slowly (magenta → violet → cyan → amber). Tapping any photo opens the lightbox. "See every photo" enters full gallery mode, the same room with photos arranged denser in a flowing collage.

**Scene 3 · Through the Decades (the emotional chapter)**
*Dancing Through the Decades* becomes literal: a horizontal journey from the '60s to the '20s. Each decade changes the room's light and shows an era-styled chrome numeral. If the family provides photos of Pastor Epps across the decades, they appear here as the centerpiece. Guest photos from the party flow through at the end: "…and 2026."

**Scene 4 · The Toasts (the guestbook)**
Lights dim to a spotlight. Messages appear one at a time as **projected light words**, as if cast onto the floor or wall by the spotlight, with the sender's name signed beneath. You can tap to hold one, or swipe to the next. "Read them all" opens the full memory book.

**Scene 5 · Your Turn (the share invitation)**
Full-screen flash moment: "Were you there? Put your pictures on the wall." Tap and the photo booth opens: the upload flow, restyled but functionally the same. On success: a flash, your first photo appears in the room and flies into the wall, and a thank-you.

**Persistent:** the chrome Share disc (a mini mirror ball that glints) and a minimal top bar with the event mark and a sound-free "Slideshow" icon.

---

## B. Visual hierarchy

What dominates, in order:

1. **Light and motion** (the mirror ball and its reflections). It's the first thing you feel.
2. **Photographs, large.** Real faces from the night are the emotional payload.
3. **Chrome typography.** Headline and numerals, used sparingly, big.
4. **One invitation.** "Share yours," always reachable, never shouting.
5. **UI chrome** (menus, counts, controls). Nearly invisible until needed.

### Palette
Colors come from **light**, not paint. UI stays neutral.

| Role | Value | Use |
|---|---|---|
| Night (base) | `#06060B` | Page background (not flat black; a hint of blue) |
| Haze | `#0E0C1A` | Atmosphere tint |
| Chrome ramp | `#FFFFFF` · `#E6E9EE` · `#B9C0CA` · `#7E8693` · `#3A3F48` | Chrome art, icons, rules |
| Light: Disco Magenta | `#FF3DA5` | Room light only (≤ 40%, blend modes) |
| Light: Electric Violet | `#8B5CFF` | Room light only |
| Light: Ice Cyan | `#4FE3FF` | Room light only |
| Light: Warm Amber | `#FFB547` | Room light only; the "gold" from the old site survives as warm light |
| Text | `#FFFFFF` / 72% white | All text |

### Typography
- **Display:** created as **chrome artwork** (see assets), not a web font, for the headline and numerals. Choose a bold, rounded, confident 1970s-disco-influenced face with a modern finish. The real text is included invisibly for screen readers and search.
- **UI/body:** a clean, friendly sans (e.g. *Manrope* or *Inter Tight*), large sizes (18 px body on phones).

---

## C. Motion direction

### Principles
1. **Everything drifts; nothing jerks.** Ambient motion is slow and continuous. Energy comes from **light**, not from shaking elements.
2. **Flashes are punctuation.** They're rare, single, and meaningful (arrival, opening a photo, a new photo landing, your upload finishing).
3. **Depth over decoration.** Parallax and focus separate near and far; nothing moves only because it can.
4. **The guest is always in control.** Scrolling and tapping override ambient motion immediately.

### Timing spec
| Element | Motion | Speed / duration | Easing / notes |
|---|---|---|---|
| **Entrance** | Black → ball fades up → first light spots bloom → flash → chrome headline sweep → photos drift in | 0.0 s black · 0.3 s ball 0→100% over 900 ms · 0.7 s spots bloom 600 ms · 1.2 s flash · 1.4 s headline specular sweep 1200 ms · 1.8 s photos enter over 1500 ms | Plays once per visit; tap anywhere to skip; total ≤ 2.5 s |
| **Mirror ball** | Rotation (in the video) | 1 revolution ≈ 45 s | Seamless loop |
| **Light spots** | Travel across screen in slow arcs, direction matching ball rotation | 20–40 px/s; 60–120 spots desktop, 30–60 phone | Sine-wave brightness twinkle 2–5 s per spot; they pass over photos (screen blend) |
| **Light beams** | Sweep from top corners | 8–12 s per sweep | Ease-in-out |
| **Room color** | Slow crossfade between the four light colors | 20 s per color | Linear crossfade; decade chapter overrides |
| **Floating photos** | Drift + gentle rotation | 6–14 px/s, ±3° rotation, 12–30 s cycles | Far layer slowest; never overlapping faces with UI |
| **Parallax** | Depth layers on scroll (and pointer on desktop) | Far 0.2× · Mid 0.5× · Near 1.0× | Off for reduced motion |
| **Photo gloss** | Specular streak slides across a print as light passes | 600 ms, triggered when a light beam crosses | Subtle, ≤ 35% |
| **Open photo** | Others dim to 20%; tapped photo flies forward to full screen | 450 ms spring (no bounce) + flash at 60% of the travel | The close reverses back to its exact spot |
| **Swipe in lightbox** | Follow finger; release snaps | 250 ms | Standard gesture physics |
| **Camera flash** | White bloom from a point | 0→85% in 60 ms, hold 40 ms, →0 in 350 ms | Single flash only; never more than 1 per second |
| **Messages (toasts)** | Projected words fade/focus in word by word | 80 ms per word, hold 5 s | Spotlight follows |
| **Upload success** | Flash; the guest's first photo scales from the booth into the room | 900 ms total | The emotional payoff: make it feel great |
| **New photo arrives (live)** | Small flash where it appears; drifts into its layer | 700 ms | Max 1 per 3 s, queued |

### Guardrails
- **Reduced motion** (system setting): static ball poster, no drift, no parallax, no flashes. Photos arranged beautifully but still, with crossfades only.
- **Photosensitivity:** no flashing faster than 1 per second (WCAG requires ≤ 3); no saturated-red flashes; flashes cover a soft, partial area rather than hard full-screen white.
- **Battery and data:** videos pause when offscreen or when the tab is hidden. "Data saver" or slow connections get posters plus code-only light. Low-end phones automatically get fewer spots and no atmosphere video.
- **Budget:** at most **2 videos** playing at once. First screen visible in ≤ 2.5 s on 4G (poster first, video after).

---

## D. Graphic asset requirements

Conventions:
- **"On black"** = rendered on pure `#000000` with no transparency. The site composites it with *screen* blending, so black disappears and light adds on top. This works on every browser including iPhone Safari (transparent video does **not** work reliably on iPhone), and it's easier for you to make.
- Phone design base: 390 × 844 screen at 3× density. Desktop base: 1440 × 900 (assets made larger for sharp displays).
- Deliver **masters** at the sizes below. I'll create the compressed web versions (WebP/AVIF/MP4) and the exact phone crops.
- Drop files in `Desktop\Event Memories\source-media\design\` using the file names given.

### ★ The WOW list: the 8 assets with the biggest impact (priority order)

| # | Asset | Why it matters |
|---|---|---|
| 1 | **Hero Mirror Ball loop** (video) | The "Whoa." Every visitor's first two seconds |
| 2 | **Real footage from the night** (content) | Nothing beats *actual* dance-floor video of these guests. "The party is still happening" becomes literally true |
| 3 | **Chrome headline + giant "60"** | Turns a web page into a title sequence |
| 4 | **Light sprite pack** | Makes light move over *everything*, including the photos (the "photos live in the room" effect) |
| 5 | **Atmosphere loop** (haze + beams, video) | Depth and a room to be in; gives light something to cut through |
| 6 | **Decades numerals + Pastor Epps through the decades** | The emotional centerpiece, unique to this event |
| 7 | **Photo gloss + film grain** | Photos become glossy prints in a room, not rectangles on a screen |
| 8 | **Share card + link preview image** | Every text and Facebook share looks like an invitation back to the party |

### Full specifications

#### 1. Hero Mirror Ball loop ★
| | |
|---|---|
| Purpose | Dominant entrance element; the ball itself rotating with real chrome reflections |
| Master | Render **once at 2400 × 2400**, ball centered, ball diameter ≈ 2000 px, on black. I crop the phone and desktop framings from it. If you prefer to deliver finished crops: **desktop 1920 × 1080** (ball ≈ 1300 px diameter, center near x 1500 / y 250, cropped off the top-right) and **phone 1080 × 1920** (ball ≈ 1300 px, center near x 780 / y 330, cropped off the top-right) |
| Format | MP4 (H.264) or ProRes/PNG sequence master; no audio |
| Frame rate / length | **24 fps, 5.6 s seamless loop** (tip for a 3D artist: a ball with 32 facet columns rotated exactly 4 columns (45°) repeats perfectly, giving 1 revolution per 45 s) |
| Transparency | **No.** Render on black; the site uses screen blending |
| Static / animated | Animated (rotation in video, **not** code; real faceted chrome reflections can't be faked convincingly in CSS) |
| Look | Bright silver facets, crisp specular pops, a slight cool/warm split light, no colored background, no reflections of a room |
| Web target (my job) | ≤ 2.5 MB desktop, ≤ 1.8 MB phone |
| Also needed | **Still ball, 2400 × 2400 PNG with transparency.** Used for reduced motion, the Share disc, the favicon and the share card |
| Appears | Scene 1 (dominant); smaller echoes in Scene 5 and the Share disc |

#### 2. Real footage from the night ★ (content, not graphics)
| | |
|---|---|
| Purpose | A 10–20 s hero montage and background moments: dancing, cheering, the cake, the grand entrance |
| What to gather | Any guest or photographer video clips, as originals (not screen recordings or Facebook downloads) |
| Master | As shot (phone 1080p/4K is fine), vertical or horizontal |
| Also | The **photographer's 20–40 best photos** at full resolution (≥ 3000 px long edge) |
| Appears | Scene 1 (intercut behind the ball), Scene 2, the slideshow |
| Note | I'll edit, grade (cool shadows, bright highlights) and compress. You supply the raw clips |

#### 3. Chrome headline lockup + giant "60" ★
| Asset | Master size | Format | Transparency | Notes |
|---|---|---|---|---|
| `headline-desktop` | **2400 × 800** | PNG-24 | Yes | Headline on 1–2 lines, chrome material. Suggested copy: "Oh, what a night." (current) or "The party's still going." Your call |
| `headline-mobile` | **1200 × 1100** | PNG-24 | Yes | Same headline stacked on 2–3 lines |
| `headline-*-mask` | same sizes | PNG-24 | Yes | **Flat white silhouette** of the same lettering, pixel-aligned. Lets code sweep a moving highlight across the chrome |
| `sixty` | **2000 × 1600** | PNG-24 | Yes | Giant chrome "60", slight 3D bevel. Sits far back in Scene 1, behind photos |
| `sixty-mask` | 2000 × 1600 | PNG-24 | Yes | White silhouette |

Static images; code animates the entrance, highlight sweep and parallax. Same files serve desktop and phone except the headline, which has two layouts.

#### 4. Light sprite pack ★
Small images that code multiplies into hundreds of moving lights. All static, **PNG-24 with transparency** (or on black), one version for all screens.

| File | Size | Description |
|---|---|---|
| `spot-soft` | 256 × 256 | Soft round white light spot, bright center fading to nothing |
| `spot-facet` | 256 × 256 | A mirror-ball reflection: a softened square/diamond with a brighter center (real mirror-ball spots are small squares) |
| `glint-star` | 512 × 512 | 4-point star sparkle (the "ting" on chrome) |
| `bokeh-disc` | 256 × 256 | Out-of-focus disc with a slightly brighter rim |
| `flare-streak` | 2048 × 256 | Horizontal anamorphic lens streak, white/ice blue |
| `flash-burst` | 1600 × 1600 | Camera-flash starburst: bright core, soft rays, on black |

White or neutral only; the site tints them into magenta, violet, cyan and amber in code.

#### 5. Atmosphere loop (haze + light beams)
| | |
|---|---|
| Purpose | The room: slow haze with 2–4 volumetric beams sweeping from above |
| Desktop | **1920 × 1080** |
| Phone | **1080 × 1920** |
| Format | MP4 (H.264) master, no audio |
| Frame rate / length | **24 fps, 12 s seamless loop** |
| Transparency | No: on black (screen blended) |
| Color | **Neutral white/silver only.** The code tints it so the room can change color and follow the decades |
| Web target (my job) | ≤ 2.0 MB desktop, ≤ 1.5 MB phone |
| Appears | Behind everything in Scenes 1–2 and 5; dimmed in Scene 4 |

#### 6. Decades numerals + the honoree through the decades
| Asset | Size | Format | Transparency | Notes |
|---|---|---|---|---|
| `decade-60s` … `decade-20s` (7 files: '60s '70s '80s '90s '00s '10s '20s) | **1600 × 900** each | PNG-24 | Yes | Each hints at its era (e.g. '70s disco script, '80s neon grid) but all share the same chrome/light material so they read as one family |
| Photos of Pastor Epps by decade (content) | Scans ≥ 2000 px long edge | JPEG | No | 1–3 per decade, with a short caption each (year, place). The emotional core of Scene 3 |

Static; code handles the horizontal journey, light change and parallax.

#### 7. Photo gloss + film grain
| Asset | Size | Format | Transparency | Notes |
|---|---|---|---|---|
| `print-gloss` | **1600 × 1600** | PNG-24 | Yes | Diagonal soft white specular streak (max ~35% opacity), as if light is sliding across a glossy print. Code moves it over photos when light passes |
| `film-grain` | **512 × 512** | PNG (grayscale) | No | Seamlessly tiling fine grain; code overlays and jitters it for a cinematic finish |

#### 8. Share card + link preview
| Asset | Size | Format | Notes |
|---|---|---|---|
| `og-preview` | **1200 × 630** | JPEG ≤ 300 KB | What appears when the link is texted or posted: ball, chrome "60", "Relive the night · Share your photos". Keep key content inside the central 1000 × 500 |
| `story-card` | **1080 × 1920** | PNG | "I was there" story graphic guests can post to Instagram/Facebook Stories, with the link |
| `icon` | **512 × 512** | PNG, transparent | Chrome mirror-ball mark for the browser tab and home-screen icon |

#### Optional (nice, lower priority)
| Asset | Size | Format | Notes |
|---|---|---|---|
| `event-mark` | 1200 × 400 | PNG, transparent | Small chrome "Epps 60" wordmark for the top bar |
| `confetti-sprites` | 6 × 256 × 256 | PNG, transparent | Chrome/iridescent confetti pieces for the upload-success moment |
| Rive file: Share disc + success burst | n/a | `.riv` | Only if you want to design the interaction yourself (see E) |

**Not needed:** section dividers, photo frames with borders, decorative shapes, button graphics. These would push us back toward "website with sections," so code handles all of it.

---

## E. Tool recommendation

### Direct answers

**1. Should the experience be art-directed in Figma first?**
**Yes, but lightly:** six key frames, not a full website design. Figma is excellent for deciding composition, scale, layering and type at phone and desktop sizes, and it's free. It's weak at motion, so don't try to prototype animation there. Deliverable: Scenes 1, 2 (floor), 2 (gallery), 3, 4 and 5 at **390 × 844** and **1440 × 900**, using placeholder or real assets. Export the frames as PNGs into the repo and I'll build to them.

**2. Would Framer be useful for the interaction and motion concept?**
**Only if a designer who already works in Framer is involved.** Framer is great for quickly feeling scroll and interaction, but it's a throwaway second build: nothing transfers into your working site, and motion here must be judged on a real phone, with real photos and real video layers, which Framer can't reproduce faithfully. My recommendation: skip Framer and prototype motion **directly in the real site** as a vertical slice (see F). It's faster, it's what ships, and you review it on your phone.

**3. Would Spline be appropriate for the disco ball or 3D elements?**
**Yes, as the tool to *create* the ball, not to run it live.** Spline (or Blender, free and higher quality) can model a faceted chrome ball and **export/render a video loop**. Running a live Spline scene on guests' phones adds ~1 MB+ of code, drains battery, and looks less photographic than a rendered video. Possible later upgrade: a desktop-only interactive ball that reacts to the cursor.

**4. Would Rive be useful for interactive lighting or motion?**
**For small interactive pieces, yes; for lighting, no.** Rive is ideal for vector interactions with states, such as the chrome Share disc (idle glint → pressed → uploading → success) or the success burst. It's the wrong tool for photographic light, haze and reflections. **Optional:** I can build those interactions in code if you'd rather not learn Rive.

**5. Should certain elements be video/motion assets instead of coded animation?**
**Yes, and this is the key decision.** Anything *photographic and volumetric* should be **pre-rendered video on black**: the rotating ball, haze and beams, and real event footage. Code can't produce those convincingly, and video does it cheaply. Anything that must **interact, respond, or cover a page of unknown length** is code: the light spots moving over photos, flashes, parallax, photo motion and transitions.

**6. Which parts are coded versus created as design assets?** See F below.

**7. Which workflow gives the best balance of creativity, performance and maintainability?**

> **Figma (key frames) → Blender/Spline + After Effects (video plates and sprites) → the real site, built as a vertical slice and tuned on real phones.**

- **Figma** decides *what it looks like* (art direction, locked before code).
- **Blender/Spline + After Effects** make *what code can't* (chrome, light, haze).
- **Code** makes it *alive and interactive* (light over photos, depth, flashes, gestures), *fast* (budgets, fallbacks) and *maintainable* (one real site, one data layer, reusable per event).

### Tool-by-tool summary
| Tool | Use it? | For |
|---|---|---|
| **Figma** | ✅ Yes | 6 key frames × 2 sizes; mood board; static asset design and export |
| **Blender** (free) or **Spline** | ✅ Yes, choose one | Render the mirror ball loop and still; Blender gives the best chrome |
| **After Effects** | ✅ If available | Atmosphere loop, flare/flash sprites, grading real footage. Alternatives: **DaVinci Resolve** (free) or **CapCut** for simpler loops |
| **Photoshop / Illustrator / Affinity** | ✅ For chrome type | Headline, "60", decade numerals, masks. **Adobe Firefly** can help generate chrome lettering textures (commercially safe) |
| **AI video (Runway, Kling, Veo)** | ⚠️ Maybe | Can generate haze/beam plates on black; hit-or-miss for seamless loops. Worth a try for #5, not for #1 |
| **Rive** | ⚠️ Optional | Share disc + success burst, only if you want to design them |
| **Framer** | ❌ Skip | Unless a Framer designer joins |
| **Webflow** | ❌ No | Would duplicate the site and disconnect it from the working app |
| **Adobe Express / Canva** | ⚠️ Limited | Fine for the share card and story card; not for chrome, light or the ball |

**If you don't have 3D or motion skills:** the mirror ball loop (#1) and atmosphere loop (#5) are well-defined jobs for a freelance motion designer (Fiverr/Upwork). This document is the brief, and it's the best money you could spend on the "Whoa." You can make everything else in Photoshop/Figma. I can also start with the stock clips we already downloaded as stand-ins, so the build doesn't wait.

---

## F. Build strategy

### Who makes what
| Layer | Made in | Examples |
|---|---|---|
| **Design software** (you or a designer) | Figma, Photoshop/Illustrator, Firefly | Key frames; chrome headline, "60", decade numerals + masks; light sprites; gloss and grain; share card, story card, icon |
| **Pre-rendered video** | Blender/Spline, After Effects/Resolve | Mirror ball loop; atmosphere loop; edited montage of real footage |
| **CSS** | Code | Blend modes that composite the video and light; room-color tinting; flash bloom; reduced-motion fallbacks; typography and layout; the photo-booth sheet styling |
| **JavaScript/React-level code** | Code | The scene engine (scroll-driven scenes); light-spot particle field (canvas); floating photo layers + parallax; lightbox fly-forward, gestures and swipe; entrance choreography; live "new photo lands" moment; device-tier and data-saver logic; message projection sequencing |
| **Application layer (unchanged)** | Existing `core.js` + Supabase | Loading approved photos and messages, uploads (shrink → upload), comments, downloads by permission, admin, moderation, crop, security |

### Order of work
1. **Approve this direction** (and choose the headline copy).
2. **Assets:** you gather footage and photos (#2, #6), and make or commission #1, #3, #4, #5, #7, #8. Figma key frames alongside.
3. **Vertical slice (me):** Scene 1 (entrance) + Scene 2 (the floor + lightbox), wired to the **real approved photos** through the existing data layer, published to a private preview link. Built first with stand-in assets (stock clips, placeholder chrome), then swapped for yours. **You review on your phone**, and we tune the timing together.
4. Scenes 3–5, the photo-booth restyle of the existing upload flow, full gallery mode, and slideshow mode restyled as the TV "live wall."
5. Performance, accessibility and flash-safety pass; test on real iPhone and Android devices.
6. **Cutover:** swap the new experience in at `epps60th.com/memories`. The admin page and database are untouched.

### What does NOT change
Supabase project, tables, permissions and storage; photo shrink-before-upload; messages; comments; downloads and permissions; the admin page (review, crop, bulk add, settings); the password-protected admin link.
