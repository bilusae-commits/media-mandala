/* =========================================================
   MANDALA CHANNEL — PUBLIC CONTENT
   Single public-data bridge: Supabase -> homepage
   ========================================================= */
(function(){
  "use strict";

  const C=window.MANDALA_CONFIG||{};
  const URL=C.SUPABASE_URL||"";
  const KEY=C.SUPABASE_PUBLISHABLE_KEY||C.SUPABASE_ANON_KEY||"";
  const FALLBACK="https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=85";
  let db=null;

  function esc(v){
    return String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
  }

  function youtubeId(v){
    if(!v)return"";
    const s=String(v).trim();
    if(/^[A-Za-z0-9_-]{11}$/.test(s))return s;
    try{
      const u=new URL(s),h=u.hostname.replace(/^www\./,"").toLowerCase();
      if(h==="youtu.be")return u.pathname.split("/").filter(Boolean)[0]||"";
      if(h==="youtube.com"||h==="m.youtube.com")return u.searchParams.get("v")||(u.pathname.match(/\/(?:embed|shorts)\/([^/]+)/)||[])[1]||"";
    }catch(e){}
    return"";
  }

  function videoImage(v){
    return v.thumbnail_url||(v.youtube_video_id?`https://i.ytimg.com/vi/${encodeURIComponent(v.youtube_video_id)}/hqdefault.jpg`:FALLBACK);
  }

  function dateText(v){
    if(!v)return"";
    const d=new Date(v);
    return Number.isNaN(d.getTime())?"":new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"long",year:"numeric"}).format(d);
  }

  async function client(){
    if(db)return db;
    if(!URL||!KEY)throw new Error("Konfigurasi Supabase publik belum tersedia.");
    if(!window.supabase||typeof window.supabase.createClient!=="function"){
      await new Promise((resolve,reject)=>{
        const old=document.querySelector('script[data-mandala-supabase-public]');
        if(old){old.addEventListener("load",resolve,{once:true});old.addEventListener("error",reject,{once:true});return;}
        const s=document.createElement("script");
        s.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
        s.dataset.mandalaSupabasePublic="true";
        s.onload=resolve;
        s.onerror=()=>reject(new Error("Supabase library gagal dimuat."));
        document.head.appendChild(s);
      });
    }
    db=window.supabase.createClient(URL,KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    return db;
  }

  async function loadTable(name,select,order){
    let q=(await client()).from(name).select(select);
    if(order)q=q.order(order,{ascending:true,nullsFirst:false});
    const r=await q;
    if(r.error)throw r.error;
    return r.data||[];
  }

  function normalizePlaylist(row,map,index){
    const category=map[row.category_id];
    return {
      id:row.id||String(index+1),
      title:row.title||"Playlist Mandala",
      slug:row.slug||"",
      youtube_playlist_id:row.youtube_playlist_id||"",
      description:row.description||"",
      image:row.cover_image_url||category?.image_url||FALLBACK,
      category:category?.name||"Mandala",
      category_id:row.category_id||null,
      videoCount:0,
      status:row.status||"",
      featured:row.featured===true,
      sort_order:Number.isFinite(Number(row.sort_order))?Number(row.sort_order):9999,
      published_at:row.published_at||null,
      created_at:row.created_at||null
    };
  }

  async function loadHomeData(){
    const [articles,videos,playlists,categories]=await Promise.all([
      loadTable("articles","id,title,slug,excerpt,content,cover_image_url,category_id,published_at,created_at,status,featured","published_at"),
      loadTable("videos","id,title,slug,youtube_url,youtube_video_id,thumbnail_url,description,category_id,status,featured,published_at,created_at","published_at"),
      loadTable("playlists","id,title,slug,youtube_playlist_id,description,cover_image_url,category_id,status,featured,sort_order,published_at,created_at","sort_order"),
      loadTable("categories","id,name,slug,description,image_url,sort_order,is_active","sort_order")
    ]);

    const active=categories.filter(c=>c.is_active!==false);
    const map={};
    active.forEach(c=>map[c.id]=c);

    const publicArticles=articles.filter(x=>x.status==="published");
    const publicVideos=videos.filter(x=>x.status==="published");
    const publicPlaylists=playlists
      .filter(x=>x.status==="published")
      .map((x,i)=>normalizePlaylist(x,map,i))
      .sort((a,b)=>Number(b.featured)-Number(a.featured)||a.sort_order-b.sort_order||new Date(b.published_at||b.created_at||0)-new Date(a.published_at||a.created_at||0));

    const data={
      articles:publicArticles,
      videos:publicVideos,
      playlists:publicPlaylists,
      topics:active,
      categories:active
    };

    window.DATA=data;
    window.MandalaPublicData=data;

    renderArticles(data.articles,map);
    renderVideos(data.videos,map);
    renderTopics(data.topics);
    renderPlaylistState(data.playlists);

    return data;
  }

  function renderArticles(items,map){
    const el=document.getElementById("articlesContainer");
    if(!el||!items.length)return;
    el.innerHTML=items.slice(0,4).map(a=>{
      const image=a.cover_image_url||FALLBACK;
      const cat=map[a.category_id]?.name||"ARTIKEL";
      return `<article class="card"><a href="pages/artikel-detail.html${a.slug?`?slug=${encodeURIComponent(a.slug)}`:""}"><div class="thumb"><img src="${esc(image)}" alt="${esc(a.title)}" loading="lazy"><span class="badge">${esc(cat)}</span></div><div class="meta">${esc(dateText(a.published_at||a.created_at))}</div><h3>${esc(a.title||"Artikel")}</h3><p>${esc(a.excerpt||"Baca selengkapnya →")}</p></a></article>`;
    }).join("");
  }

  function renderVideos(items,map){
    const el=document.getElementById("videosContainer");
    if(!el||!items.length)return;
    el.innerHTML=items.slice(0,4).map(v=>{
      const id=v.youtube_video_id||youtubeId(v.youtube_url);
      const cat=map[v.category_id]?.name||"VIDEO";
      return `<article class="card video"><a href="#" data-public-video="${esc(id)}" data-public-title="${esc(v.title)}"><div class="thumb"><img src="${esc(videoImage({...v,youtube_video_id:id}))}" alt="${esc(v.title)}" loading="lazy"><span class="badge">${esc(cat)}</span></div><div class="meta">VIDEO · ${esc(dateText(v.published_at||v.created_at))}</div><h3>${esc(v.title||"Video Mandala")}</h3><p>Putar video →</p></a></article>`;
    }).join("");
    el.querySelectorAll("[data-public-video]").forEach(a=>a.addEventListener("click",e=>{
      e.preventDefault();
      if(typeof window.openVideo==="function")window.openVideo(a.dataset.publicVideo,a.dataset.publicTitle);
    }));
  }

  function renderTopics(items){
    const el=document.getElementById("topicsContainer");
    if(!el||!items.length)return;
    el.innerHTML=items.slice(0,6).map(t=>`<a class="topic" href="topics/${encodeURIComponent(t.slug||"")}.html"><h3>${esc(t.name||"Topik")}</h3><p>${esc(t.description||`Jelajahi cerita Mandala tentang ${String(t.name||"").toLowerCase()}.`)}</p></a>`).join("");
  }

  function renderPlaylistState(items){
    const track=document.getElementById("playlistTrack");
    if(!track||items.length)return;
    track.innerHTML=`<div class="playlist-empty-state">Playlist belum tersedia.</div>`;
    const dots=document.getElementById("playlistDots");
    if(dots)dots.innerHTML="";
  }

  window.loadHomeData=loadHomeData;
  window.MandalaPublic={loadHomeData};
})();