// Supabase browser client loader.
// Menggunakan CDN sehingga frontend tetap bisa di-host di GitHub Pages.
(function () {
  const script = document.createElement("script");
  script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
  script.onload = () => {
    window.mandalaSupabase = window.supabase.createClient(
      window.MANDALA_CONFIG.SUPABASE_URL,
      window.MANDALA_CONFIG.SUPABASE_ANON_KEY
    );
    window.dispatchEvent(new Event("mandala:supabase-ready"));
  };
  document.head.appendChild(script);
})();
