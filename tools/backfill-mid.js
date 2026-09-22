// One-time: create the ~1200px "mid" copy for photos uploaded before mid copies existed.
// Uses the same public upload rules guests use (only {event}/{id}/mid.jpg while sharing is open).
// Edited (cropped) photos are skipped; they fall back to their full-size copy.
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const ffmpeg = require("ffmpeg-static");

const cfg = fs.readFileSync("C:/Users/User/OneDrive/Desktop/EPPS60TH/memories/config.js", "utf8");
const URL_ = cfg.match(/supabaseUrl: "([^"]+)"/)[1];
const KEY = cfg.match(/supabaseAnonKey: "([^"]+)"/)[1];
const EVENT = process.argv[2] || "epps60th";
const tmp = path.join(process.env.TEMP || ".", "mid-backfill");
fs.mkdirSync(tmp, { recursive: true });
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

(async () => {
  const list = await (await fetch(`${URL_}/rest/v1/photos?select=id,full_path,mid_path,original_path&event_id=eq.${EVENT}&status=eq.approved&mid_path=is.null&original_path=is.null`, { headers: H })).json();
  console.log(`${list.length} photos need a mid copy`);
  let ok = 0, fail = 0;
  for (const p of list) {
    const src = path.join(tmp, `${p.id}-full.jpg`), out = path.join(tmp, `${p.id}-mid.jpg`);
    try {
      const r = await fetch(`${URL_}/storage/v1/object/public/memories/${p.full_path}`);
      if (!r.ok) throw new Error("download " + r.status);
      fs.writeFileSync(src, Buffer.from(await r.arrayBuffer()));
      execFileSync(ffmpeg, ["-hide_banner", "-loglevel", "error", "-y", "-i", src, "-vf", "scale='if(gt(iw,ih),min(1200,iw),-2)':'if(gt(iw,ih),-2,min(1200,ih))':flags=lanczos", "-q:v", "3", out]);
      const midPath = p.full_path.replace(/full\.jpg$/, "mid.jpg");
      const up = await fetch(`${URL_}/storage/v1/object/memories/${midPath}`, { method: "POST", headers: { ...H, "Content-Type": "image/jpeg", "cache-control": "31536000", "x-upsert": "false" }, body: fs.readFileSync(out) });
      if (!up.ok && up.status !== 409) throw new Error("upload " + up.status + " " + (await up.text()).slice(0, 120));
      ok++;
    } catch (e) { fail++; console.log("FAILED", p.id, e.message); }
    finally { [src, out].forEach((f) => { try { fs.unlinkSync(f); } catch {} }); }
  }
  console.log(`done: ${ok} created, ${fail} failed`);
})();
