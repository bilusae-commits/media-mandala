/* MANDALA CHANNEL — FUTURE EXPERIENCE LAYER */
(function(){
  "use strict";
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  document.documentElement.style.scrollBehavior="smooth";
  document.body.classList.add("m-experience-ready");

  // Scroll progress — tiny, useful, always visible.
  const bar=document.createElement("div");bar.className="m-progress-line";document.body.appendChild(bar);
  const progress=()=>{const h=document.documentElement.scrollHeight-innerHeight;bar.style.width=(h>0?(scrollY/h)*100:0)+"%"};progress();
  addEventListener("scroll",progress,{passive:true});

  // Editorial reveal choreography.
  const revealTargets=$$(".m-tv,.m-nusantara,.m-stories,.m-audio,.m-figures,.m-mission,.m-section-head,.m-feature-grid,.m-story-grid,.m-podcast-rail,.m-figure-grid");
  revealTargets.forEach((el,i)=>{el.classList.add("m-reveal");el.style.transitionDelay=Math.min(i*.035,.25)+"s"});
  if("IntersectionObserver" in window){
    const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}}),{threshold:.08});
    revealTargets.forEach(e=>io.observe(e));
  }else revealTargets.forEach(e=>e.classList.add("in"));

  // Desktop cursor that reacts to interactive media.
  if(matchMedia("(pointer:fine)").matches){
    const cursor=document.createElement("div");cursor.className="m-cursor";document.body.appendChild(cursor);
    let tx=innerWidth/2,ty=innerHeight/2,cx=tx,cy=ty;
    addEventListener("pointermove",e=>{tx=e.clientX;ty=e.clientY},{passive:true});
    const loop=()=>{cx+=(tx-cx)*.18;cy+=(ty-cy)*.18;cursor.style.left=cx+"px";cursor.style.top=cy+"px";requestAnimationFrame(loop)};loop();
    $$("a,button,.m-video-card,.m-story-card,.m-podcast-card,.m-figure").forEach(el=>{
      el.addEventListener("mouseenter",()=>cursor.classList.add("big"));
      el.addEventListener("mouseleave",()=>cursor.classList.remove("big"));
    });
  }

  // Gentle image depth. No scroll-jacking.
  if(matchMedia("(pointer:fine)").matches){
    $$(".m-feature-grid .feature,.m-video-card,.m-story-card,.m-figure").forEach(card=>{
      card.addEventListener("pointermove",e=>{
        const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
        card.style.transform="perspective(900px) rotateX("+(-y*2)+"deg) rotateY("+(x*2)+"deg)";
      });
      card.addEventListener("pointerleave",()=>{card.style.transform=""});
    });
  }

  // Make the existing Supabase podcast data actually visible/playable.
  async function loadRealAudio(){
    const rail=$("#podcastRail"),audio=$("#mandalaAudio");
    if(!rail||!audio)return;
    const cfg=window.MANDALA_CONFIG||{},url=cfg.SUPABASE_URL,key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY;
    if(!url||!key)return;
    try{
      const q=url+"/rest/v1/podcasts?select=id,title,description,cover_image_url,status,content_type,audio_url,audio_duration,published_at,created_at&status=eq.published&content_type=eq.audio&order=published_at.desc";
      const res=await fetch(q,{headers:{apikey:key,Authorization:"Bearer "+key}});
      if(!res.ok)throw new Error("audio query "+res.status);
      const rows=await res.json();
      if(!rows.length){rail.innerHTML='<div class="m-audio-empty">Belum ada audio yang dipublikasikan.</div>';return}
      const audioUrl=v=>{
        const s=String(v||"").trim();if(!s)return "";
        if(/^https?:\/\//i.test(s))return s;
        const clean=s.replace(/^\/+/,"");
        return clean.startsWith("podcasts/")?url+"/functions/v1/podcast-audio?key="+encodeURIComponent(clean):clean;
      };
      const fmt=n=>{n=Math.max(0,Math.floor(Number(n)||0));return String(Math.floor(n/60)).padStart(2,"0")+":"+String(n%60).padStart(2,"0")};
      rail.innerHTML=rows.slice(0,8).map(r=>{
        const cover=r.cover_image_url||"https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=500&q=80";
        return '<button class="m-podcast-card" type="button" data-real-audio="'+audioUrl(r.audio_url).replace(/"/g,"&quot;")+'" data-real-title="'+String(r.title||"Mandala Audio").replace(/"/g,"&quot;")+'"><div class="m-podcast-thumb"><img src="'+cover+'" alt="" loading="lazy"><span>▶</span></div><div><small>MANDALA AUDIO</small><strong>'+String(r.title||"Tanpa judul").replace(/</g,"&lt;")+'</strong><em>'+fmt(r.audio_duration)+'</em></div></button>';
      }).join("");
      const play=$("#audioPlay"),title=$("#audioTitle"),status=$("#audioStatus"),prog=$("#audioProgress"),time=$("#audioTime");
      const setCard=card=>{
        const src=card.dataset.realAudio;if(!src){status.textContent="File audio belum tersedia.";return}
        audio.src=src;audio.load();title.textContent=card.dataset.realTitle||"Mandala Audio";status.textContent="Memuat audio…";
        audio.play().catch(()=>{status.textContent="Tekan play untuk mulai mendengarkan."});
      };
      $$(".m-podcast-card",rail).forEach(c=>c.addEventListener("click",()=>setCard(c)));
      play.onclick=()=>{if(!audio.src){status.textContent="Pilih cerita audio terlebih dahulu.";return}audio.paused?audio.play():audio.pause()};
      audio.ontimeupdate=()=>{time.textContent=fmt(audio.currentTime);prog.style.width=(audio.duration?(audio.currentTime/audio.duration*100):0)+"%"};
      audio.onplay=()=>{play.textContent="Ⅱ";status.textContent="Sedang diputar"};
      audio.onpause=()=>{play.textContent="▶";if(audio.currentTime)status.textContent="Dijeda"};
      audio.onended=()=>{play.textContent="▶";status.textContent="Selesai";prog.style.width="0%"};
      audio.onerror=()=>{status.textContent="Audio tidak dapat diputar saat ini."};
    }catch(e){console.warn("Mandala audio:",e)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",loadRealAudio,{once:true});else loadRealAudio();

  // Keep the cinematic header readable without stealing the page.
  const header=$("#siteHeader");
  if(header){
    const sync=()=>header.classList.toggle("scrolled",scrollY>30);
    sync();addEventListener("scroll",sync,{passive:true});
  }
})();