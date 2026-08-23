/*
  MANDALA CHANNEL — TOPIC SYNC
  Public topic pages use this module to read published articles from Supabase.
  It never changes index.html and it preserves each topic page's visual design.
*/
(() => {
  "use strict";

  const SUPABASE_URL = "https://roeckoabffhyctfkvbhw.supabase.co";
  const SUPABASE_KEY = "sb_publishable_rtbdvp4WdU4xMjn9Hyz4SQ_zIWkzWAr";

  const topicMap = {
    "candika-nusantara": "candika",
    "dharma-ajaran": "dharma-ajaran",
    "dharmika": "dharmika",
    "ekonomi-hindu": "ekonomi-hindu",
    "jelajah-nusantara": "jelajah-nusantara",
    "kabar-umat": "kabar-umat",
    "spiritual": "spiritual",
    "tokoh-hindu": "tokoh-hindu",
    "tradisi-budaya": "tradisi-budaya"
  };

  const page = location.pathname.split("/").pop().replace(/\.html$/i, "");
  const categorySlug = topicMap[page];
  if (!categorySlug || !window.supabase) return;

  const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  const esc = value => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const date = value => {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric", month: "long", year: "numeric"
    }).format(d);
  };

  const image = article => article.cover_image_url ||
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85";

  function articleCard(article) {
    const href = `../pages/artikel-detail.html?slug=${encodeURIComponent(article.slug)}`;
    return `
      <article class="mandala-topic-card reveal visible">
        <a href="${href}" class="mandala-topic-card-link">
          <div class="mandala-topic-card-image">
            <img src="${esc(image(article))}" alt="${esc(article.title)}" loading="lazy">
          </div>
          <div class="mandala-topic-card-copy">
            <small>${esc(article.categories?.name || "Mandala")}</small>
            <h3>${esc(article.title)}</h3>
            <p>${esc(article.excerpt || "Baca kisah lengkap di Mandala Channel.")}</p>
            <span>${esc(date(article.published_at))} &nbsp; →</span>
          </div>
        </a>
      </article>`;
  }

  function injectStyle() {
    if (document.getElementById("mandala-topic-sync-style")) return;
    const style = document.createElement("style");
    style.id = "mandala-topic-sync-style";
    style.textContent = `
      .mandala-topic-sync-status{grid-column:1/-1;padding:42px 20px;border:1px solid #dfe3e3;background:#faf9f5;color:#718090;text-align:center;font-size:11px;line-height:1.7}
      .mandala-topic-sync-status strong{display:block;margin-bottom:7px;color:#082d56;font:400 24px Georgia,serif}
      .mandala-topic-card{min-width:0;background:#fff;border:1px solid #dfe3e3;transition:transform .25s ease,box-shadow .25s ease}
      .mandala-topic-card:hover{transform:translateY(-4px);box-shadow:0 18px 40px rgba(5,28,53,.10)}
      .mandala-topic-card-link{display:block;height:100%;text-decoration:none}
      .mandala-topic-card-image{aspect-ratio:16/9;overflow:hidden;background:#edf1f4}
      .mandala-topic-card-image img{width:100%;height:100%;object-fit:cover;transition:transform .45s ease}
      .mandala-topic-card:hover img{transform:scale(1.04)}
      .mandala-topic-card-copy{padding:20px 21px 22px}
      .mandala-topic-card-copy small{color:#aa8747;font-size:8px;font-weight:700;letter-spacing:.14em;text-transform:uppercase}
      .mandala-topic-card-copy h3{margin:9px 0 9px;color:#082d56;font:400 clamp(21px,2vw,28px)/1.12 Georgia,serif}
      .mandala-topic-card-copy p{margin:0;color:#718090;font-size:10px;line-height:1.75}
      .mandala-topic-card-copy span{display:block;margin-top:15px;color:#8995a0;font-size:8px;letter-spacing:.05em}
      .mandala-topic-dynamic-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
      @media(max-width:850px){.mandala-topic-dynamic-grid{grid-template-columns:1fr 1fr}}
      @media(max-width:560px){.mandala-topic-dynamic-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  async function load() {
    const { data: category, error: categoryError } = await client
      .from("categories")
      .select("id,name,slug")
      .eq("slug", categorySlug)
      .eq("is_active", true)
      .maybeSingle();

    if (categoryError) throw categoryError;
    if (!category) return;

    const { data: articles, error } = await client
      .from("articles")
      .select("id,title,slug,excerpt,cover_image_url,category_id,status,featured,published_at,created_at,categories(name,slug)")
      .eq("status", "published")
      .eq("category_id", category.id)
      .not("published_at", "is", null)
      .order("featured", { ascending: false })
      .order("published_at", { ascending: false });

    if (error) throw error;

    const target = document.querySelector(".figure-grid") ||
      document.querySelector(".story-layout") ||
      document.querySelector(".topic-grid");
    if (!target) return;

    target.classList.add("mandala-topic-dynamic-grid");

    if (!articles?.length) {
      target.innerHTML = `<div class="mandala-topic-sync-status"><strong>Belum ada cerita</strong>Belum ada artikel published pada topik ini.</div>`;
      return;
    }

    target.innerHTML = articles.map(articleCard).join("");
  }

  injectStyle();
  load().catch(error => {
    console.error("MANDALA TOPIC SYNC ERROR", error);
    const target = document.querySelector(".figure-grid") ||
      document.querySelector(".story-layout") ||
      document.querySelector(".topic-grid");
    if (target) {
      target.classList.add("mandala-topic-dynamic-grid");
      target.innerHTML = `<div class="mandala-topic-sync-status"><strong>Konten belum dapat dimuat</strong>Silakan coba lagi beberapa saat kemudian.</div>`;
    }
  });
})();
