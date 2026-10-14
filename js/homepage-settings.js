/* Mandala Channel — live homepage settings */
(function(){
  "use strict";
  const cfg=window.MANDALA_CONFIG||{},url=cfg.SUPABASE_URL,key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY;
  const finishHydration=()=>document.body?.classList.add("homepage-ready");
  const PROXY=url?url+"/functions/v1/homepage-cover-image":"";
  const B2_BASE="https://f005.backblazeb2.com/file/Mandala-Podcast/";
  const FAVICON="assets/brand/WhatsApp%20Image%202026-02-19%20at%2011.46.52%20AM.jpeg";
  async function get(table,select,params=""){const r=await fetch(url+"/rest/v1/"+table+"?select="+encodeURIComponent(select)+params,{headers:{apikey:key,Authorization:"Bearer "+key}});if(!r.ok)throw new Error(table+" HTTP "+r.status);return r.json()}
  function publicImage(value){const source=String(value||"").trim();if(!source)return "";try{if(new URL(source).hostname.toLowerCase().endsWith(".backblazeb2.com")&&PROXY)return PROXY+"?url="+encodeURIComponent(source)}catch(e){}return source}
  function imageFromKey(value){const k=String(value||"").trim();return k?publicImage(B2_BASE+k):""}
  function cleanText(value){return String(value??"").trim().replace(/^DESKRIPSI\s+/i,"").replace(/\s+(?:LABEL|JUDUL|TOMBOL)$/i,"").trim()}
  function setHomepageFavicon(){const icon=document.querySelector('link[rel~="icon"]');if(icon)icon.href=FAVICON;else{const x=document.createElement("link");x.rel="icon";x.type="image/jpeg";x.href=FAVICON;document.head.appendChild(x)}}
  function fixPlaylistImages(root=document){root.querySelectorAll?.("#playlistTrack .play-card img").forEach(img=>{const source=img.getAttribute("src")||"";if(PROXY&&source.includes(PROXY+"?url="))return;if(/\.backblazeb2\.com\//i.test(source))img.src=publicImage(source)})}
  function watchPlaylistImages(){const track=document.getElementById("playlistTrack");if(!track)return;fixPlaylistImages(track);if(window.MandalaHomepagePlaylistObserver)window.MandalaHomepagePlaylistObserver.disconnect();const observer=new MutationObserver(()=>fixPlaylistImages(track));observer.observe(track,{childList:true,subtree:true,attributes:true,attributeFilter:["src"]});window.MandalaHomepagePlaylistObserver=observer}
  function setText(id,value){const x=document.getElementById(id),text=cleanText(value);if(x&&text)x.textContent=text}
  function preloadImage(source){return new Promise(resolve=>{if(!source)return resolve(false);const img=new Image();let settled=false;const done=ok=>{if(settled)return;settled=true;resolve(ok)};img.onload=()=>done(true);img.onerror=()=>done(false);img.src=source;if(img.complete)done(img.naturalWidth>0)})}
  async function setImage(id,value,alt){const x=document.getElementById(id),source=publicImage(value);if(!x||!source)return false;x.alt=alt||x.alt;if(x.src===source){x.classList.add("is-live");return true}const loaded=await preloadImage(source);x.src=source;x.classList.add("is-live");return loaded}
  async function swapImage(img,value){const source=publicImage(value);if(!img||!source)return false;if(img.src===source){img.classList.add("is-live");return true}const loaded=await preloadImage(source);img.src=source;img.classList.add("is-live");return loaded}
  function setLink(id,label,href){const x=document.getElementById(id);if(!x)return;const text=cleanText(label);if(text)x.textContent=text;if(href)x.href=href}
  async function applySettings(s){setText("heroEyebrow",s.hero_label);setText("heroTitle",s.hero_title);setText("heroDescription",s.hero_description);setLink("heroPrimary",s.hero_primary_label,s.hero_primary_url);setLink("heroSecondary",s.hero_secondary_label,s.hero_secondary_url);await Promise.all([setImage("heroImageMain",s.hero_image_main||imageFromKey(s.hero_image_main_key),"Mandala Channel"),setImage("heroImageSecondary",s.hero_image_secondary||imageFromKey(s.hero_image_secondary_key),"Mandala Channel"),setImage("heroImageTertiary",s.hero_image_tertiary||imageFromKey(s.hero_image_tertiary_key),"Mandala Channel")]);const hero=document.getElementById("heroSection");if(hero){if(s.hero_background_color)hero.style.backgroundColor=s.hero_background_color;const overlaySource=s.hero_overlay_image||imageFromKey(s.hero_overlay_image_key);if(overlaySource){const overlay=publicImage(overlaySource),opacity=Math.max(0,Math.min(1,Number(s.hero_overlay_opacity??.18)));await preloadImage(overlay);hero.style.setProperty("--hero-overlay-image","url(\""+overlay.replace(/\"/g,"%22")+"\")");hero.style.setProperty("--hero-overlay-opacity",String(opacity));hero.classList.add("has-hero-overlay")}else{hero.style.removeProperty("--hero-overlay-image");hero.style.removeProperty("--hero-overlay-opacity");hero.classList.remove("has-hero-overlay")}}}
  async function applyLatest(article){if(!article)return;const feature=document.querySelector(".feature");if(feature){const img=feature.querySelector("img"),title=feature.querySelector("h2");if(img&&article.cover_image_url)await swapImage(img,article.cover_image_url);if(title)title.textContent=article.title||"";feature.classList.add("is-live-content");const target="pages/artikel-detail.html"+(article.slug?"?slug="+encodeURIComponent(article.slug):"");feature.onclick=()=>{location.href=target};feature.onkeydown=e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();location.href=target}}}}
  function renderFeaturedEditorial(items){
    const grid=document.querySelector('body[data-base="./"] .featureGrid');if(!grid||!items.length)return;
    const list=items.slice().sort((a,b)=>new Date(b.published_at||b.created_at||0)-new Date(a.published_at||a.created_at||0)).slice(0,9);
    if(!list.length)return;
    const image=a=>a.cover_image_url||"https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=85";
    const urlFor=a=>`pages/artikel-detail.html${a.slug?`?slug=${encodeURIComponent(a.slug)}`:""}`;
    const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/\"/g,"&quot;").replace(/'/g,"&#039;");
    const main=list[0], bottom=list.slice(1,3), left=list.slice(3,9);
    grid.innerHTML=`<div class="editorial-left"><div class="editorial-heading"><span></span><h2>LATEST<br>STORIES</h2></div><div class="editorial-list">${left.map(a=>`<a class="editorial-item" href="${urlFor(a)}"><img src="${esc(image(a))}" alt="${esc(a.title||"Artikel")}" loading="lazy"><div><small>MANDALA</small><h3>${esc(a.title||"Artikel")}</h3></div></a>`).join("")}</div></div><div class="editorial-right"><a class="editorial-main" href="${urlFor(main)}"><img src="${esc(image(main))}" alt="${esc(main.title||"Artikel")}" loading="eager"><div class="editorial-main-copy"><small>MANDALA CHANNEL</small><h2>${esc(main.title||"Artikel")}</h2></div></a><div class="editorial-bottom">${bottom.map(a=>`<a class="editorial-card" href="${urlFor(a)}"><img src="${esc(image(a))}" alt="${esc(a.title||"Artikel")}" loading="lazy"><div><small>MANDALA CHANNEL</small><h3>${esc(a.title||"Artikel")}</h3></div></a>`).join("")}</div></div>`;
  }
  function renderPlaylistsSafe(){
    const track=document.getElementById("playlistTrack"),dots=document.getElementById("playlistDots"),stage=document.getElementById("playlistStage");
    if(!track)return;
    const data=window.MandalaPublicData||window.DATA||{},items=Array.isArray(data.playlists)?data.playlists:[];
    if(window.__mandalaPlaylistTimer){clearInterval(window.__mandalaPlaylistTimer);window.__mandalaPlaylistTimer=null}
    if(!items.length){track.innerHTML='<div class="playlist-empty-state">Playlist belum tersedia.</div>';if(dots)dots.innerHTML="";return}
    const esc=v=>String(v??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
    track.innerHTML=items.map((p,i)=>{
      const id=String(p.id||i+1),title=esc(p.title||"Playlist Mandala"),image=esc(p.image||"https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=900&q=85"),category=esc(p.category||"Mandala"),count=Number(p.videoCount);
      const detail=count>0?category+" · "+count+" video":category;
      return '<article class="play-card pos-hidden" data-index="'+i+'"><a href="pages/playlist-detail.html?id='+encodeURIComponent(id)+'" aria-label="'+title+'"><img src="'+image+'" alt="'+title+'" loading="lazy" draggable="false"><div class="pc-info"><strong>'+title+'</strong><span>'+detail+'</span></div></a></article>';
    }).join("");
    if(dots)dots.innerHTML=items.map((_,i)=>'<button class="play-dot'+(i===0?' active':'')+'" type="button" data-dot="'+i+'" aria-label="Ke playlist '+(i+1)+'"></button>').join("");
    fixPlaylistImages(track);watchPlaylistImages();window.__mandalaHomepagePlaylistsRendered=true;
    const cards=[...track.querySelectorAll(".play-card")],total=cards.length;
    if(!total)return;
    let index=0,startX=0,startY=0,dragging=false,suppressClick=false;
    const update=()=>{cards.forEach((card,i)=>{let d=i-index;if(d>total/2)d-=total;if(d<-total/2)d+=total;card.className="play-card "+(d===0?"pos-0":d===1?"pos-1":d===-1?"pos--1":d===2?"pos-2":d===-2?"pos--2":"pos-hidden")});dots?.querySelectorAll(".play-dot").forEach((dot,i)=>dot.classList.toggle("active",i===index))};
    const go=n=>{index=(n+total)%total;update()};
    const stopAuto=()=>{if(window.__mandalaPlaylistTimer){clearInterval(window.__mandalaPlaylistTimer);window.__mandalaPlaylistTimer=null}};
    const startAuto=()=>{stopAuto();if(total>1&&!window.matchMedia("(prefers-reduced-motion: reduce)").matches&&!document.hidden)window.__mandalaPlaylistTimer=setInterval(()=>go(index+1),6500)};
    document.getElementById("playlistPrev")?.addEventListener("click",()=>{go(index-1);startAuto()});
    document.getElementById("playlistNext")?.addEventListener("click",()=>{go(index+1);startAuto()});
    dots?.querySelectorAll("[data-dot]").forEach(dot=>dot.addEventListener("click",()=>{go(Number(dot.dataset.dot));startAuto()}));
    if(stage&&!stage.dataset.swipeReady){
      stage.dataset.swipeReady="true";
      stage.addEventListener("pointerdown",event=>{if(event.target.closest("button"))return;startX=event.clientX;startY=event.clientY;dragging=true;try{stage.setPointerCapture(event.pointerId)}catch(e){}});
      stage.addEventListener("pointerup",event=>{if(!dragging)return;dragging=false;const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.abs(dx)>35&&Math.abs(dx)>Math.abs(dy)*1.2){suppressClick=true;go(index+(dx<0?1:-1));startAuto();stage.classList.remove("is-dragging")}});
      stage.addEventListener("pointercancel",()=>{dragging=false;stage.classList.remove("is-dragging")});
      stage.addEventListener("click",event=>{if(suppressClick){event.preventDefault();event.stopPropagation();suppressClick=false}},true);
      stage.addEventListener("pointerenter",stopAuto);
      stage.addEventListener("pointerleave",startAuto);
      stage.addEventListener("focusin",stopAuto);
      stage.addEventListener("focusout",startAuto);
      document.addEventListener("visibilitychange",()=>document.hidden?stopAuto():startAuto());
    }
    stage?.addEventListener("pointermove",event=>{if(dragging&&Math.abs(event.clientX-startX)>8)stage.classList.add("is-dragging")});
    update();startAuto();
  }

  const AUDIO_ENDPOINT=url?url+"/functions/v1/podcast-audio":"";
  const audioEsc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  const audioTime=value=>{const n=Number(value);return Number.isFinite(n)&&n>=0?Math.floor(n/60)+":"+String(Math.floor(n%60)).padStart(2,"0"):"—"};
  function renderHomeAudioEmpty(message){const rows=document.getElementById("homeAudioRows");if(rows)rows.innerHTML='<tr><td colspan="4" class="home-audio-empty">'+audioEsc(message)+'</td></tr>';const status=document.getElementById("homeAudioStatus");if(status)status.textContent=message}
  function renderHomeAudio(items){
    const rows=document.getElementById("homeAudioRows"),player=document.getElementById("homeAudioPlayer");
    if(!rows||!player)return;
    const tracks=(items||[]).filter(item=>item.content_type==="audio"&&item.audio_url);
    if(!tracks.length){renderHomeAudioEmpty("Belum ada audio yang dipublikasikan. Audio yang tersedia akan muncul di sini.");return}
    const dateText=value=>{if(!value)return "—";const date=new Date(value);return Number.isNaN(date.getTime())?"—":new Intl.DateTimeFormat("id-ID",{day:"numeric",month:"short",year:"numeric"}).format(date)};
    rows.innerHTML=tracks.slice(0,6).map((track,index)=>'<tr data-home-audio-row="'+audioEsc(track.id)+'"><td><strong class="home-audio-episode">'+audioEsc(track.title||"Audio Mandala")+'</strong></td><td>'+audioEsc(dateText(track.published_at||track.created_at))+'</td><td>'+audioTime(track.audio_duration)+'</td><td><button class="home-audio-play" type="button" data-home-audio-play="'+audioEsc(track.id)+'" aria-label="Putar '+audioEsc(track.title||"Audio Mandala")+'" aria-pressed="false">▶</button></td></tr>').join("");
    const title=document.getElementById("homeAudioTitle"),status=document.getElementById("homeAudioStatus");
    let selectedId="";
    const markSelected=id=>{rows.querySelectorAll("tr[data-home-audio-row]").forEach(row=>{const active=row.dataset.homeAudioRow===String(id);row.classList.toggle("is-playing",active);const button=row.querySelector("[data-home-audio-play]");if(button){button.setAttribute("aria-pressed",String(active));button.textContent=active&&!player.paused?"Ⅱ":"▶"}})};
    rows.querySelectorAll("[data-home-audio-play]").forEach(button=>button.addEventListener("click",async()=>{
      const track=tracks.find(item=>String(item.id)===button.dataset.homeAudioPlay);if(!track)return;
      if(selectedId===String(track.id)&&!player.paused){player.pause();markSelected(track.id);if(status)status.textContent="Audio dijeda.";return}
      if(selectedId!==String(track.id)){selectedId=String(track.id);player.pause();player.src=AUDIO_ENDPOINT+"?id="+encodeURIComponent(track.id);player.load();if(title)title.textContent=track.title||"Audio Mandala";markSelected(track.id)}
      if(status)status.textContent="Memuat audio…";
      try{await player.play();markSelected(track.id);if(status)status.textContent="Sedang diputar."}
      catch(error){if(status)status.textContent="Audio gagal diputar. Coba tekan tombol putar pada pemutar.";console.warn("Homepage audio playback failed:",error)}
    }));
    player.addEventListener("play",()=>{if(status)status.textContent="Sedang diputar.";if(selectedId)markSelected(selectedId)});
    player.addEventListener("pause",()=>{if(status&&selectedId)status.textContent="Audio dijeda.";if(selectedId)markSelected(selectedId)});
    player.addEventListener("ended",()=>{if(status)status.textContent="Audio selesai.";if(selectedId)markSelected(selectedId)});
    player.addEventListener("error",()=>{if(status)status.textContent="Audio tidak dapat dimuat. Periksa sumber audio atau coba lagi."});
  }
  async function loadHomepageAudio(){
    if(!url||!key){renderHomeAudioEmpty("Daftar audio belum dapat dimuat.");return}
    try{const items=await get("podcasts","id,title,description,content_type,audio_url,audio_duration,published_at,created_at,status","&status=eq.published&order=published_at.desc&limit=30");renderHomeAudio(items)}
    catch(error){renderHomeAudioEmpty("Audio belum dapat dimuat saat ini.");console.warn("Homepage audio unavailable:",error.message)}
  }

  function initHomepageExtras(){setHomepageFavicon();watchPlaylistImages()}
  if(!url||!key){initHomepageExtras();renderHomeAudioEmpty("Daftar audio belum dapat dimuat.");finishHydration();return}
  const originalLoader=window.loadHomeData;
  if(typeof originalLoader==="function"&&!window.__mandalaHomeLoaderPatched){let sharedPromise=null;window.loadHomeData=function(){if(!sharedPromise){sharedPromise=Promise.resolve().then(()=>originalLoader()).catch(error=>{sharedPromise=null;throw error})}return sharedPromise};if(window.MandalaPublic)window.MandalaPublic.loadHomeData=window.loadHomeData;window.__mandalaHomeLoaderPatched=true}
  async function init(){try{const publicLoader=window.MandalaPublic?.loadHomeData||window.loadHomeData;if(typeof publicLoader==="function")await publicLoader();const settings=await get("homepage_settings","*");if(settings[0])await applySettings(settings[0]);const articles=(window.MandalaPublicData?.articles||window.DATA?.articles||[]).slice().sort((a,b)=>new Date(b.published_at||b.created_at||0)-new Date(a.published_at||a.created_at||0));renderFeaturedEditorial(articles);await applyLatest(articles[0]);renderPlaylistsSafe()}catch(e){console.warn("Homepage live data fallback aktif:",e.message);renderPlaylistsSafe()}finally{initHomepageExtras();await loadHomepageAudio();finishHydration()}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>init(),{once:true});else init();
})();