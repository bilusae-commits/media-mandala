/* =========================================================
   MANDALA CHANNEL
   SUPABASE CONFIGURATION
   ========================================================= */
window.MANDALA_CONFIG={
  SUPABASE_URL:"https://roeckoabffhyctfkvbhw.supabase.co",
  SUPABASE_PUBLISHABLE_KEY:"sb_publishable_rtbdvp4WdU4xMjn9Hyz4SQ_zIWkzWAr"
};
/* Homepage settings are loaded once by the public page. CSS is declared by index.html
   in its intended order; do not inject index-fluid-fix.css here because doing so after
   index-polish.css would override the final hero stacking rules. */
if(location.pathname.endsWith("/index.html")||location.pathname.endsWith("/")){
  const loader=document.createElement("script");loader.src="js/homepage-settings.js?v=20260903-07";document.head.appendChild(loader);
}
