/* Mandala Channel — homepage settings */
(function(){
  "use strict";
  const cfg=window.MANDALA_CONFIG||{},url=cfg.SUPABASE_URL,key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY,B2_BASE="https://f005.backblazeb2.com/file/Mandala-Podcast/",PROXY=url?url+"/functions/v1/homepage-cover-image":"";
  const clean=v=>String(v??"").trim().replace(/^DESKRIPSI\s+/i,"").replace(/\s+(?:LABEL|JUDUL|TOMBOL)$/i,"").trim();
  const publicImage=value=>{const s=String(value||"").trim();if(!s)return"";try{if(new URL(s).hostname.toLowerCase().endsWith(".backblazeb2.com")&&PROXY)return PROXY+"?url="+encodeURIComponent(s)}catch(e){}return s};
  const imageFromKey=value=>{const k=String(value||"").trim();return k?publicImage(B2_BASE+k):""};
  async function get(){if(!url||!key)return[];const r=await fetch(url+"/rest/v1/homepage_settings?select=*",{headers:{apikey:key,Authorization:"Bearer "+key}});if(!r.ok)throw Error("homepage_settings HTTP "+r.status);return r.json()}
  function setText(id,v){const el=document.getElementById(id),text=clean(v);if(el&&text)el.textContent=text}
  function setLink(id,label,href){const el=document.getElementById(id);if(!el)return;if(clean(label))el.textContent=clean(label);if(href)el.href=href}
  async function setImage(id,value,alt){const el=document.getElementById(id),src=publicImage(value);if(!el||!src)return;el.src=src;el.alt=alt||el.alt}
  async function apply(s){setText("heroEyebrow",s.hero_label);setText("heroTitle",s.hero_title);setText("heroDescription",s.hero_description);setLink("heroPrimary",s.hero_primary_label,s.hero_primary_url);setLink("heroSecondary",s.hero_secondary_label,s.hero_secondary_url);await setImage("heroImageMain",s.hero_image_main||imageFromKey(s.hero_image_main_key),"Mandala Channel");const hero=document.getElementById("heroSection"),overlay=s.hero_overlay_image||imageFromKey(s.hero_overlay_image_key);if(hero&&overlay){hero.style.setProperty("--hero-overlay-image",`url("${publicImage(overlay).replace(/"/g,"%22")}")`);hero.style.setProperty("--hero-overlay-opacity",String(Math.max(0,Math.min(1,Number(s.hero_overlay_opacity??.15)))));hero.classList.add("has-hero-overlay")}}
  async function init(){try{const rows=await get();if(rows[0])await apply(rows[0])}catch(e){console.warn("Homepage settings fallback:",e.message)}finally{document.body.classList.add("homepage-ready")}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();