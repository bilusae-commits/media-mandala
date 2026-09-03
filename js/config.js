/* =========================================================
   MANDALA CHANNEL
   SUPABASE CONFIGURATION
   ========================================================= */
window.MANDALA_CONFIG={
  SUPABASE_URL:"https://roeckoabffhyctfkvbhw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY:"sb_publishable_rtbdvp4WdU4xMjn9Hyz4SQ_zIWkzWAr"
};
/* Homepage-only responsive layer. */
if(location.pathname.endsWith("/index.html")||location.pathname.endsWith("/")){
  const fix=document.createElement("link");fix.rel="stylesheet";fix.href="css/index-fluid-fix.css?v=20260903-04";document.head.appendChild(fix);
  const loader=document.createElement("script");loader.src="js/homepage-settings.js?v=20260903-04";document.head.appendChild(loader);
}
