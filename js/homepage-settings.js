/* Mandala Channel — live homepage settings */
(function(){
  "use strict";
  const cfg=window.MANDALA_CONFIG||{},url=cfg.SUPABASE_URL,key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY;
  const finishHydration=()=>document.body?.classList.add("homepage-ready");
  if(!url||!key){finishHydration();return;}
  const headers={apikey:key,Authorization:"Bearer "+key};
  const PROXY=url+"/functions/v1/homepage-cover-image";
  const B2_BASE="https://f005.backblazeb2.com/file/Mandala-Podcast/";
  const FAVICON="assets/brand/WhatsApp%20Image%202026-02-19%20at%2011.46.52%20AM.jpeg";
  async function get(table,select,params=""){const r=await fetch(url+"/rest/v1/"+table+"?select="+encodeURIComponent(select)+params,{headers});if(!r.ok)throw new Error(table+" HTTP "+r.status);return r.json()}
  function publicImage(value){const source=String(value||"").trim();if(!source)return "";try{if(new URL(source).hostname.toLowerCase().endsWith(".backblazeb2.com"))return PROXY+"?url="+encodeURIComponent(source)}catch(e){}return source}
  function imageFromKey(value){const k=String(value||"").trim();return k?publicImage(B2_BASE+k):""}
  function cleanText(value){return String(value??"").trim().replace(/^DESKRIPSI\s+/i,"").replace(/\s+(?:LABEL|JUDUL|TOMBOL)$/i,"").trim()}
  function setHomepageFavicon(){const icon=document.querySelector('link[rel~="icon"]');if(icon)icon.href=FAVICON;else{const x=document.createElement("link");x.rel="icon";x.type="image/jpeg";x.href=FAVICON;document.head.appendChild(x)}}
  function fixPlaylistImages(root=document){root.querySelectorAll?.("#playlistTrack .play-card img").forEach(img=>{const source=img.getAttribute("src")||"";if(source.includes(PROXY+"?url="))return;if(/\.backblazeb2\.com\//i.test(source))img.src=publicImage(source)})}
  function watchPlaylistImages(){const track=document.getElementById("playlistTrack");if(!track)return;fixPlaylistImages(track);if(window.MandalaHomepagePlaylistObserver)window.MandalaHomepagePlaylistObserver.disconnect();const observer=new MutationObserver(()=>fixPlaylistImages(track));observer.observe(track,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});window.MandalaHomepagePlaylistObserver=observer}
  function setText(id,value){const x=document.getElementById(id),text=cleanText(value);if(x&&text)x.textContent=text}

  /* Image replacement is part of hydration. Never reveal <main> while a
     database image is still replacing a static HTML placeholder. */
  function preloadImage(source){
    return new Promise(resolve=>{
      if(!source)return resolve(false);
      const img=new Image();let settled=false;
      const done=ok=>{if(settled)return;settled=true;resolve(ok)};
      img.onload=()=>done(true);img.onerror=()=>done(false);img.src=source;
      if(img.complete)done(img.naturalWidth>0);
    });
  }
  async function setImage(id,value,alt){
    const x=document.getElementById(id),source=publicImage(value);if(!x||!source)return false;
    x.alt=alt||x.alt;if(x.src===source){x.classList.add("is-live");return true}
    const loaded=await preloadImage(source);x.src=source;x.classList.add("is-live");return loaded;
  }
  async function swapImage(img,value){
    const source=publicImage(value);if(!img||!source)return false;
    if(img.src===source){img.classList.add("is-live");return true}
    const loaded=await preloadImage(source);img.src=source;img.classList.add("is-live");return loaded;
  }
  function setLink(id,label,href){const x=document.getElementById(id);if(!x)return;const text=cleanText(label);if(text)x.textContent=text;if(href)x.href=href}

  async function applySettings(s){
    setText("heroEyebrow",s.hero_label);setText("heroTitle",s.hero_title);setText("heroDescription",s.hero_description);
    setLink("heroPrimary",s.hero_primary_label,s.hero_primary_url);setLink("heroSecondary",s.hero_secondary_label,s.hero_secondary_url);
    await Promise.all([
      setImage("heroImageMain",s.hero_image_main||imageFromKey(s.hero_image_main_key),"Mandala Channel"),
      setImage("heroImageSecondary",s.hero_image_secondary||imageFromKey(s.hero_image_secondary_key),"Mandala Channel"),
      setImage("heroImageTertiary",s.hero_image_tertiary||imageFromKey(s.hero_image_tertiary_key),"Mandala Channel")
    ]);
    const hero=document.getElementById("heroSection");if(hero){
      if(s.hero_background_color)hero.style.backgroundColor=s.hero_background_color;
      const overlaySource=s.hero_overlay_image||imageFromKey(s.hero_overlay_image_key);
      if(overlaySource){
        const overlay=publicImage(overlaySource),opacity=Math.max(0,Math.min(1,Number(s.hero_overlay_opacity??.18)));
        await preloadImage(overlay);
        hero.style.setProperty("--hero-overlay-image","url(\""+overlay.replace(/\"/g,"%22")+"\")");
        hero.style.setProperty("--hero-overlay-opacity",String(opacity));hero.classList.add("has-hero-overlay");
      }else{hero.style.removeProperty("--hero-overlay-image");hero.style.removeProperty("--hero-overlay-opacity");hero.classList.remove("has-hero-overlay")}
    }
  }

  async function applyLatest(article){
    if(!article)return;const jobs=[];
    const feature=document.querySelector(".feature");if(feature){
      const img=feature.querySelector("img"),title=feature.querySelector("h2"),meta=feature.querySelector(".k"),small=feature.querySelector("small");
      if(img&&article.cover_image_url)jobs.push(swapImage(img,article.cover_image_url));
      if(title)title.textContent=article.title||"";if(meta)meta.textContent="Berita terbaru";if(small)small.textContent="Mandala Channel · Terbaru";
      feature.classList.add("is-live-content");feature.setAttribute("role","link");feature.setAttribute("tabindex","0");
      const target="pages/artikel-detail.html"+(article.slug?"?slug="+encodeURIComponent(article.slug):"");feature.onclick=()=>{location.href=target};feature.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();location.href=target}}
    }
    const cards=document.querySelectorAll("#articlesContainer .card");if(cards.length){
      const card=cards[0],img=card.querySelector("img"),title=card.querySelector("h3"),meta=card.querySelector(".meta"),link=card.querySelector("a");
      if(img&&article.cover_image_url)jobs.push(swapImage(img,article.cover_image_url));
      if(title)title.textContent=article.title||"Artikel terbaru";if(meta)meta.textContent="Artikel terbaru";
      if(link)link.href="pages/artikel-detail.html"+(article.slug?"?slug="+encodeURIComponent(article.slug):"");
    }
    await Promise.all(jobs);
  }
  function initHomepageExtras(){setHomepageFavicon();watchPlaylistImages()}

  const originalLoader=window.loadHomeData;
  if(typeof originalLoader==="function"&&!window.__mandalaHomeLoaderPatched){
    let sharedPromise=null;
    window.loadHomeData=function(){if(!sharedPromise){sharedPromise=Promise.resolve().then(()=>originalLoader()).catch(error=>{sharedPromise=null;throw error})}return sharedPromise};
    if(window.MandalaPublic)window.MandalaPublic.loadHomeData=window.loadHomeData;window.__mandalaHomeLoaderPatched=true;
  }

  async function init(){try{
    const publicLoader=window.MandalaPublic?.loadHomeData||window.loadHomeData;if(typeof publicLoader==="function")await publicLoader();
    const settings=await get("homepage_settings","*");if(settings[0])await applySettings(settings[0]);
    const articles=(window.MandalaPublicData?.articles||window.DATA?.articles||[]).slice().sort((a,b)=>new Date(b.published_at||b.created_at||0)-new Date(a.published_at||a.created_at||0));
    await applyLatest(articles[0]);
    if(typeof window.renderPlaylists==="function"&&!window.__mandalaHomepagePlaylistsRendered){window.__mandalaHomepagePlaylistsRendered=true;window.renderPlaylists()}
  }catch(e){console.warn("Homepage live data fallback aktif:",e.message)}finally{initHomepageExtras();finishHydration()}}

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",event=>{event.stopImmediatePropagation();init()},{once:true});else init();
})();
