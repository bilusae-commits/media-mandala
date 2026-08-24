import "../../js/supabase-client.js";

const API = window.MandalaSupabase;

if (!API) {
    throw new Error("MandalaSupabase belum dimuat.");
}

const supabase = await API.getClient();

export async function getCurrentUser() {
    return await API.auth.getUser();
}

export async function getCurrentAuth() {
    return await API.auth.getCurrent();
}

export async function requireStaff() {
    const auth = await getCurrentAuth();

    if (!auth?.authenticated) {
        window.location.replace("login.html");
        return null;
    }

    if (auth.role !== "admin" && auth.role !== "editor") {
        window.location.replace("index.html");
        return null;
    }

    return {
        ...(auth.profile || {}),
        role: auth.role,
        user: auth.user,
        authenticated: true
    };
}

export async function logout() {
    await API.auth.signOut();
    window.location.href = "login.html";
}

export async function getVideos() {
    const { data, error } = await supabase
        .from("videos")
        .select(`
            id,title,slug,youtube_url,youtube_video_id,
            thumbnail_url,description,category_id,status,
            featured,published_at,created_at,updated_at,author_id
        `)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getVideo(id) {
    const { data, error } = await supabase
        .from("videos")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    return data;
}

export async function createVideo(payload) {
    const { data, error } = await supabase
        .from("videos")
        .insert(payload)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateVideo(id, payload) {
    const { data, error } = await supabase
        .from("videos")
        .update(payload)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteVideo(id) {
    const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", id);

    if (error) throw error;
    return true;
}

const ARTICLE_COLUMNS = `
    id,title,slug,excerpt,content,cover_image_url,
    category_id,status,featured,published_at,created_at,
    updated_at,author_id,categories:category_id(id,name,slug)
`;

export async function articles() {
    const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_COLUMNS)
        .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function article(id) {
    const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_COLUMNS)
        .eq("id", id)
        .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Artikel tidak ditemukan.");

    return data;
}

export async function createArticle(payload) {
    const { data, error } = await supabase
        .from("articles")
        .insert(payload)
        .select(ARTICLE_COLUMNS)
        .single();

    if (error) throw error;
    return data;
}

export async function updateArticle(id, payload) {
    const { data, error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", id)
        .select(ARTICLE_COLUMNS)
        .single();

    if (error) throw error;
    return data;
}

export async function deleteArticle(id) {
    const { error } = await supabase
        .from("articles")
        .delete()
        .eq("id", id);

    if (error) throw error;
    return true;
}

export async function changeStatus(tableName, id, status) {
    if (!tableName || !id || !status) {
        throw new Error("Data status tidak lengkap.");
    }

    const payload = {
        status,
        published_at:
            status === "published"
                ? new Date().toISOString()
                : null
    };

    const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getCategories() {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function select(tableName, columns = "*") {
    const { data, error } = await supabase
        .from(tableName)
        .select(columns);

    if (error) throw error;
    return data || [];
}

export async function insert(tableName, payload) {
    const { data, error } = await supabase
        .from(tableName)
        .insert(payload)
        .select();

    if (error) throw error;
    return data;
}

export async function update(tableName, id, payload) {
    const { data, error } = await supabase
        .from(tableName)
        .update(payload)
        .eq("id", id)
        .select();

    if (error) throw error;
    return data;
}

export async function remove(tableName, id) {
    const { error } = await supabase
        .from(tableName)
        .delete()
        .eq("id", id);

    if (error) throw error;
    return true;
}

window.MandalaCMS = {
    currentUser: getCurrentUser,
    currentAuth: getCurrentAuth,
    requireStaff,
    logout,
    videos: getVideos,
    video: getVideo,
    createVideo,
    updateVideo,
    deleteVideo,
    articles,
    article,
    createArticle,
    updateArticle,
    deleteArticle,
    categories: getCategories,
    changeStatus,
    select,
    insert,
    update,
    remove
};
