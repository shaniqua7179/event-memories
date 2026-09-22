// Real browser test: share 2 good photos + 1 broken file through the guest form on the sandbox event.
// Expect: the 2 good ones go through, the Thank You screen shows, and the broken one is listed with a retry button.
const puppeteer = require("puppeteer-core");
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const url = process.argv[2];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(url + "?share=1", { waitUntil: "networkidle2" });
  await wait(1500);
  const result = await page.evaluate(async () => {
    const make = (hue, name) => new Promise((r) => { const c = document.createElement("canvas"); c.width = name.startsWith("BIG") ? 8000 : 3024; c.height = name.startsWith("BIG") ? 6000 : 4032; const x = c.getContext("2d"); x.fillStyle = `hsl(${hue},60%,50%)`; x.fillRect(0, 0, 3024, 4032); x.fillStyle = "#fff"; x.font = "300px sans-serif"; x.fillText(name, 400, 2000); c.toBlob((b) => r(new File([b], name + ".jpg", { type: "image/jpeg" })), "image/jpeg", 0.9); });
    const good1 = await make(Math.random() * 360, "GOOD-" + Date.now());
    const bad = new File([new Uint8Array([9, 9, 9, 9, 9, 9])], "IMG_BROKEN.jpg", { type: "image/jpeg" });
    const good2 = await make(Math.random() * 360, "BIG-" + Date.now());
    const dt = new DataTransfer(); [good1, bad, good2].forEach((f) => dt.items.add(f));
    const input = document.getElementById("fileInput");
    input.files = dt.files; input.dispatchEvent(new Event("change", { bubbles: true }));
    document.getElementById("upName").value = "Claude test";
    document.getElementById("upSubmit").click();
    for (let i = 0; i < 60; i++) { await new Promise((r) => setTimeout(r, 500)); if (!document.getElementById("upDone").hidden || /didn't go through/.test(document.getElementById("upMsg").textContent)) break; }
    return {
      thankYouShown: !document.getElementById("upDone").hidden,
      thankYou: document.getElementById("upDoneText").textContent,
      failBoxShown: !document.getElementById("upFail").hidden,
      failText: document.getElementById("upFailText").textContent,
      failList: document.getElementById("upFailList").textContent,
      retryLabel: document.getElementById("upRetry").textContent
    };
  });
  // Retry just the broken one: form should reopen with exactly 1 item
  await page.evaluate(() => document.getElementById("upRetry").click());
  await wait(800);
  result.afterRetryItems = await page.evaluate(() => document.querySelectorAll("#picked > div").length);
  result.afterRetryFormShown = await page.evaluate(() => !document.getElementById("upForm").hidden);
  console.log(JSON.stringify(result, null, 2), errors.length ? "PAGE ERRORS: " + errors.join(" | ") : "no page errors");
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
