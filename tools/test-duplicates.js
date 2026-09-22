// Real browser test on the sandbox event:
// round 1: share photo A. round 2: share A again (same name+size), A re-saved under a new name (different file, same picture), and new photo B.
// Expect round 2 to add only B and report 2 already part of the party.
const puppeteer = require("puppeteer-core");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const url = process.argv[2];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
  await page.goto(url + "?share=1", { waitUntil: "networkidle2" });
  await wait(1500);
  const result = await page.evaluate(async () => {
    const seed = Date.now();
    const draw = (hue, label, quality, name) => new Promise((r) => {
      const c = document.createElement("canvas"); c.width = 2400; c.height = 1800; const x = c.getContext("2d");
      const g = x.createLinearGradient(0, 0, 2400, 1800); g.addColorStop(0, `hsl(${hue},70%,55%)`); g.addColorStop(1, `hsl(${(hue + 140) % 360},60%,25%)`);
      x.fillStyle = g; x.fillRect(0, 0, 2400, 1800); x.fillStyle = "#fff"; x.beginPath(); x.arc(700, 900, 420, 0, 7); x.fill();
      x.fillStyle = "#111"; x.fillRect(1400, 400, 700, 1000); x.font = "160px sans-serif"; x.fillText(label, 300, 1650);
      c.toBlob((b) => r(new File([b], name, { type: "image/jpeg" })), "image/jpeg", quality);
    });
    const hue = seed % 360;
    const A = await draw(hue, "A" + seed, 0.92, `IMG_A_${seed}.jpg`);
    const Aresaved = await draw(hue, "A" + seed, 0.70, `1000${seed}.jpg`);        // same picture, different file
    const B = await draw((hue + 180) % 360, "B" + seed, 0.9, `IMG_B_${seed}.jpg`);
    async function share(files) {
      const dt = new DataTransfer(); files.forEach((f) => dt.items.add(f));
      const input = document.getElementById("fileInput");
      input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
      document.getElementById("upName").value = "Claude dup test";
      document.getElementById("upSubmit").click();
      for (let i = 0; i < 80; i++) { await new Promise((r) => setTimeout(r, 500)); if (!document.getElementById("upDone").hidden) break; }
      return { title: document.getElementById("upDoneTitle").textContent, text: document.getElementById("upDoneText").textContent };
    }
    const round1 = await share([A]);
    document.getElementById("upMore").click(); await new Promise((r) => setTimeout(r, 400));
    // "Share more" opens the phone picker; reset the form view for the test
    document.getElementById("upForm").hidden = false; document.getElementById("upDone").hidden = true;
    const round2 = await share([A, Aresaved, B]);
    return { round1, round2 };
  });
  console.log(JSON.stringify(result, null, 2), errors.length ? "PAGE ERRORS: " + errors.join(" | ") : "no page errors");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
