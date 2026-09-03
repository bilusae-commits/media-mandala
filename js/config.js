/* =========================================================
   MANDALA CHANNEL
   SUPABASE CONFIGURATION
   ========================================================= */
window.MANDALA_CONFIG={
  SUPABASE_URL:"https://roeckoabffhyctfkvbhw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY:"sb_publishable_rtbdvp4WdU4xMjn9Hyz4SQ_zIWkzWAr"
};
/* Homepage settings are loaded once by the public page. CSS is declared by index.html
   in its intended order; the final hero layer is injected here after all static CSS. */
if(location.pathname.endsWith("/index.html")||location.pathname.endsWith("/")){
  const heroFix=document.createElement("link");heroFix.rel="stylesheet";heroFix.href="css/index-hero-final.css?v=20260903-01";document.head.appendChild(heroFix);
  const loader=document.createElement("script");loader.src="js/homepage-settings.js?v=20260903-07";document.head.appendChild(loader);
}
