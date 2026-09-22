/* =========================================================================
   Join the After Party · experience engine for Scenes 1 & 2
   Data comes from the existing app layer (core.js); nothing here writes data.
   ========================================================================= */
(function () {
  const { api, esc } = window.MemoryWall;
  const $ = (id) => document.getElementById(id);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isPhone = matchMedia("(max-width: 700px)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const saveData = !!(navigator.connection && navigator.connection.saveData);
  const lowPower = (navigator.hardwareConcurrency || 4) <= 4 || saveData;
  const rand = (a, b) => a + Math.random() * (b - a);
  const shuffle = (arr) => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const root = document.documentElement;

  /* ---------- The disco ball: one video, at the top of the entrance only; poster first; never on data-saver / reduced motion ---------- */
  const MEDIA = "/memories/experience/media/";
  const ballWrap = document.querySelector(".pollo-bg");
  const video = $("ballVideo");
  ballWrap.style.setProperty("--ball-poster", `url("${MEDIA}${isPhone ? "ballroom-mobile.jpg" : "ballroom-desktop.jpg"}")`);
  if (!reduceMotion && !saveData) {
    video.src = MEDIA + (isPhone ? "ballroom-mobile.mp4" : "ballroom-desktop.mp4");
    video.addEventListener("playing", () => { video.classList.add("is-playing"); ballWrap.classList.add("video-on"); }, { once: true });
    const tryPlay = () => video.play().catch(() => {});
    let entranceOnScreen = true;
    new IntersectionObserver(([e]) => { entranceOnScreen = e.isIntersecting; entranceOnScreen && !document.hidden ? tryPlay() : video.pause(); }).observe(document.getElementById("entrance"));
    document.addEventListener("visibilitychange", () => (document.hidden || !entranceOnScreen ? video.pause() : tryPlay()));
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true }); // iOS low-power mode
    tryPlay();
  }

  /* ---------- Camera flash ---------- */
  const flashEl = $("flash");
  let lastFlash = 0;
  function flash(strength = 0.8, x = "50%", y = "45%") {
    if (reduceMotion) return;
    const now = performance.now();
    if (now - lastFlash < 1200) return; // never more than one flash a second (photosensitivity)
    lastFlash = now;
    flashEl.style.setProperty("--fx", x);
    flashEl.style.setProperty("--fy", y);
    flashEl.animate([{ opacity: 0 }, { opacity: strength, offset: 0.12 }, { opacity: strength * 0.35, offset: 0.35 }, { opacity: 0 }], { duration: 620, easing: "ease-out" });
  }
  // Occasional distant camera flashes while the room is on screen
  (function ambientFlashes() {
    if (reduceMotion) return;
    setTimeout(function next() {
      if (!document.hidden && !document.body.classList.contains("lb-open")) flash(rand(0.12, 0.22), `${rand(10, 90)}%`, `${rand(10, 70)}%`);
      setTimeout(next, rand(14000, 26000));
    }, 9000);
  })();

  /* ---------- Disco reflections: soft light spots drifting across everything ---------- */
  const spots = (() => {
    const cv = $("spots"), ctx = cv.getContext("2d");
    let W = 0, H = 0, dpr = 1, list = [];
    const count = reduceMotion ? 0 : isPhone ? 34 : lowPower ? 55 : 90;
    const colors = ["255,255,255", "255,255,255", "255,250,240", "255,236,200", "246,220,160", "255,244,220", "200,210,255", "190,160,255"];
    const sprites = colors.map((c) => {
      const s = document.createElement("canvas"); s.width = s.height = 64;
      const g = s.getContext("2d"), grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grd.addColorStop(0, `rgba(${c},1)`); grd.addColorStop(0.25, `rgba(${c},0.85)`); grd.addColorStop(0.6, `rgba(${c},0.18)`); grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
      return s;
    });
    function make(anyX) {
      const big = Math.random() < 0.08;
      return {
        x: anyX ? rand(0, W) : rand(-80, -20), y: rand(0, H),
        r: big ? rand(16, 26) : rand(3, 10), vx: rand(10, 34) * (isPhone ? 0.8 : 1),
        amp: rand(6, 26), ph: rand(0, Math.PI * 2), tw: rand(0.6, 1.8), base: big ? rand(0.18, 0.3) : rand(0.35, 0.8),
        sp: sprites[Math.floor(Math.random() * sprites.length)], stretch: rand(1.1, 1.9)
      };
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = innerWidth; H = innerHeight;
      cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!list.length) list = Array.from({ length: count }, () => make(true));
    }
    resize();
    addEventListener("resize", resize);
    let intensity = 1;
    return {
      boost(v) { intensity = v; },
      step(t, dt) {
        if (!count) return;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        for (const s of list) {
          s.x += s.vx * dt;
          if (s.x > W + 60) Object.assign(s, make(false));
          const y = s.y + Math.sin(t * 0.00035 + s.ph) * s.amp;
          const a = s.base * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 0.001 * s.tw + s.ph))) * intensity;
          ctx.globalAlpha = Math.min(1, a);
          const w = s.r * 2 * s.stretch, h = s.r * 2;
          ctx.drawImage(s.sp, s.x - w / 2, y - h / 2, w, h);
        }
        ctx.globalAlpha = 1;
      }
    };
  })();

  /* ---------- Glowing dance floor: tiles that pulse through the room's colors ---------- */
  const danceFloor = (() => {
    const cv = $("floorCanvas");
    if (!cv) return { step() {} };
    const cols = isPhone ? 26 : 40, rows = isPhone ? 12 : 16, tile = 22, gap = 2;
    cv.width = cols * tile; cv.height = rows * tile;
    const ctx = cv.getContext("2d");
    const palette = [[255, 61, 165], [139, 92, 255], [79, 227, 255], [255, 181, 71], [255, 255, 255], [60, 90, 255]];
    const cells = Array.from({ length: cols * rows }, () => ({ c: palette[Math.floor(Math.random() * palette.length)], v: Math.random(), target: Math.random() }));
    let acc = 0;
    function draw() {
      ctx.fillStyle = "#050509"; ctx.fillRect(0, 0, cv.width, cv.height);
      cells.forEach((cell, i) => {
        const x = (i % cols) * tile, y = Math.floor(i / cols) * tile, a = 0.12 + cell.v * 0.88;
        ctx.fillStyle = `rgba(${cell.c[0]},${cell.c[1]},${cell.c[2]},${a.toFixed(2)})`;
        ctx.fillRect(x + gap / 2, y + gap / 2, tile - gap, tile - gap);
      });
    }
    draw();
    return {
      step(dt) {
        if (reduceMotion) return;
        acc += dt;
        for (const cell of cells) {
          cell.v += (cell.target - cell.v) * Math.min(1, dt * 2.2);
          if (Math.abs(cell.target - cell.v) < 0.04) { cell.target = Math.random() < 0.35 ? Math.random() : Math.random() * 0.25; if (Math.random() < 0.15) cell.c = palette[Math.floor(Math.random() * palette.length)]; }
        }
        if (acc > 0.06) { acc = 0; draw(); }
      }
    };
  })();

  /* ---------- Floor smoke: soft puffs drifting and swelling across the bottom of the entrance ---------- */
  const fog = (() => {
    const cv = $("fog");
    if (!cv || reduceMotion) return { step() {} };
    const ctx = cv.getContext("2d");
    const scale = 0.5; // fog is soft, so half resolution is plenty and much cheaper
    let W = 0, H = 0, puffs = [];
    const count = isPhone ? 9 : lowPower ? 12 : 18;
    function make(anyX) {
      const r = rand(0.18, 0.42) * Math.max(W, 600);
      return { x: anyX ? rand(-0.1, 1.1) * W : -r, y: H * rand(0.55, 1.05), r, vx: rand(8, 22) * scale, a: rand(0.05, 0.12), ph: rand(0, 6.28), warm: Math.random() < 0.6 };
    }
    function resize() {
      const b = cv.getBoundingClientRect();
      W = Math.max(1, Math.round(b.width * scale)); H = Math.max(1, Math.round(b.height * scale));
      cv.width = W; cv.height = H;
      puffs = Array.from({ length: count }, () => make(true));
    }
    resize();
    addEventListener("resize", resize);
    let acc = 0;
    return {
      step(t, dt) {
        acc += dt;
        if (acc < 1 / 30) return; // 30 frames a second is smooth for smoke
        const step = acc; acc = 0;
        ctx.clearRect(0, 0, W, H);
        ctx.globalCompositeOperation = "lighter";
        for (const p of puffs) {
          p.x += p.vx * step;
          if (p.x - p.r > W) Object.assign(p, make(false));
          const swell = 1 + Math.sin(t * 0.00025 + p.ph) * 0.12;
          const y = p.y + Math.sin(t * 0.0003 + p.ph) * 8;
          const r = p.r * swell;
          const g = ctx.createRadialGradient(p.x, y, 0, p.x, y, r);
          const c = p.warm ? "255,236,205" : "235,238,245";
          g.addColorStop(0, `rgba(${c},${p.a})`); g.addColorStop(0.55, `rgba(${c},${p.a * 0.45})`); g.addColorStop(1, `rgba(${c},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(p.x - r, y - r, r * 2, r * 2);
        }
      }
    };
  })();

  /* ---------- Sharp photos: pick the right size for each tile (thumbnail, ~1200px, or full) ---------- */
  function srcsetFor(p) {
    const w = p.width || 1600, h = p.height || 1200, long = Math.max(w, h);
    const at = (edge) => Math.round(w * Math.min(1, edge / long));
    const parts = [`${api.thumbUrl(p)} ${at(480)}w`];
    if (p.mid_path) parts.push(`${api.midUrl(p)} ${at(1200)}w`);
    parts.push(`${api.fullUrl(p)} ${w}w`);
    return parts.join(", ");
  }

  /* ---------- Load the real photos from the existing app layer ---------- */
  let media = []; // photos + dance-floor videos (speeches stay in their own section)
  let speechCount = 0;
  const isSpeech = (p) => p.kind === "video" && p.category && p.category !== "moment";

  /* ---------- Scene 1 · floating photographs ---------- */
  const floaters = [];
  const slotsDesktop = [
    { x: "1.5%", y: "10%", w: "14vw", r: -8, depth: 0.5, far: false },
    { x: "84%", y: "9%", w: "13vw", r: 7, depth: 0.45, far: false },
    { x: "1%", y: "57%", w: "12.5vw", r: 5, depth: 0.55, far: false, caption: "Same Pastor.<br>New Memories." },
    { x: "85.5%", y: "60%", w: "12vw", r: -7, depth: 0.6, far: false },
    { x: "18%", y: "76%", w: "8vw", r: 4, depth: 0.2, far: true },
    { x: "73%", y: "77%", w: "8vw", r: -4, depth: 0.25, far: true }
  ];
  const slotsPhone = [
    { x: "-8%", y: "8%", w: "30vw", r: -8, depth: 0.4, far: false },
    { x: "76%", y: "8%", w: "28vw", r: 7, depth: 0.3, far: false },
    { x: "-16%", y: "50%", w: "26vw", r: 6, depth: 0.2, far: true },
    { x: "88%", y: "47%", w: "24vw", r: -5, depth: 0.25, far: true }
  ];
  function buildFloaters(photos) {
    const layer = $("floatLayer");
    const slots = isPhone ? slotsPhone : slotsDesktop;
    const picks = shuffle(photos.filter((p) => p.kind !== "video")).slice(0, slots.length);
    picks.forEach((p, i) => {
      const s = slots[i];
      const el = document.createElement("figure");
      el.className = "fphoto" + (s.far ? " far" : "");
      el.style.setProperty("--x", s.x); el.style.setProperty("--y", s.y); el.style.setProperty("--w", s.w);
      el.style.setProperty("--r", `${s.r}deg`); el.style.setProperty("--gd", `${i * 1.3}s`);
      el.innerHTML = `<div class="print${s.caption ? " captioned" : ""}"><img src="${esc(api.thumbUrl(p))}" srcset="${esc(srcsetFor(p))}" sizes="${s.w}" alt="" decoding="async">${s.caption ? `<span class="print-cap">${s.caption}</span>` : ""}</div>`;
      el.querySelector(".print").style.setProperty("--torn", tornEdge());
      layer.appendChild(el);
      floaters.push({ el, s, ph: rand(0, Math.PI * 2), ax: rand(8, 20), ay: rand(10, 24), speed: rand(0.00018, 0.00032), shown: false, delay: 1600 + i * 260 });
    });
  }
  // A random ragged outline so every print looks hand-torn
  function tornEdge() {
    const pts = [], n = 16, j = () => rand(0, 2.4).toFixed(2);
    for (let i = 0; i <= n; i++) pts.push(`${(i / n * 100).toFixed(2)}% ${j()}%`);
    for (let i = 1; i <= n; i++) pts.push(`${(100 - +j()).toFixed(2)}% ${(i / n * 100).toFixed(2)}%`);
    for (let i = n - 1; i >= 0; i--) pts.push(`${(i / n * 100).toFixed(2)}% ${(100 - +j()).toFixed(2)}%`);
    for (let i = n - 1; i >= 1; i--) pts.push(`${j()}% ${(i / n * 100).toFixed(2)}%`);
    return `polygon(${pts.join(",")})`;
  }
  let pointerX = 0, pointerY = 0;
  if (finePointer) addEventListener("pointermove", (e) => { pointerX = e.clientX / innerWidth - 0.5; pointerY = e.clientY / innerHeight - 0.5; }, { passive: true });
  let startT = 0, entering = false;
  function stepFloaters(t) {
    const sy = scrollY;
    for (const f of floaters) {
      if (!f.shown && t - startT > f.delay && !entering) {
        f.shown = true;
        f.el.animate([{ opacity: 0, transform: "translate3d(0,40px,0) scale(0.85)" }, { opacity: 1, transform: "translate3d(0,0,0) scale(1)" }], { duration: 1400, easing: "cubic-bezier(.2,.8,.2,1)" }).onfinish = () => (f.el.style.opacity = 1);
      }
      if (entering || !f.shown || reduceMotion) continue;
      const dx = Math.sin(t * f.speed + f.ph) * f.ax + pointerX * 40 * f.s.depth;
      const dy = Math.cos(t * f.speed * 0.8 + f.ph) * f.ay - sy * f.s.depth * 0.6 + pointerY * 30 * f.s.depth;
      f.el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
    }
  }

  /* ---------- Scene 1 · the chrome title, letter by letter ---------- */
  document.querySelectorAll(".chrome-title .line").forEach((line, li) => {
    const offset = li * 9;
    line.innerHTML = [...line.dataset.text].map((c, i) => c === " "
      ? `<span class="ch sp" style="--i:${offset + i}"> </span>`
      : `<span class="ch" style="--i:${offset + i}">${esc(c)}</span>`).join("");
  });
  requestAnimationFrame(() => document.body.classList.add("is-in"));

  /* ---------- ENTER: text dissolves, lights surge, flash, photos rush past, the floor appears ---------- */
  function enter() {
    if (entering) return;
    const floor = $("floor");
    if (reduceMotion) { floor.scrollIntoView(); return; }
    entering = true;
    document.body.classList.add("entering");
    root.style.setProperty("--boost", "1.6");
    spots.boost(1.8);
    floaters.forEach((f, i) => {
      const r = f.el.getBoundingClientRect();
      const toX = (r.left + r.width / 2 - innerWidth / 2) * 1.6, toY = (r.top + r.height / 2 - innerHeight / 2) * 1.6;
      f.el.style.transform = `translate3d(${toX}px, ${toY}px, 0) scale(2.6)`;
      f.el.style.opacity = "0";
    });
    setTimeout(() => flash(0.9), 260);
    setTimeout(() => { window.scrollTo({ top: floor.offsetTop, behavior: "instant" }); floor.classList.add("is-in"); }, 360);
    setTimeout(() => { root.style.setProperty("--boost", "1"); spots.boost(1); }, 1400);
  }
  $("enterBtn").addEventListener("click", enter);
  // stage tilt: the screen leans gently toward the mouse (desktop only)
  if (finePointer && !reduceMotion) {
    const stage = document.querySelector(".pollo-bg");
    addEventListener("pointermove", (e) => {
      if (scrollY > innerHeight) return;
      const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5;
      stage.style.setProperty("--tilt-y", (x * 7).toFixed(2) + "deg");
      stage.style.setProperty("--tilt-x", (4 - y * 6).toFixed(2) + "deg");
    }, { passive: true });
  }
  // the moment the stage opens: a camera flash
  setTimeout(() => flash(0.55, "50%", "30%"), 1500);
  document.querySelectorAll("[data-go]").forEach((el) => el.addEventListener("click", async (e) => {
    const go = el.dataset.go;
    if (go === "floor") { e.preventDefault(); enter(); }
    else if (go === "videos") {
      // Speeches have their own section on the full gallery page; dance-floor videos are on the Memory Floor
      if (speechCount) return; // follow the link to ../?tab=speeches
      e.preventDefault(); enter();
    } else if (go === "share") {
      e.preventDefault();
      const url = location.origin + location.pathname;
      const data = { title: "Join the After Party", text: "Relive Pastor Epps's 60th birthday celebration and add your photos!", url };
      if (navigator.share) { try { await navigator.share(data); } catch {} }
      else { try { await navigator.clipboard.writeText(url); el.querySelector("span").textContent = "link copied!"; } catch {} }
    }
  }));
  $("scrollCue").addEventListener("click", enter);

  // Scrolling back up to the entrance resets it so ENTER can play again
  new IntersectionObserver(([e]) => {
    if (e.intersectionRatio > 0.85 && entering) {
      entering = false;
      document.body.classList.remove("entering");
      floaters.forEach((f) => { f.el.style.transform = ""; f.el.style.opacity = "1"; });
    }
    $("shareFab").classList.toggle("show", e.intersectionRatio < 0.35);
  }, { threshold: [0, 0.35, 0.85, 1] }).observe($("entrance"));

  /* ---------- Scene 2 · the Memory Floor: independent rows drifting in opposite directions ---------- */
  const rowsCfg = isPhone
    ? [{ h: "clamp(130px, 20vh, 180px)", speed: 13, dir: 1, cls: "back" },
       { h: "clamp(190px, 31vh, 280px)", speed: 20, dir: -1, cls: "front" },
       { h: "clamp(120px, 18vh, 165px)", speed: 10, dir: 1, cls: "back" }]
    : [{ h: "clamp(150px, 22vh, 230px)", speed: 15, dir: 1, cls: "back" },
       { h: "clamp(220px, 34vh, 380px)", speed: 24, dir: -1, cls: "front" },
       { h: "clamp(140px, 20vh, 210px)", speed: 11, dir: 1, cls: "back" },
       { h: "clamp(180px, 27vh, 300px)", speed: 19, dir: -1, cls: "mid" }];
  const rows = [];
  let floorVisible = false;

  function tileHtml(p, rowPx) {
    const ar = Math.min(1.7, Math.max(0.62, (p.width || 4) / (p.height || 3)));
    const tileW = Math.round(rowPx * ar);
    const video = p.kind === "video";
    const dur = p.duration_ms ? `${Math.floor(p.duration_ms / 60000)}:${String(Math.round((p.duration_ms % 60000) / 1000)).padStart(2, "0")}` : "Video";
    return `<button class="tile" data-id="${esc(p.id)}" style="--ar:${ar.toFixed(3)};--rot:${rand(-2.4, 2.4).toFixed(2)}deg;--ty:${rand(-10, 10).toFixed(0)}px" aria-label="Open ${video ? "video" : "photo"} shared by ${esc(p.name)}">
      <img src="${esc(api.thumbUrl(p))}" srcset="${esc(srcsetFor(p))}" sizes="${tileW}px" alt="" loading="lazy" decoding="async" draggable="false">${video ? `<span class="vtag">${dur}</span>` : ""}</button>`;
  }
  function buildFloor() {
    const tracks = $("tracks");
    tracks.innerHTML = "";
    rows.length = 0;
    if (!media.length) { $("floorEmpty").hidden = false; return; }
    const people = new Set(media.map((p) => p.name.trim().toLowerCase())).size;
    $("floorCount").textContent = `${media.length} ${media.length === 1 ? "moment" : "moments"} shared by ${people} ${people === 1 ? "guest" : "guests"}`;
    rowsCfg.forEach((cfg, ri) => {
      const track = document.createElement("div");
      track.className = `track ${cfg.cls}`;
      track.style.setProperty("--h", cfg.h);
      track.style.setProperty("--gap", isPhone ? "12px" : "20px");
      tracks.appendChild(track);
      // Each row gets its own shuffled order, repeated until it's wider than the screen
      const order = shuffle(media);
      const pxH = track.clientHeight || 200;
      let items = [], width = 0, i = 0;
      while (width < innerWidth * 1.3 || items.length < 4) {
        const p = order[i++ % order.length];
        items.push(p);
        width += pxH * Math.min(1.7, Math.max(0.62, (p.width || 4) / (p.height || 3))) + 20;
        if (items.length > 60) break;
      }
      const set = items.map((p) => tileHtml(p, pxH)).join("");
      track.innerHTML = `<div class="belt"><div class="set">${set}</div><div class="set" aria-hidden="true">${set}</div></div>`;
      track.querySelectorAll(".set[aria-hidden] .tile").forEach((b) => (b.tabIndex = -1));
      const row = { track, belt: track.querySelector(".belt"), setW: 0, off: rand(0, 400), cfg, speedNow: cfg.speed, speedTarget: cfg.speed };
      const measure = () => (row.setW = track.querySelector(".set").getBoundingClientRect().width);
      measure();
      track.querySelectorAll("img").forEach((img) => img.addEventListener("load", measure, { once: true }));
      if (finePointer) {
        track.addEventListener("mouseenter", () => (row.speedTarget = cfg.speed * 0.1));
        track.addEventListener("mouseleave", () => (row.speedTarget = cfg.speed));
      }
      enableDrag(row);
      rows.push(row);
    });
    addEventListener("resize", () => rows.forEach((r) => (r.setW = r.track.querySelector(".set").getBoundingClientRect().width)));
  }
  let suppressClick = false;
  function enableDrag(row) {
    const t = row.track;
    let startX = 0, startY = 0, lastX = 0, lastT = 0, vel = 0, down = false, dragging = false;
    t.addEventListener("pointerdown", (e) => {
      if (e.button > 0) return;
      down = true; dragging = false; startX = lastX = e.clientX; startY = e.clientY; lastT = performance.now(); vel = 0;
    });
    t.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return; // vertical swipes still scroll the page
        dragging = true; t.classList.add("dragging");
        try { t.setPointerCapture(e.pointerId); } catch {}
      }
      const now = performance.now(), step = e.clientX - lastX;
      // Moving the belt: positive offset moves content left for rows drifting left, right for rows drifting right
      row.off = ((row.off + (row.cfg.dir > 0 ? step : -step)) % row.setW + row.setW) % row.setW;
      vel = step / Math.max(1, now - lastT) * 1000; lastX = e.clientX; lastT = now;
      row.speedNow = 0;
    });
    const end = () => {
      if (!down) return;
      down = false;
      if (dragging) {
        suppressClick = true; setTimeout(() => (suppressClick = false), 60);
        t.classList.remove("dragging");
        // fling: carry the swipe's momentum, then settle back into the gentle drift
        row.speedNow = Math.max(-900, Math.min(900, row.cfg.dir > 0 ? vel : -vel));
      }
      dragging = false;
    };
    t.addEventListener("pointerup", end);
    t.addEventListener("pointercancel", end);
    t.addEventListener("pointerleave", end);
  }
  function stepRows(dt) {
    if (!floorVisible || document.body.classList.contains("lb-open")) return;
    for (const r of rows) {
      if (!r.setW) continue;
      if (reduceMotion) { r.speedTarget = 0; }
      r.speedNow += (r.speedTarget - r.speedNow) * Math.min(1, dt * 4);
      r.off = ((r.off + r.speedNow * dt) % r.setW + r.setW) % r.setW;
      const x = r.cfg.dir > 0 ? r.off - r.setW : -r.off;
      r.belt.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }
  }
  // Gold sparkles behind the Memory Floor: loaded the first time the floor comes into view, paused when it leaves
  const sparkle = $("sparkleVideo");
  function floorSparkle(on) {
    document.body.classList.toggle("on-floor", on);
    if (!sparkle || reduceMotion || saveData) return;
    if (on) {
      if (!sparkle.src) {
        sparkle.src = "/memories/experience/media/" + (isPhone ? "sparkle-mobile.mp4" : "sparkle-desktop.mp4");
        sparkle.addEventListener("playing", () => sparkle.classList.add("is-playing"), { once: true });
      }
      sparkle.play().catch(() => {});
    } else sparkle.pause();
  }
  new IntersectionObserver(([e]) => {
    floorVisible = e.isIntersecting;
    if (e.isIntersecting) $("floor").classList.add("is-in");
    floorSparkle(e.isIntersecting);
  }, { threshold: 0.08 }).observe($("floor"));

  $("tracks").addEventListener("click", (e) => {
    const b = e.target.closest(".tile");
    if (!b || suppressClick) return;
    const r = b.getBoundingClientRect();
    openViewer(media.findIndex((p) => p.id === b.dataset.id), `${((r.left + r.width / 2) / innerWidth) * 100}%`, `${((r.top + r.height / 2) / innerHeight) * 100}%`, r);
  });

  /* ---------- Viewer: same window, swipe, full size, close returns you to the floor ---------- */
  const lb = $("lb");
  let cur = -1, lastFocus = null;
  function openViewer(i, fx, fy, fromRect) {
    if (i < 0) return;
    lastFocus = document.activeElement;
    cur = i;
    lb.hidden = false;
    document.body.classList.add("lb-open");
    flash(0.35, fx, fy);
    show();
    $("lbClose").focus();
    zoomFrom(fromRect);
  }
  // FLIP: start the viewer image where the tile was, then glide it to full view
  function zoomFrom(rect) {
    const img = $("lbImg");
    if (!rect || reduceMotion || img.hidden) return;
    const run = () => {
      const to = img.getBoundingClientRect();
      if (!to.width) return;
      const sx = rect.width / to.width, sy = rect.height / to.height;
      const dx = rect.left + rect.width / 2 - (to.left + to.width / 2), dy = rect.top + rect.height / 2 - (to.top + to.height / 2);
      img.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: 0.6 }, { transform: "none", opacity: 1 }], { duration: 480, easing: "cubic-bezier(.2,.8,.2,1)" });
    };
    img.complete && img.naturalWidth ? run() : img.addEventListener("load", run, { once: true });
  }
  function closeViewer() {
    $("lbVideo").pause();
    $("lbVideo").removeAttribute("src");
    lb.hidden = true;
    document.body.classList.remove("lb-open");
    setActual(false);
    lastFocus && lastFocus.focus && lastFocus.focus({ preventScroll: true });
  }
  function setActual(on) {
    $("lbStage").classList.toggle("actual", on);
    $("lbHint").textContent = on ? "Tap the photo to fit the screen" : "Tap the photo for full size";
  }
  function show() {
    const p = media[cur];
    if (!p) return;
    const img = $("lbImg"), vid = $("lbVideo"), isVid = p.kind === "video";
    setActual(false);
    vid.pause();
    img.hidden = isVid; vid.hidden = !isVid;
    $("lbHint").hidden = isVid;
    if (isVid) {
      img.removeAttribute("src");
      vid.poster = api.fullUrl(p);
      vid.src = api.videoUrl(p);
      vid.play().catch(() => {});
    } else {
      vid.removeAttribute("src");
      img.src = p.mid_path ? api.midUrl(p) : api.thumbUrl(p);
      const full = new Image();
      full.onload = () => { if (media[cur] === p) img.src = full.src; };
      full.src = api.fullUrl(p);
      img.alt = p.caption ? `Photo: ${p.caption}` : `Photo shared by ${p.name}`;
    }
    $("lbName").textContent = p.name;
    $("lbCap").textContent = p.caption || "";
    $("lbPos").textContent = `${cur + 1} of ${media.length}`;
    const save = $("lbSave");
    save.hidden = !p.allow_download;
    save.href = isVid ? api.videoDownloadUrl(p, cur + 1) : api.downloadUrl(p, cur + 1);
    save.textContent = isVid ? "Save video" : "Save photo";
    // preload neighbours
    [cur + 1, cur - 1].forEach((n) => { const q = media[(n + media.length) % media.length]; if (q && q.kind !== "video") new Image().src = api.fullUrl(q); });
  }
  const go = (d) => { cur = (cur + d + media.length) % media.length; show(); };
  $("lbPrev").onclick = () => go(-1);
  $("lbNext").onclick = () => go(1);
  $("lbClose").onclick = closeViewer;
  $("lbImg").addEventListener("click", () => setActual(!$("lbStage").classList.contains("actual")));
  $("lbImg").addEventListener("contextmenu", (e) => { if (!media[cur]?.allow_download) e.preventDefault(); });
  lb.addEventListener("click", (e) => { if (e.target === lb || e.target.id === "lbStage") closeViewer(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeViewer();
    if (e.key === "ArrowRight") go(1);
    if (e.key === "ArrowLeft") go(-1);
  });
  let tx = null;
  $("lbStage").addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  $("lbStage").addEventListener("touchend", (e) => {
    if (tx === null || $("lbStage").classList.contains("actual")) { tx = null; return; }
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
    tx = null;
  });

  /* ---------- One animation loop for everything that moves ---------- */
  let last = performance.now();
  startT = last;
  function frame(t) {
    const dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    if (!document.hidden) {
      spots.step(t, dt);
      if (scrollY < innerHeight) { danceFloor.step(dt); fog.step(t, dt); }
      stepFloaters(t);
      stepRows(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Go ---------- */
  api.listPhotos().then((all) => {
    media = all.filter((p) => !isSpeech(p));
    speechCount = all.length - media.length;
    buildFloor();
  }).catch(() => {
    $("floorEmpty").textContent = "The photos didn't load. Refresh the page to try again.";
    $("floorEmpty").hidden = false;
  });
})();
