// Screenshot the experience at real device sizes using the installed Microsoft Edge.
// Usage: node tools/shoot.js <url> <outDir>
const puppeteer = require("puppeteer-core");
const path = require("path");

const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const [url, outDir] = process.argv.slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const devices = [
  { name: "desktop", viewport: { width: 1440, height: 900, deviceScaleFactor: 1 } },
  { name: "phone", viewport: { width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" }
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: EDGE, headless: "new", args: ["--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"] });
  for (const d of devices) {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
    if (d.ua) await page.setUserAgent(d.ua);
    await page.setViewport(d.viewport);
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
    await wait(4500);
    await page.screenshot({ path: path.join(outDir, `${d.name}-1-entrance.png`) });
    // ENTER transition: capture the flash moment, then the floor
    await page.click("#enterBtn");
    await wait(330);
    await page.screenshot({ path: path.join(outDir, `${d.name}-2-flash.png`) });
    await wait(2600);
    await page.screenshot({ path: path.join(outDir, `${d.name}-3-floor.png`) });
    const info = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth, vw: innerWidth,
      tracks: document.querySelectorAll(".track").length, tiles: document.querySelectorAll(".tile").length,
      count: document.getElementById("floorCount").textContent, fab: document.getElementById("shareFab").classList.contains("show"),
      video: document.getElementById("roomVideo").currentSrc.split("/").pop(), playing: !document.getElementById("roomVideo").paused
    }));
    // Open the viewer on a tile
    await page.evaluate(() => document.querySelector(".track.front .tile, .tile").click());
    await wait(1400);
    await page.screenshot({ path: path.join(outDir, `${d.name}-4-viewer.png`) });
    console.log(d.name, JSON.stringify(info), errors.length ? "ERRORS: " + errors.join(" | ") : "no errors");
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
