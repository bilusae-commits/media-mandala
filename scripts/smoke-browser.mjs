import { chromium } from "playwright";

const base = "http://127.0.0.1:4173/media-mandala/";
const routes = [
  "", "pages/artikel.html", "pages/artikel-detail.html", "pages/video.html",
  "pages/podcast.html", "pages/playlist.html", "pages/playlist-detail.html",
  "pages/tentang-kami.html", "pages/kontak.html", "topics.html",
  "topics/candika-nusantara.html", "topics/candika.html", "topics/dharma-ajaran.html",
  "topics/dharmika.html", "topics/ekonomi-hindu.html", "topics/jelajah-nusantara.html",
  "topics/kabar-umat.html", "topics/spiritual.html", "topics/tokoh-hindu.html",
  "topics/tokoh.html", "topics/tradisi-budaya.html",
  "admin/index.html", "admin/dashboard.html", "admin/articles.html", "admin/article-edit.html",
  "admin/videos.html", "admin/video.html", "admin/video-edit.html", "admin/podcasts.html",
  "admin/podcast-edit.html", "admin/playlists.html", "admin/playlist-edit.html",
  "admin/categories.html", "admin/settings.html", "admin/settings-new.html", "admin/media.html",
  "admin/change-password.html", "admin/login.html"
];
const failures = [];
const warnings = [];
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.setDefaultTimeout(12000);
  page.on("pageerror", error => failures.push("Uncaught browser error: " + error.message));
  page.on("console", msg => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (/gagal dimuat|uncaught|failed to fetch|permission denied|column .* does not exist|relation .* does not exist/i.test(text)) {
        failures.push("Console error: " + text);
      } else {
        warnings.push(text);
      }
    }
  });
  page.on("response", response => {
    if (response.url().startsWith(base) && response.status() >= 400) {
      failures.push("Local HTTP " + response.status() + ": " + response.url());
    }
  });
  const results = [];
  for (const route of routes) {
    const response = await page.goto(new URL(route, base).href, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => ({
      title: document.title,
      ready: document.readyState,
      bodyLength: document.body?.innerText?.trim().length || 0,
      width: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth
    }));
    results.push({ route: route || "/", finalPath: new URL(page.url()).pathname, status: response?.status() ?? 0, title: info.title, bodyLength: info.bodyLength });
    if (!response || response.status() >= 400) failures.push("Page failed: " + route + " status=" + (response?.status() ?? "no response"));
    if (!info.title || !info.bodyLength) failures.push("Empty page/title: " + route);
    if (route === "" || route === "pages/artikel.html" || route === "pages/video.html" || route === "topics/jelajah-nusantara.html") {
      await page.setViewportSize({ width: 390, height: 844 });
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      if (dimensions.scrollWidth > dimensions.width + 2) failures.push("Mobile horizontal overflow: " + (route || "/") + " " + JSON.stringify(dimensions));
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    if (route === "") {
      const hero = await page.locator("#heroStory").count();
      if (!hero) failures.push("Homepage missing #heroStory container");
      else if (!(await page.locator("#heroStory").innerText()).trim()) failures.push("Homepage hero story container stayed empty");
    }
    if (route === "topics/jelajah-nusantara.html") {
      await page.setViewportSize({ width: 390, height: 844 });
      const menu = page.locator(".mc-mobile-menu");
      if (await menu.count()) {
        await menu.click();
        const expanded = await menu.getAttribute("aria-expanded");
        const drawer = page.locator("#mcMobileDrawer");
        if (expanded !== "true" || !(await drawer.evaluate(el => el.classList.contains("open")))) failures.push("Mobile navigation did not open on topic page");
        await page.keyboard.press("Escape");
        if (await menu.getAttribute("aria-expanded") !== "false") failures.push("Mobile navigation did not close on Escape");
      } else {
        failures.push("Accessible mobile navigation button missing on topic page");
      }
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
  }
  console.log("Browser smoke results:");
  for (const result of results) console.log(`- ${result.route}: HTTP ${result.status}; final=${result.finalPath}; title="${result.title}"; body chars=${result.bodyLength}`);
  if (warnings.length) console.log("Browser console warnings (" + warnings.length + "):\n" + warnings.slice(0, 25).map(x => "- " + x).join("\n"));
  if (failures.length) {
    console.error("Browser smoke failures (" + failures.length + "):\n" + failures.map(x => "- " + x).join("\n"));
    process.exitCode = 1;
  } else {
    console.log("All route, runtime, and mobile smoke checks passed.");
  }
} finally {
  await browser.close();
}
