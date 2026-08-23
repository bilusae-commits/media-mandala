/* =========================================================
   MANDALA CHANNEL — PUBLIC CONTENT
   Single public-data bridge: Supabase -> public pages
   ========================================================= */
(function(){
    "use strict";

    const C = window.MANDALA_CONFIG || {};
    const URL = C.SUPABASE_URL || "";
    const KEY = C.SUPABASE_PUBLISHABLE_KEY || C.SUPABASE_ANON_KEY || "";
    const FALLBACK = "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=85";

    let db = null;
    let publicData = {
        articles: [],
        videos: [],
        playlists: [],
        topics: [],
        categories: []
    };

    function esc(value){
        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function youtubeId(value){
        if(!value) return "";

        const text = String(value).trim();

        if(/^[A-Za-z0-9_-]{11}$/.test(text)){
            return text;
        }

        try{
            const url = new URL(text);
            const host = url.hostname.replace(/^www\./, "").toLowerCase();

            if(host === "youtu.be"){
                return url.pathname.split("/").filter(Boolean)[0] || "";
            }

            if(host === "youtube.com" || host === "m.youtube.com"){
                return url.searchParams.get("v") ||
                    (url.pathname.match(/\/(?:embed|shorts)\/([^/]+)/) || [])[1] || "";
            }
        }catch(error){
            /* Invalid URL: simply return empty ID. */
        }

        return "";
    }

    function videoImage(video){
        const id = video.youtube_video_id || youtubeId(video.youtube_url);
        return video.thumbnail_url ||
            (id
                ? `https://i.ytimg.com/vi/${encodeURIComponent(id)}/hqdefault.jpg`
                : FALLBACK);
    }

    function dateText(value){
        if(!value) return "";

        const date = new Date(value);

        if(Number.isNaN(date.getTime())){
            return "";
        }

        return new Intl.DateTimeFormat("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        }).format(date);
    }

    async function client(){
        if(db) return db;

        if(!URL || !KEY){
            throw new Error("Konfigurasi Supabase publik belum tersedia.");
        }

        if(!window.supabase || typeof window.supabase.createClient !== "function"){
            await new Promise((resolve, reject) => {
                const existing = document.querySelector("script[data-mandala-supabase-public]");

                if(existing){
                    existing.addEventListener("load", resolve, {once:true});
                    existing.addEventListener("error", reject, {once:true});
                    return;
                }

                const script = document.createElement("script");
                script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
                script.dataset.mandalaSupabasePublic = "true";
                script.onload = resolve;
                script.onerror = () => reject(new Error("Supabase library gagal dimuat."));
                document.head.appendChild(script);
            });
        }

        db = window.supabase.createClient(URL, KEY, {
            auth: {
                persistSession: false,
                autoRefreshToken: false
            }
        });

        return db;
    }

    async function loadTable(name, select, order){
        let query = (await client()).from(name).select(select);

        if(order){
            query = query.order(order, {
                ascending: true,
                nullsFirst: false
            });
        }

        const result = await query;

        if(result.error){
            throw result.error;
        }

        return result.data || [];
    }

    function normalizePlaylist(row, categoryMap, index){
        const category = categoryMap[row.category_id];

        return {
            id: row.id || String(index + 1),
            title: row.title || "Playlist Mandala",
            slug: row.slug || "",
            youtube_playlist_id: row.youtube_playlist_id || "",
            description: row.description || "",
            image: row.cover_image_url || category?.image_url || FALLBACK,
            category: category?.name || "Mandala",
            category_id: row.category_id || null,
            videoCount: 0,
            status: row.status || "",
            featured: row.featured === true,
            sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 9999,
            published_at: row.published_at || null,
            created_at: row.created_at || null
        };
    }

    async function loadHomeData(){
        const [articles, videos, playlists, categories] = await Promise.all([
            loadTable(
                "articles",
                "id,title,slug,excerpt,content,cover_image_url,category_id,published_at,created_at,status,featured",
                "published_at"
            ),
            loadTable(
                "videos",
                "id,title,slug,youtube_url,youtube_video_id,thumbnail_url,description,category_id,status,featured,published_at,created_at",
                "published_at"
            ),
            loadTable(
                "playlists",
                "id,title,slug,youtube_playlist_id,description,cover_image_url,category_id,status,featured,sort_order,published_at,created_at",
                "sort_order"
            ),
            loadTable(
                "categories",
                "id,name,slug,description,image_url,sort_order,is_active",
                "sort_order"
            )
        ]);

        const activeCategories = categories.filter(category => category.is_active !== false);
        const categoryMap = {};

        activeCategories.forEach(category => {
            categoryMap[category.id] = category;
        });

        const publicArticles = articles.filter(item => item.status === "published");
        const publicVideos = videos.filter(item => item.status === "published");

        const publicPlaylists = playlists
            .filter(item => item.status === "published")
            .map((item, index) => normalizePlaylist(item, categoryMap, index))
            .sort((a, b) =>
                Number(b.featured) - Number(a.featured) ||
                a.sort_order - b.sort_order ||
                new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0)
            );

        publicData = {
            articles: publicArticles,
            videos: publicVideos,
            playlists: publicPlaylists,
            topics: activeCategories,
            categories: activeCategories
        };

        window.DATA = publicData;
        window.MandalaPublicData = publicData;

        renderArticles(publicData.articles, categoryMap);
        renderVideos(publicData.videos, categoryMap);
        renderTopics(publicData.topics);
        renderPlaylistState(publicData.playlists);

        return publicData;
    }

    function getPublicData(){
        return publicData;
    }

    function renderArticles(items, categoryMap){
        const element = document.getElementById("articlesContainer");

        if(!element || !items.length) return;

        element.innerHTML = items.slice(0, 4).map(article => {
            const image = article.cover_image_url || FALLBACK;
            const category = categoryMap[article.category_id]?.name || "ARTIKEL";
            const detailUrl = `pages/artikel-detail.html${article.slug ? `?slug=${encodeURIComponent(article.slug)}` : ""}`;

            return `
                <article class="card">
                    <a href="${detailUrl}">
                        <div class="thumb">
                            <img src="${esc(image)}" alt="${esc(article.title)}" loading="lazy">
                            <span class="badge">${esc(category)}</span>
                        </div>
                        <div class="meta">${esc(dateText(article.published_at || article.created_at))}</div>
                        <h3>${esc(article.title || "Artikel")}</h3>
                        <p>${esc(article.excerpt || "Baca selengkapnya →")}</p>
                    </a>
                </article>
            `;
        }).join("");
    }

    function renderVideos(items, categoryMap){
        const element = document.getElementById("videosContainer");

        if(!element || !items.length) return;

        element.innerHTML = items.slice(0, 4).map(video => {
            const id = video.youtube_video_id || youtubeId(video.youtube_url);
            const category = categoryMap[video.category_id]?.name || "VIDEO";

            return `
                <article class="card video">
                    <a href="#" data-public-video="${esc(id)}" data-public-title="${esc(video.title)}">
                        <div class="thumb">
                            <img src="${esc(videoImage({...video, youtube_video_id:id}))}" alt="${esc(video.title)}" loading="lazy">
                            <span class="badge">${esc(category)}</span>
                        </div>
                        <div class="meta">VIDEO · ${esc(dateText(video.published_at || video.created_at))}</div>
                        <h3>${esc(video.title || "Video Mandala")}</h3>
                        <p>Putar video →</p>
                    </a>
                </article>
            `;
        }).join("");

        element.querySelectorAll("[data-public-video]").forEach(link => {
            link.addEventListener("click", event => {
                event.preventDefault();

                if(typeof window.openVideo === "function"){
                    window.openVideo(
                        link.dataset.publicVideo,
                        link.dataset.publicTitle
                    );
                }
            });
        });
    }

    function renderTopics(items){
        const element = document.getElementById("topicsContainer");

        if(!element || !items.length) return;

        element.innerHTML = items.slice(0, 6).map(topic => `
            <a class="topic" href="topics/${encodeURIComponent(topic.slug || "")}.html">
                <h3>${esc(topic.name || "Topik")}</h3>
                <p>${esc(topic.description || `Jelajahi cerita Mandala tentang ${String(topic.name || "").toLowerCase()}.`)}</p>
            </a>
        `).join("");
    }

    function renderPlaylistState(items){
        const track = document.getElementById("playlistTrack");
        const dots = document.getElementById("playlistDots");

        if(!track) return;

        if(items.length){
            return;
        }

        track.innerHTML = `<div class="playlist-empty-state">Playlist belum tersedia.</div>`;

        if(dots){
            dots.innerHTML = "";
        }
    }

    window.getPublicData = getPublicData;
    window.loadHomeData = loadHomeData;
    window.MandalaPublic = {
        loadHomeData,
        getPublicData
    };
})();