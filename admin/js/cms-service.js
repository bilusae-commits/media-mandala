
window.MandalaCMS = {
  ready() {
    return new Promise(resolve => {
      if (window.mandalaSupabase) return resolve(window.mandalaSupabase);
      window.addEventListener("mandala:supabase-ready", () => resolve(window.mandalaSupabase), {once:true});
    });
  },

  async requireUser() {
    const db = await this.ready();
    const { data, error } = await db.auth.getUser();
    if (error || !data.user) {
      location.href = "index.html";
      return null;
    }
    return data.user;
  },

  slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  },

  youtubeId(url) {
    if (!url) return "";
    const m = url.match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (url.length === 11 ? url : "");
  },

  youtubeThumb(id) {
    return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "";
  },

  playlistId(url) {
    if (!url) return "";
    const m = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
    return m ? m[1] : (url.startsWith("PL") ? url : "");
  },

  async categories() {
    const db = await this.ready();
    const {data,error} = await db.from("categories").select("*").order("sort_order");
    if(error) throw error;
    return data;
  },

  async saveArticle(payload, publish=false) {
    const db = await this.ready();
    const row = {...payload};
    row.slug = row.slug || this.slugify(row.title);
    row.status = publish ? "published" : "draft";
    row.published_at = publish ? new Date().toISOString() : null;
    const {data,error} = await db.from("articles").upsert(row).select().single();
    if(error) throw error;
    return data;
  },

  async saveVideo(payload, publish=false) {
    const db = await this.ready();
    const id = this.youtubeId(payload.youtube_url || payload.youtube_video_id);
    const row = {...payload, youtube_video_id:id, thumbnail_url:payload.thumbnail_url || this.youtubeThumb(id)};
    delete row.youtube_url;
    row.slug = row.slug || this.slugify(row.title);
    row.status = publish ? "published" : "draft";
    row.published_at = publish ? new Date().toISOString() : null;
    const {data,error} = await db.from("videos").upsert(row).select().single();
    if(error) throw error;
    return data;
  },

  async savePlaylist(payload, publish=false) {
    const db = await this.ready();
    const id = this.playlistId(payload.youtube_url || payload.youtube_playlist_id);
    const row = {...payload, youtube_playlist_id:id};
    delete row.youtube_url;
    row.slug = row.slug || this.slugify(row.name);
    row.status = publish ? "published" : "draft";
    row.published_at = publish ? new Date().toISOString() : null;
    const {data,error} = await db.from("playlists").upsert(row).select().single();
    if(error) throw error;
    return data;
  }
};
