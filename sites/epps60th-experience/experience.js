/* =========================================================================
   Oh, What a Night · experience engine for Scenes 1 & 2
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

  /* ---------- Background video: phone or desktop cut, poster first, never on data-saver / reduced motion ---------- */
  const poster = isPhone ? "media/disco-mobile.jpg" : "media/disco-desktop.jpg";
  document.querySelector(".room-base").style.setProperty("--poster", `url("${poster}")`);
  const video = $("roomVideo");
  if (!reduceMotion && !saveData) {
    video.src = isPhone ? "media/disco-mobile.mp4" : "media/disco-desktop.mp4";
    video.addEventListener("playing", () => { video.classList.add("is-playing"); document.querySelector(".room").classList.add("video-on"); }, { once: true });
    const tryPlay = () => video.play().catch(() => {});
    tryPlay();
    document.addEventListener("visibilitychange", () => (document.hidden ? video.pause() : tryPlay()));
    // iOS low-power mode blocks autoplay until the first touch
    document.addEventListener("touchstart", tryPlay, { once: true, passive: true });
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
    const colors = ["255,255,255", "255,255,255", "215,240,255", "255,150,215", "190,170,255", "160,240,255", "255,215,160"];
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

  /* ---------- Load the real photos from the existing app layer ---------- */
  let media = []; // photos + dance-floor videos (speeches stay in their own section)
  const isSpeech = (p) => p.kind === "video" && p.category && p.category !== "moment";

  /* ---------- Scene 1 · floating photographs ---------- */
  const floaters = [];
  const slotsDesktop = [
    { x: "4%", y: "12%", w: "13vw", r: -7, depth: 0.5, far: false },
    { x: "80%", y: "8%", w: "12vw", r: 6, depth: 0.35, far: true },
    { x: "2%", y: "58%", w: "11vw", r: 5, depth: 0.3, far: true },
    { x: "83%", y: "54%", w: "14vw", r: -5, depth: 0.6, far: false },
    { x: "17%", y: "78%", w: "9vw", r: -3, depth: 0.25, far: true },
    { x: "68%", y: "80%", w: "10vw", r: 4, depth: 0.45, far: false }
  ];
  const slotsPhone = [
    { x: "-6%", y: "6%", w: "36vw", r: -8, depth: 0.4, far: false },
    { x: "70%", y: "3%", w: "34vw", r: 7, depth: 0.3, far: true },
    { x: "74%", y: "34%", w: "28vw", r: -5, depth: 0.25, far: true },
    { x: "-8%", y: "38%", w: "26vw", r: 6, depth: 0.2, far: true }
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
      el.innerHTML = `<div class="print"><img src="${esc(api.thumbUrl(p))}" alt="" decoding="async"></div>`;
      layer.appendChild(el);
      floaters.push({ el, s, ph: rand(0, Math.PI * 2), ax: rand(8, 20), ay: rand(10, 24), speed: rand(0.00018, 0.00032), shown: false, delay: 1600 + i * 260 });
    });
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
    ? [{ h: "clamp(130px, 21vh, 190px)", speed: 16, dir: 1, cls: "back" },
       { h: "clamp(170px, 29vh, 260px)", speed: 24, dir: -1, cls: "front" },
       { h: "clamp(120px, 19vh, 170px)", speed: 12, dir: 1, cls: "back" }]
    : [{ h: "clamp(150px, 22vh, 230px)", speed: 18, dir: 1, cls: "back" },
       { h: "clamp(210px, 33vh, 360px)", speed: 30, dir: -1, cls: "front" },
       { h: "clamp(140px, 20vh, 210px)", speed: 13, dir: 1, cls: "back" },
       { h: "clamp(180px, 27vh, 300px)", speed: 23, dir: -1, cls: "mid" }];
  const rows = [];
  let floorVisible = false;

  function tileHtml(p) {
    const ar = Math.min(1.7, Math.max(0.62, (p.width || 4) / (p.height || 3)));
    const video = p.kind === "video";
    const dur = p.duration_ms ? `${Math.floor(p.duration_ms / 60000)}:${String(Math.round((p.duration_ms % 60000) / 1000)).padStart(2, "0")}` : "Video";
    return `<button class="tile" data-id="${esc(p.id)}" style="--ar:${ar.toFixed(3)};--rot:${rand(-2.4, 2.4).toFixed(2)}deg;--ty:${rand(-10, 10).toFixed(0)}px" aria-label="Open ${video ? "video" : "photo"} shared by ${esc(p.name)}">
      <img src="${esc(api.thumbUrl(p))}" alt="" loading="lazy" decoding="async">${video ? `<span class="vtag">${dur}</span>` : ""}</button>`;
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
      const set = items.map(tileHtml).join("");
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
      rows.push(row);
    });
    addEventListener("resize", () => rows.forEach((r) => (r.setW = r.track.querySelector(".set").getBoundingClientRect().width)));
  }
  function stepRows(dt) {
    if (reduceMotion || !floorVisible || document.body.classList.contains("lb-open")) return;
    for (const r of rows) {
      if (!r.setW) continue;
      r.speedNow += (r.speedTarget - r.speedNow) * Math.min(1, dt * 4);
      r.off = (r.off + r.speedNow * dt) % r.setW;
      const x = r.cfg.dir > 0 ? r.off - r.setW : -r.off;
      r.belt.style.transform = `translate3d(${x.toFixed(1)}px,0,0)`;
    }
  }
  new IntersectionObserver(([e]) => {
    floorVisible = e.isIntersecting;
    if (e.isIntersecting) $("floor").classList.add("is-in");
  }, { threshold: 0.08 }).observe($("floor"));

  $("tracks").addEventListener("click", (e) => {
    const b = e.target.closest(".tile");
    if (!b) return;
    const r = b.getBoundingClientRect();
    openViewer(media.findIndex((p) => p.id === b.dataset.id), `${((r.left + r.width / 2) / innerWidth) * 100}%`, `${((r.top + r.height / 2) / innerHeight) * 100}%`);
  });

  /* ---------- Viewer: same window, swipe, full size, close returns you to the floor ---------- */
  const lb = $("lb");
  let cur = -1, lastFocus = null;
  function openViewer(i, fx, fy) {
    if (i < 0) return;
    lastFocus = document.activeElement;
    cur = i;
    lb.hidden = false;
    document.body.classList.add("lb-open");
    flash(0.35, fx, fy);
    show();
    $("lbClose").focus();
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
      img.src = api.thumbUrl(p);
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
      stepFloaters(t);
      stepRows(dt);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- Go ---------- */
  api.listPhotos().then((all) => {
    media = all.filter((p) => !isSpeech(p));
    buildFloaters(media);
    buildFloor();
  }).catch(() => {
    $("floorEmpty").textContent = "The photos didn't load. Refresh the page to try again.";
    $("floorEmpty").hidden = false;
  });
})();
