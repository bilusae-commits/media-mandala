
// Helper untuk website publik.
// Setelah js/config.js diisi, komponen publik dapat memakai:
// MandalaPublic.latestArticles(), latestVideos(), playlists(), categories().
window.MandalaPublic = {
  async db(){ return window.MandalaCMS ? MandalaCMS.ready() : new Promise(r=>window.addEventListener("mandala:supabase-ready",()=>r(window.mandalaSupabase),{once:true})); },
  async latestArticles(limit=6){const db=await this.db();const {data,error}=await db.from("articles").select("*,categories(name,slug)").eq("status","published").order("published_at",{ascending:false}).limit(limit);if(error)throw error;return data;},
  async latestVideos(limit=6){const db=await this.db();const {data,error}=await db.from("videos").select("*,categories(name,slug)").eq("status","published").order("published_at",{ascending:false}).limit(limit);if(error)throw error;return data;},
  async playlists(limit=10){const db=await this.db();const {data,error}=await db.from("playlists").select("*,categories(name,slug)").eq("status","published").order("sort_order").limit(limit);if(error)throw error;return data;},
  async categories(){const db=await this.db();const {data,error}=await db.from("categories").select("*").order("sort_order");if(error)throw error;return data;},
  openVideo(videoId){const existing=document.getElementById("ytModal");if(existing)existing.remove();const m=document.createElement("div");m.id="ytModal";m.style="position:fixed;inset:0;background:#000b;display:grid;place-items:center;z-index:99999;padding:5vw";m.innerHTML=`<div style="width:min(1000px,96vw);aspect-ratio:16/9;position:relative;background:#000"><button onclick="this.closest('#ytModal').remove()" style="position:absolute;right:-4px;top:-42px;background:none;color:#fff;border:0;font-size:28px;cursor:pointer">×</button><iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" title="Mandala YouTube" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`;document.body.appendChild(m);}
};
