import { chromium } from "playwright";

const base = process.env.MANDALA_BASE_URL || "http://127.0.0.1:4173/media-mandala/";
const routes = [
  "", "pages/artikel.html", "pages/artikel-detail.html", "pages/artikel-detail.html?slug=menjaga-tradisi-hindu-jawa-di-tengah-perubahan-zaman", "pages/video.html",
  "pages/podcast.html", "pages/playlist.html", "pages/playlist-detail.html", "pages/playlist-detail.html?slug=jelajah-nusantara",
  "pages/tentang-kami.html", "pages/kontak.html", "topics.html",
  "topics/candika-nusantara.html", "topics/candika.html", "topics/dharma-ajaran.html",
  "topics/dharmika.html", "topics/ekonomi-hindu.html", "topics/jelajah-nusantara.html",
  "topics/kabar-umat.html", "topics/spiritual.html", "topics/tokoh-hindu.html",
  "topics/tokoh.html", "topics/tradisi-budaya.html",
  "admin/index.html", "admin/dashboard.html", "admin/articles.html", "admin/article-edit.html",
  "admin/videos.html", "admin/video.html", "admin/video-edit.html", "admin/podcasts.html",
  "admin/podcast-edit.html", "admin/playlists.html", "admin/playlist-edit.html",
  "admin/categories.html", "admin/settings.html", "admin/settings-new.html", "admin/media.html",
  "admin/change-password.html", "admin/change-password.html#type=recovery", "admin/login.html"
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
    const finalPath = new URL(page.url()).pathname;
    if (route.startsWith("admin/") && route !== "admin/login.html" && route !== "admin/article-edit.html" && route !== "admin/change-password.html#type=recovery" && !finalPath.endsWith("/admin/login.html")) {
      failures.push("Unauthenticated admin route did not return to login: " + route + " final=" + finalPath);
    }
    if (route === "admin/article-edit.html") {
      await page.waitForTimeout(900);
      if (!(await page.locator("body").innerText()).includes("Sesi Admin/Editor tidak ditemukan")) {
        failures.push("Article editor did not block unauthenticated access with a session warning");
      }
    }
    if (route === "admin/login.html") {
      if (!(await page.locator("#email").count()) || !(await page.locator("#password").count())) failures.push("Admin login form is missing email/password fields");
    }
    if (route === "admin/change-password.html#type=recovery") {
      if (!(await page.locator("#new_password").count()) || !(await page.locator("#confirm_password").count())) failures.push("Password recovery link did not open the new-password form");
    }
    results.push({ route: route || "/", finalPath: new URL(page.url()).pathname, status: response?.status() ?? 0, title: info.title, bodyLength: info.bodyLength });
    if (!response || response.status() >= 400) failures.push("Page failed: " + route + " status=" + (response?.status() ?? "no response"));
    if (!info.title || !info.bodyLength) failures.push("Empty page/title: " + route);
    if (route === "" || route === "pages/artikel.html" || route === "pages/video.html" || route === "topics/jelajah-nusantara.html") {
      await page.setViewportSize({ width: 390, height: 844 });
      const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
      if (dimensions.scrollWidth > dimensions.width + 2) failures.push("Mobile horizontal overflow: " + (route || "/") + " " + JSON.stringify(dimensions));
      await page.setViewportSize({ width: 1440, height: 1000 });
    }
    if (route === "pages/artikel-detail.html?slug=menjaga-tradisi-hindu-jawa-di-tengah-perubahan-zaman") {
      await page.waitForTimeout(1200);
      if (!(await page.locator("body").innerText()).replace(/\s+/g, " ").includes("Menjaga Tradisi Hindu Jawa")) failures.push("Published article detail did not render for a real slug");
    }
    if (route === "pages/playlist-detail.html?slug=jelajah-nusantara") {
      await page.waitForTimeout(800);
      if (!(await page.locator("body").innerText()).replace(/\s+/g, " ").toLocaleLowerCase("id-ID").includes("jelajah nusantara")) failures.push("Published playlist detail did not render for a real slug");
    }
    if (route === "pages/podcast.html") {
      await page.waitForTimeout(1200);
      const audioCount = await page.locator("#audioCount").innerText().catch(() => "");
      if (!/^[1-9]\d* episode$/.test(audioCount.trim())) failures.push("Podcast audio list did not render published audio items: " + audioCount);
      const audioSource = await page.locator("#audioGrid audio").first().getAttribute("src").catch(() => null);
      if (!audioSource) {
        failures.push("Published podcast audio has no playable source URL");
      } else {
        try {
          const audioProbe = await page.evaluate(async source => {
            const response = await fetch(source, { method: "HEAD" });
            return { status: response.status, type: response.headers.get("content-type") || "" };
          }, new URL(audioSource, page.url()).href);
          if (audioProbe.status !== 200 || !audioProbe.type.toLowerCase().startsWith("audio/")) {
            failures.push("Podcast audio endpoint probe failed: " + JSON.stringify(audioProbe));
          }
        } catch (error) {
          failures.push("Podcast audio endpoint could not be reached: " + error.message);
        }
      }
    }
    if (route === "pages/video.html") {
      await page.waitForTimeout(1200);
      const grid = page.locator("#videoGrid");
      if (!(await grid.count())) failures.push("Video archive grid is missing");
      else if (!(await grid.innerText()).replace(/\s+/g, " ").toLocaleUpperCase("id-ID").includes("MURWA CANDIKA")) failures.push("Video archive did not render a known published video");
      const firstVideo = grid.locator("[data-video-index]").first();
      if (await firstVideo.count()) {
        await firstVideo.click();
        const modal = page.locator("#modal");
        if (!(await modal.evaluate(el => el.classList.contains("open")))) failures.push("Video click did not open the player modal");
        if (!(await page.locator("#videoFrame").getAttribute("src"))) failures.push("Video player iframe source was not set");
        await page.locator("#closeModal").click();
        if (await modal.getAttribute("aria-hidden") !== "true") failures.push("Video player modal did not close accessibly");
      } else {
        failures.push("Video archive has no playable video cards");
      }
    }
    if (route === "") {
      await page.waitForFunction(() => document.body.classList.contains("homepage-ready"), null, { timeout: 5000 }).catch(() => failures.push("Homepage CMS settings did not finish initialization"));
      await page.waitForTimeout(500);
      const hero = await page.locator("#heroStory").count();
      if (!hero) failures.push("Homepage missing #heroStory container");
      else if (!(await page.locator("#heroStory").innerText()).trim()) failures.push("Homepage hero story container stayed empty");
      const heroState = await page.evaluate(() => {
        const section = document.querySelector(".world-origin");
        return {
          title: (document.querySelector(".origin-copy h1")?.innerText || "").replace(/\s+/g, " ").trim(),
          primary: document.getElementById("heroPrimary")?.href || "",
          secondary: document.getElementById("heroSecondary")?.href || "",
          background: getComputedStyle(section).getPropertyValue("--hero-background-color").trim(),
          mainImage: getComputedStyle(section).getPropertyValue("--hero-main-image").trim(),
          overlayImage: getComputedStyle(section).getPropertyValue("--hero-overlay-image").trim(),
          opacity: getComputedStyle(section).getPropertyValue("--hero-overlay-opacity").trim()
        };
      });
      if (!heroState.title.includes("Yang hidup tak pernah diam.")) failures.push("CMS hero title did not load");
      if (!heroState.primary.endsWith("/pages/artikel.html")) failures.push("CMS primary hero CTA target is incorrect");
      if (!heroState.secondary.endsWith("/pages/podcast.html")) failures.push("CMS secondary hero CTA target is incorrect");
      if (!heroState.background || !heroState.mainImage.includes("url(")) failures.push("CMS hero background/main image settings did not load");
      if (heroState.overlayImage && !heroState.overlayImage.includes("url(")) failures.push("CMS hero overlay image URL is invalid");
      if (heroState.mainImage.includes("url(")) {
        const imageUrl = heroState.mainImage.match(/^url\(["']?(.*?)["']?\)$/)?.[1];
        if (!imageUrl) {
          failures.push("CMS hero main image CSS URL could not be parsed");
        } else {
          const imageProbe = await page.evaluate(async source => {
            const image = new Image();
            image.src = source;
            try { await image.decode(); return { ok: true, width: image.naturalWidth }; }
            catch { return { ok: false, width: image.naturalWidth }; }
          }, imageUrl);
          if (!imageProbe.ok || imageProbe.width < 1) failures.push("CMS hero main image failed to load: " + imageUrl);
        }
      }
      if (Math.abs(Number(heroState.opacity) - 0.18) > 0.01) failures.push("CMS hero overlay opacity was not applied");
    }
    if (route === "pages/artikel.html") {
      await page.waitForTimeout(1200);
      if (!(await page.locator("body").innerText()).replace(/\s+/g, " ").includes("Menjaga Tradisi Hindu Jawa di Tengah Perubahan Zaman")) failures.push("Published article list did not render a known published story");
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
