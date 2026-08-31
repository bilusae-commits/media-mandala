/* =========================================================
   MANDALA CHANNEL
   SUPABASE CONFIGURATION
   ========================================================= */

window.MANDALA_CONFIG = {

    SUPABASE_URL:
        "https://roeckoabffhyctfkvbhw.supabase.co",

    SUPABASE_PUBLISHABLE_KEY:
        "sb_publishable_rtbdvp4WdU4xMjn9Hyz4SQ_zIWkzWAr"

};

/* Homepage-only responsive layer. Kept outside main/home CSS so the
   existing design remains intact and the fix can be reverted independently. */
if (document.body && document.body.dataset.base === "./") {
    const fluidFix = document.createElement("link");
    fluidFix.rel = "stylesheet";
    fluidFix.href = "css/index-fluid-fix.css?v=20260831-fluid1";
    document.head.appendChild(fluidFix);
}
