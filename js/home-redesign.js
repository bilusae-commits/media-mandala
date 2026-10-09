(function () {
  "use strict";
  var config = window.MANDALA_CONFIG || {};
  var api = String(config.SUPABASE_URL || "").replace(/\/+$/, "");
  var key = config.SUPABASE_PUBLISHABLE_KEY || config.SUPABASE_ANON_KEY || "";
  var fallbackImage = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1500&q=85";
  var $ = function (selector, root) { return (root || document).querySelector(selector); };
  var esc = function (value) { return String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
  var safeUrl = function (value) { try { var url = new URL(String(value || ""), location.href); return url.protocol === "https:" || url.protocol === "http:" ? url.href : ""; } catch (_) { return ""; } };
  var imageUrl = function (value) { return safeUrl(value) || fallbackImage; };
  var dateText = function (value) { if (!value) return ""; var date = new Date(value); return Number.isNaN(date.getTime()) ? "" : new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date); };
  var excerpt = function (value, length) { var text = String(value || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(); if (!text) return "Sebuah cerita dari arsip Mandala Channel."; return text.length > length ? text.slice(0, length).replace(/[\s,.;:!?-]+$/, "") + "…" : text; };
  var slugUrl = function (slug) { return "pages/artikel-detail.html?slug=" + encodeURIComponent(String(slug || "")); };
  var state = { articles: [], videos: [], podcasts: [], categories: [] };
  var audio = $("#siteAudio");
  var dbPromise;
  function loadLibrary() {
    if (window.supabase && window.supabase.createClient) return Promise.resolve(window.supabase);
    if (dbPromise) return dbPromise;
    dbPromise = new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.onload = function () { if (window.supabase && window.supabase.createClient) resolve(window.supabase); else reject(new Error("Library Supabase tidak tersedia.")); };
      script.onerror = function () { reject(new Error("Koneksi ke layanan konten gagal dimuat.")); };
      document.head.appendChild(script);
    });
    return dbPromise;
  }
  function createClient() {
    return loadLibrary().then(function (library) {
      if (!api || !key) throw new Error("Konfigurasi sumber konten belum tersedia.");
      return library.createClient(api, key, { auth: { persistSession: false, autoRefreshToken: false } });
    });
  }
  function queryRows(db, table, columns, limit) {
    return db.from(table).select(columns).eq("status", "published").order("published_at", { ascending: false, nullsFirst: false }).limit(limit).then(function (result) {
      if (result.error) throw result.error;
      return result.data || [];
    });
  }
  function safeQueryRows(db, table, columns, limit) { return queryRows(db, table, columns, limit).catch(function (error) { console.warn("Mandala: data " + table + " belum tersedia.", error); return []; }); }
  function renderStatus(container, title, detail) {
    if (!container) return;
    container.innerHTML = '<div class="status-message"><strong>' + esc(title) + '</strong>' + esc(detail) + '</div>';
  }
  function categoryName(id) {
    var category = state.categories.find(function (item) { return item.id === id; });
    return category ? category.name : "Mandala Channel";
  }
  function cardMeta(item, category) {
    var date = dateText(item.published_at || item.created_at);
    return '<div class="feature-meta"><span>' + esc(category || categoryName(item.category_id)) + '</span>' + (date ? '<i></i><span>' + esc(date) + '</span>' : "") + '</div>';
  }
  function articleCard(item, featured) {
    var image = imageUrl(item.cover_image_url);
    var title = esc(item.title || "Cerita Mandala");
    var description = esc(excerpt(item.excerpt || item.content, featured ? 190 : 145));
    var href = slugUrl(item.slug);
    if (featured) {
      return '<a class="feature-card fade-up" href="' + esc(href) + '" style="--card-image:url(&quot;' + esc(image) + '&quot;)"><div class="feature-content"><span class="tag">' + esc(categoryName(item.category_id)) + '</span><h3>' + title + '</h3><p>' + description + '</p>' + cardMeta(item) + '</div></a>';
    }
    return '<article class="story-card fade-up"><a href="' + esc(href) + '" aria-label="Baca artikel: ' + title + '"><div class="card-image"><img loading="lazy" src="' + esc(image) + '" alt="" onerror="this.onerror=null;this.src=\'' + fallbackImage + '\'"></div><div class="story-card-copy"><span class="section-label">' + esc(categoryName(item.category_id)) + '</span><h3>' + title + '</h3><p>' + description + '</p>' + cardMeta(item) + '</div></a></article>';
  }
  function renderArticles() {
    var items = state.articles;
    var main = $("#featuredStory");
    var side = $("#supportingStories");
    var grid = $("#latestStories");
    if (!items.length) {
      renderStatus(main, "Cerita baru sedang disiapkan.", "Artikel yang dipublikasikan akan muncul di sini. Silakan kembali lagi sebentar.");
      renderStatus(side, "Belum ada cerita pilihan.", "Konten akan tampil otomatis setelah redaksi menerbitkan artikel.");
      renderStatus(grid, "Arsip sedang bertumbuh.", "Artikel terbaru akan muncul di bagian ini.");
      return;
    }
    var chosen = items.find(function (item) { return item.featured; }) || items[0];
    var remaining = items.filter(function (item) { return item.id !== chosen.id; });
    main.innerHTML = articleCard(chosen, true);
    side.innerHTML = remaining.slice(0, 2).map(function (item) {
      return '<a class="feature-small fade-up" href="' + esc(slugUrl(item.slug)) + '"><div class="card-image"><img loading="lazy" src="' + esc(imageUrl(item.cover_image_url)) + '" alt="" onerror="this.onerror=null;this.src=\'' + fallbackImage + '\'"></div><div class="feature-small-copy"><span class="section-label">' + esc(categoryName(item.category_id)) + '</span><h3>' + esc(item.title) + '</h3><p>' + esc(excerpt(item.excerpt || item.content, 90)) + '</p>' + cardMeta(item) + '</div></a>';
    }).join("") || '<div class="status-message">Cerita berikutnya akan muncul saat artikel baru diterbitkan.</div>';
    grid.innerHTML = items.filter(function (item) { return item.id !== chosen.id; }).slice(0, 6).map(function (item) { return articleCard(item, false); }).join("");
    if (!grid.innerHTML) renderStatus(grid, "Satu cerita, banyak kemungkinan.", "Artikel lainnya akan muncul setelah redaksi menerbitkan cerita baru.");
  }
  function videoId(item) {
    if (item.youtube_video_id) return String(item.youtube_video_id);
    var value = String(item.youtube_url || "");
    if (/^[\w-]{11}$/.test(value)) return value;
    try { var url = new URL(value); if (url.hostname.indexOf("youtu.be") >= 0) return url.pathname.split("/").filter(Boolean)[0] || ""; return url.searchParams.get("v") || (url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/) || [])[1] || ""; } catch (_) { return ""; }
  }
  function renderVideos() {
    var container = $("#videoCollection");
    if (!state.videos.length) { renderStatus(container, "Layar Mandala sedang menunggu cerita.", "Video yang telah dipublikasikan oleh redaksi akan tampil otomatis di sini."); return; }
    container.innerHTML = state.videos.slice(0, 3).map(function (item) {
      var id = videoId(item);
      var url = id ? "https://www.youtube.com/watch?v=" + encodeURIComponent(id) : "pages/video.html";
      var thumb = imageUrl(item.thumbnail_url || (id ? "https://i.ytimg.com/vi/" + encodeURIComponent(id) + "/hqdefault.jpg" : ""));
      return '<a class="video-card fade-up" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer"><div class="video-thumb"><img loading="lazy" src="' + esc(thumb) + '" alt="" onerror="this.onerror=null;this.src=\'' + fallbackImage + '\'"><span class="video-play" aria-hidden="true">▶</span></div><div class="video-card-copy"><span class="section-label">' + esc(categoryName(item.category_id)) + '</span><h3>' + esc(item.title || "Video Mandala") + '</h3><p>' + esc(excerpt(item.description, 105)) + '</p>' + cardMeta(item) + '</div></a>';
    }).join("");
  }
  function renderTopics() {
    var container = $("#topicCollection");
    var items = state.categories.filter(function (item) { return item.is_active !== false; }).slice(0, 4);
    var defaults = [
      { name: "Tradisi & Budaya", description: "Ritual, pengetahuan, dan praktik yang terus hidup.", slug: "tradisi-budaya" },
      { name: "Tokoh & Pemikiran", description: "Mengenal manusia dan gagasan yang menggerakkan.", slug: "tokoh-hindu" },
      { name: "Jelajah Nusantara", description: "Tempat, perjalanan, dan kisah dari berbagai wilayah.", slug: "jelajah-nusantara" },
      { name: "Dharma & Kehidupan", description: "Nilai yang menemukan maknanya dalam keseharian.", slug: "dharma-kehidupan" }
    ];
    var list = items.length ? items : defaults;
    container.innerHTML = list.map(function (item, index) {
      var knownTopics = ["candika-nusantara", "dharma-ajaran", "dharmika", "ekonomi-hindu", "jelajah-nusantara", "kabar-umat", "spiritual", "tokoh-hindu", "tradisi-budaya", "candika", "tokoh"];
      var href = item.slug && knownTopics.indexOf(String(item.slug).toLowerCase()) >= 0 ? "topics/" + encodeURIComponent(item.slug) + ".html" : "pages/artikel.html";
      return '<a class="topic-card fade-up" href="' + esc(href) + '"><span class="topic-number">0' + (index + 1) + ' / RUBRIK</span><div><h3>' + esc(item.name) + '</h3><p>' + esc(excerpt(item.description || "Jelajahi cerita pilihan dari Mandala Channel.", 88)) + '</p></div><span class="topic-arrow" aria-hidden="true">↗</span></a>';
    }).join("");
  }
  function renderAudio() {
    var container = $("#audioCollection");
    var items = state.podcasts.filter(function (item) { return item.content_type === "audio" && safeUrlForAudio(item.audio_url); }).slice(0, 5);
    if (!items.length) { renderStatus(container, "Dengarkan Mandala segera.", "Episode audio akan muncul di sini ketika redaksi menerbitkannya."); return; }
    container.innerHTML = items.map(function (item, index) {
      var duration = Number(item.audio_duration);
      var durationText = Number.isFinite(duration) && duration > 0 ? Math.floor(duration / 60) + ":" + String(Math.floor(duration % 60)).padStart(2, "0") : "Audio";
      return '<div class="audio-item"><button class="audio-play" type="button" data-audio-index="' + index + '" aria-label="Putar ' + esc(item.title) + '" aria-pressed="false">▶</button><div><h3>' + esc(item.title) + '</h3><p>' + esc(excerpt(item.description, 110)) + '</p></div><span class="audio-duration">' + esc(durationText) + '</span></div>';
    }).join("");
    container.querySelectorAll("[data-audio-index]").forEach(function (button) {
      button.addEventListener("click", function () {
        var item = items[Number(button.getAttribute("data-audio-index"))];
        if (!item || !audio) return;
        var selectedUrl = safeUrlForAudio(item.audio_url);
        var isSameTrack = audio.src === selectedUrl;
        if (!isSameTrack) audio.src = selectedUrl;
        var title = $("#audioNowTitle"), status = $("#audioNowStatus");
        if (title) title.textContent = item.title;
        if (status) status.textContent = "Mandala Audio · " + categoryName(item.category_id);
        container.querySelectorAll("[data-audio-index]").forEach(function (other) { other.setAttribute("aria-pressed", String(other === button)); other.textContent = other === button ? "Ⅱ" : "▶"; });
        if (isSameTrack && !audio.paused) { audio.pause(); button.textContent = "▶"; button.setAttribute("aria-pressed", "false"); }
        else audio.play().catch(function () { if (status) status.textContent = "Audio tidak dapat diputar. Periksa tautan berkas atau coba episode lain."; });
      });
    });
  }
  function safeUrlForAudio(value) { var url = safeUrl(value); return url && /^https?:$/.test(new URL(url).protocol) ? url : ""; }
  function setupNavigation() {
    var toggle = $("#navToggle"), panel = $("#mobileNav");
    if (!toggle || !panel) return;
    function close() { toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Buka navigasi"); panel.classList.remove("is-open"); panel.setAttribute("aria-hidden", "true"); document.body.classList.remove("nav-open"); }
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") !== "true";
      toggle.setAttribute("aria-expanded", String(open)); toggle.setAttribute("aria-label", open ? "Tutup navigasi" : "Buka navigasi"); panel.classList.toggle("is-open", open); panel.setAttribute("aria-hidden", String(!open)); document.body.classList.toggle("nav-open", open);
    });
    panel.querySelectorAll("a").forEach(function (link) { link.addEventListener("click", close); });
    document.addEventListener("keydown", function (event) { if (event.key === "Escape") close(); });
    window.addEventListener("resize", function () { if (window.innerWidth > 760) close(); });
  }
  function setupYear() { var node = $("#footerYear"); if (node) node.textContent = String(new Date().getFullYear()); }
  function loadHomepageSettings() {
    if (!api || !key) return Promise.resolve();
    return fetch(api + "/rest/v1/homepage_settings?select=*&limit=1", { headers: { apikey: key, Authorization: "Bearer " + key } })
      .then(function (response) { if (!response.ok) return null; return response.json(); })
      .then(function (rows) {
        var settings = Array.isArray(rows) ? rows[0] : null;
        if (!settings) return;
        var title = String(settings.hero_title || "").trim();
        var description = String(settings.hero_description || "").trim();
        var titleNode = $("#heroTitle");
        if (title && titleNode) titleNode.textContent = title;
        if (description && $("#heroDescription")) $("#heroDescription").textContent = description;
        var image = safeUrl(settings.hero_image_main || settings.hero_overlay_image);
        if (image) $(".hero").style.setProperty("--hero-image", 'url("' + image.replace(/["\\]/g, "") + '")');
        var background = String(settings.hero_background_color || "");
        if (/^#[0-9a-f]{3,8}$/i.test(background)) $(".hero").style.backgroundColor = background;
      }).catch(function () { /* Optional CMS settings: the editorial fallback remains available. */ });
  }
  function boot() {
    setupNavigation(); setupYear(); renderTopics();
    if (!api || !key) {
      renderStatus($("#featuredStory"), "Konten belum terhubung.", "Konfigurasi Supabase belum tersedia pada halaman publik.");
      renderStatus($("#supportingStories"), "Sumber konten belum tersedia.", "Hubungkan konfigurasi Supabase untuk menampilkan artikel.");
      renderStatus($("#latestStories"), "Arsip belum terhubung.", "Konfigurasi Supabase belum tersedia.");
      renderStatus($("#videoCollection"), "Video belum terhubung.", "Konfigurasi Supabase belum tersedia.");
      renderStatus($("#audioCollection"), "Audio belum terhubung.", "Konfigurasi Supabase belum tersedia.");
      return;
    }
    Promise.allSettled([
      createClient().then(function (db) { return Promise.all([
        safeQueryRows(db, "articles", "id,title,slug,excerpt,content,cover_image_url,category_id,featured,published_at,created_at", 12),
        safeQueryRows(db, "videos", "id,title,slug,youtube_url,youtube_video_id,thumbnail_url,description,category_id,featured,published_at,created_at", 6),
        safeQueryRows(db, "podcasts", "id,title,slug,description,cover_image_url,content_type,audio_url,audio_duration,youtube_url,youtube_video_id,category_id,featured,published_at,created_at", 8),
        db.from("categories").select("id,name,slug,description,is_active,sort_order").eq("is_active", true).order("sort_order", { ascending: true }).limit(12).then(function (result) { if (result.error) { console.warn("Mandala: kategori belum tersedia.", result.error); return []; } return result.data || []; })
      ]); })
    ]).then(function (results) {
      var payload = results[0];
      if (payload.status !== "fulfilled") {
        var message = payload.reason && payload.reason.message ? payload.reason.message : "Sumber konten sementara tidak dapat dijangkau.";
        renderStatus($("#featuredStory"), "Cerita belum dapat dimuat.", message);
        renderStatus($("#supportingStories"), "Koneksi sedang bermasalah.", "Coba muat ulang halaman beberapa saat lagi.");
        renderStatus($("#latestStories"), "Arsip belum dapat dimuat.", "Silakan coba kembali setelah koneksi pulih.");
        renderStatus($("#videoCollection"), "Video belum dapat dimuat.", "Silakan coba kembali setelah koneksi pulih.");
        renderStatus($("#audioCollection"), "Audio belum dapat dimuat.", "Silakan coba kembali setelah koneksi pulih.");
        return;
      }
      var values = payload.value;
      state.articles = values[0] || []; state.videos = values[1] || []; state.podcasts = values[2] || []; state.categories = values[3] || [];
      renderTopics(); renderArticles(); renderVideos(); renderAudio();
    });
    loadHomepageSettings();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true }); else boot();
})();