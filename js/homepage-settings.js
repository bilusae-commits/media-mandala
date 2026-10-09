/* MANDALA CHANNEL — LIVE HOMEPAGE PRESENTATION SETTINGS */
(function(){
  "use strict";
  const cfg=window.MANDALA_CONFIG||{},url=cfg.SUPABASE_URL||"",key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY||"";
  const esc=value=>String(value??"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
  function safeImageHref(value){
    const href=safeHref(value,"");
    if(!href)return "";
    try{
      const url=new URL(href,location.href);
      if(url.hostname.endsWith(".backblazeb2.com")&&/^\\/file\\/[^/]+\\/(?:homepage\\/|playlist-covers\\/)/.test(url.pathname)){
        const api=String(window.MANDALA_CONFIG?.SUPABASE_URL||"").replace(/\\/$/,"");
        if(api)return api+"/functions/v1/homepage-cover-image?url="+encodeURIComponent(url.href);
      }
      return url.href;
    }catch(_){return "";}
  }
  function safeHref(value,fallback){const raw=String(value||"").trim();if(!raw)return fallback;try{const u=new URL(raw,location.href);if(!["http:","https:"].includes(u.protocol))return fallback;return u.href;}catch{return fallback;}}
  function setTitle(value){const h=document.querySelector(".origin-copy h1");if(!h||!String(value||"").trim())return;const words=String(value).trim().split(/\s+/);h.setAttribute("aria-label",words.join(" "));h.innerHTML=words.map(word=>"<span>"+esc(word)+"</span>").join("");}
  async function load(){
    try{
      if(!url||!key)return;
      const response=await fetch(url+"/rest/v1/homepage_settings?select=*&limit=1",{headers:{apikey:key,Authorization:"Bearer "+key}});
      if(!response.ok)throw new Error("Pengaturan beranda tidak dapat dimuat ("+response.status+").");
      const rows=await response.json(),s=rows[0];if(!s)return;
      const eyebrow=document.querySelector(".origin-kicker span:first-child");if(eyebrow&&s.hero_label)eyebrow.textContent=s.hero_label;
      setTitle(s.hero_title);
      const description=document.querySelector(".origin-copy p");if(description&&String(s.hero_description||"").trim())description.textContent=s.hero_description;
      const primary=document.getElementById("heroPrimary"),secondary=document.getElementById("heroSecondary");
      if(primary){if(s.hero_primary_label)primary.querySelector("span").textContent=s.hero_primary_label;primary.href=safeHref(s.hero_primary_url,"#tv");}
      if(secondary){if(s.hero_secondary_label)secondary.querySelector("span").textContent=s.hero_secondary_label;secondary.href=safeHref(s.hero_secondary_url,"pages/podcast.html");}
      const hero=document.querySelector(".world-origin");
      if(hero){
        if(s.hero_background_color&&/^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s.hero_background_color.trim()))hero.style.setProperty("--hero-background-color",s.hero_background_color.trim());
        const mainImage=safeImageHref(s.hero_image_main);if(mainImage)hero.style.setProperty("--hero-main-image",'url("'+mainImage.replace(/["\\]/g,"")+'")')
        const overlayImage=safeImageHref(s.hero_overlay_image);if(overlayImage)hero.style.setProperty("--hero-overlay-image",'url("'+overlayImage.replace(/["\\]/g,"")+'")')
        const opacity=Math.min(1,Math.max(0,Number(s.hero_overlay_opacity??.18)));
        hero.style.setProperty("--hero-overlay-opacity",String(Number.isFinite(opacity)?opacity:.18));
      }
    }catch(error){console.warn("Mandala homepage settings:",error);}
    finally{document.body.classList.add("homepage-ready");}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",load,{once:true});else load();
})();