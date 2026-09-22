// Find visually duplicate photos (same picture, different file) using a 64-bit difference hash
// computed in a real browser from each photo's thumbnail, the same way the upload page will.
// Output: JSON with each photo's hash and groups of near-identical photos.
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const cfg = fs.readFileSync("C:/Users/User/OneDrive/Desktop/EPPS60TH/memories/config.js", "utf8");
const URL_ = cfg.match(/supabaseUrl: "([^"]+)"/)[1];
const KEY = cfg.match(/supabaseAnonKey: "([^"]+)"/)[1];
const out = process.argv[2];

(async () => {
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
  const photos = await (await fetch(`${URL_}/rest/v1/photos?select=id,name,created_at,thumb_path,kind,width,height&event_id=eq.epps60th&status=eq.approved&kind=eq.photo&order=created_at`, { headers: H })).json();
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  await page.goto("https://home-preview--epps60th.netlify.app/memories/", { waitUntil: "domcontentloaded" });
  const hashes = await page.evaluate(async (list, base) => {
    // dHash: shrink to 9x8 grey, compare each pixel with its right neighbour -> 64 bits
    function dhash(img) {
      const mid = document.createElement("canvas"); const s = Math.min(1, 480 / Math.max(img.naturalWidth, img.naturalHeight));
      mid.width = Math.max(1, Math.round(img.naturalWidth * s)); mid.height = Math.max(1, Math.round(img.naturalHeight * s));
      const m = mid.getContext("2d"); m.imageSmoothingQuality = "high"; m.drawImage(img, 0, 0, mid.width, mid.height);
      const c = document.createElement("canvas"); c.width = 9; c.height = 8;
      const x = c.getContext("2d"); x.imageSmoothingQuality = "high"; x.drawImage(mid, 0, 0, 9, 8);
      const d = x.getImageData(0, 0, 9, 8).data; const g = [];
      for (let i = 0; i < 72; i++) g.push(d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114);
      let bits = 0n;
      for (let r = 0; r < 8; r++) for (let col = 0; col < 8; col++) bits = (bits << 1n) | (g[r * 9 + col] > g[r * 9 + col + 1] ? 1n : 0n);
      return BigInt.asIntN(64, bits).toString();
    }
    const res = [];
    for (const p of list) {
      const img = new Image(); img.crossOrigin = "anonymous";
      await new Promise((ok) => { img.onload = ok; img.onerror = ok; img.src = base + p.thumb_path; });
      res.push(img.naturalWidth ? dhash(img) : null);
    }
    return res;
  }, photos, `${URL_}/storage/v1/object/public/memories/`);
  await browser.close();
  photos.forEach((p, i) => (p.phash = hashes[i]));
  const dist = (a, b) => { let x = BigInt.asUintN(64, BigInt(a) ^ BigInt(b)), n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };
  const pairs = [];
  for (let i = 0; i < photos.length; i++) for (let j = i + 1; j < photos.length; j++) {
    if (!photos[i].phash || !photos[j].phash) continue;
    const d = dist(photos[i].phash, photos[j].phash);
    if (d <= 10) pairs.push({ a: i, b: j, d });
  }
  pairs.sort((x, y) => x.d - y.d);
  fs.writeFileSync(out, JSON.stringify({ photos, pairs }, null, 1));
  console.log(`${photos.length} photos hashed; ${pairs.length} pairs within distance 10`);
  pairs.slice(0, 40).forEach((p) => console.log(`d=${p.d}  #${p.a + 1} (${photos[p.a].name}, ${photos[p.a].created_at.slice(0, 19)})  ~  #${p.b + 1} (${photos[p.b].name}, ${photos[p.b].created_at.slice(0, 19)})`));
})().catch((e) => { console.error(e); process.exit(1); });
