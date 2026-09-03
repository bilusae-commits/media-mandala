/* Mandala Channel — live homepage settings */
(function(){
  "use strict";
  const cfg=window.MANDALA_CONFIG||{},url=cfg.SUPABASE_URL,key=cfg.SUPABASE_PUBLISHABLE_KEY||cfg.SUPABASE_ANON_KEY;
  if(!url||!key)return;
  const headers={apikey:key,Authorization:"Bearer "+key};
  const PROXY=url+"/functions/v1/homepage-cover-image";
  const B2_BASE="https://f005.backblazeb2.com/file/Mandala-Podcast/";
  async function get(table,select,params=""){const r=await fetch(url+"/rest/v1/"+table+"?select="+encodeURIComponent(select)+params,{headers});if(!r.ok)throw new Error(table+" HTTP "+r.status);return r.json()}
  function publicImage(value){const source=String(value||"").trim();if(!source)return "";try{if(new URL(source).hostname.toLowerCase().endsWith(".backblazeb2.com"))return PROXY+"?url="+encodeURIComponent(source)}catch(e){}return source}
  function imageFromKey(key){const k=String(key||"").trim();return k?publicImage(B2_BASE+k):""}
  function setText(id,value){const x=document.getElementById(id);if(x&&value!=null&&value!=="")x.textContent=value}
  function setImage(id,value,alt){const x=document.getElementById(id),source=publicImage(value);if(!x||!source)return;const reveal=()=>x.classList.add("is-live");x.alt=alt||x.alt;if(x.src!==source){x.addEventListener("load",reveal,{once:true});x.addEventListener("error",reveal,{once:true});x.src=source}else reveal()}
  function setLink(id,label,href){const x=document.getElementById(id);if(!x)return;if(label)x.textContent=label;if(href)x.href=href}
  function applySettings(s){
    setText("heroEyebrow",s.hero_label);setText("heroTitle",s.hero_title);setText("heroDescription",s.hero_description);
    setLink("heroPrimary",s.hero_primary_label,s.hero_primary_url);setLink("heroSecondary",s.hero_secondary_label,s.hero_secondary_url);
    setImage("heroImageMain",s.hero_image_main||imageFromKey(s.hero_image_main_key),"Mandala Channel");setImage("heroImageSecondary",s.hero_image_secondary||imageFromKey(s.hero_image_secondary_key),"Mandala Channel");setImage("heroImageTertiary",s.hero_image_tertiary||imageFromKey(s.hero_image_tertiary_key),"Mandala Channel");
    const hero=document.getElementById("heroSection");if(hero){if(s.hero_background_color)hero.style.backgroundColor=s.hero_background_color;const overlaySource=s.hero_overlay_image||imageFromKey(s.hero_overlay_image_key);if(overlaySource){const overlay=publicImage(overlaySource),opacity=Math.max(0,Math.min(1,Number(s.hero_overlay_opacity??.18)));hero.style.setProperty("--hero-overlay-image","url(\""+overlay.replace(/\"/g,"%22")+"\")");hero.style.setProperty("--hero-overlay-opacity",String(opacity));hero.classList.add("has-hero-overlay")}else{hero.style.removeProperty("--hero-overlay-image");hero.classList.remove("has-hero-overlay")}}
  }
  function applyLatest(article){
    if(!article)return;
    const feature=document.querySelector(".feature");
    if(feature){const a=feature.querySelector("a")||feature;const img=feature.querySelector("img"),title=feature.querySelector("h2"),meta=feature.querySelector(".k"),small=feature.querySelector("small");if(img&&article.cover_image_url)img.src=publicImage(article.cover_image_url);if(title)title.textContent=article.title||"";if(meta)meta.textContent="Berita terbaru";if(small)small.textContent="Mandala Channel · Terbaru";if(a&&a.tagName==="A")a.href="pages/artikel-detail.html"+(article.slug?"?slug="+encodeURIComponent(article.slug):"")}
    const cards=document.querySelectorAll("#articlesContainer .card");if(cards.length){const card=cards[0],img=card.querySelector("img"),title=card.querySelector("h3"),meta=card.querySelector(".meta"),link=card.querySelector("a");if(img&&article.cover_image_url)img.src=publicImage(article.cover_image_url);if(title)title.textContent=article.title||"Artikel terbaru";if(meta)meta.textContent="Artikel terbaru";if(link)link.href="pages/artikel-detail.html"+(article.slug?"?slug="+encodeURIComponent(article.slug):"")}}
  async function init(){try{const settings=await get("homepage_settings","*");if(settings[0])applySettings(settings[0]);const articles=await get("articles","id,title,slug,cover_image_url,published_at,created_at,status","&status=eq.published&order=published_at.desc.nullslast&limit=1");applyLatest(articles[0])}catch(e){console.warn("Homepage settings fallback aktif:",e.message)}}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});else init();
})();
