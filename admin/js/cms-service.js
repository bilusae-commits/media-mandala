/* =====================================================
   MANDALA CHANNEL
   CMS SERVICE
===================================================== */

import { supabase } from "../../js/supabase-client.js";


/* =====================================================
   SUPABASE
===================================================== */

async function ready() {
    return supabase;
}


/* =====================================================
   CURRENT USER
===================================================== */

async function currentUser() {

    const db = await ready();

    const {
        data,
        error
    } = await db.auth.getUser();


    if (error) {
        throw error;
    }


    return data?.user || null;
}


/* =====================================================
   CURRENT PROFILE
===================================================== */

async function currentProfile() {

    const db =
        await ready();

    const user =
        await currentUser();


    if (!user) {

        return null;

    }


    const {
        data,
        error
    } = await db
        .from("profiles")
        .select(`
            id,
            full_name,
            role,
            avatar_url,
            created_at,
            updated_at
        `)
        .eq(
            "id",
            user.id
        )
        .maybeSingle();


    /*
     * Jika tabel profiles belum memiliki
     * data untuk user ini, jangan langsung
     * melempar user kembali ke dashboard.
     */

    if (error) {

        console.warn(
            "Profile error:",
            error
        );

    }


    if (!data) {

        const metadata =
            user.user_metadata || {};


        return {

            id:
                user.id,

            full_name:
                metadata.full_name ||
                metadata.name ||
                user.email ||
                "Admin",

            role:
                metadata.role ||
                "admin",

            avatar_url:
                metadata.avatar_url ||
                null,

            email:
                user.email || ""

        };

    }


    return {

        ...data,

        email:
            user.email || ""

    };

}


/* =====================================================
   CURRENT ROLE
===================================================== */

async function currentRole() {

    const profile =
        await currentProfile();


    return profile
        ? profile.role
        : null;
}


/* =====================================================
   ROLE CHECK
===================================================== */

async function isAdmin() {

    return (
        await currentRole()
    ) === "admin";
}


async function isEditor() {

    return (
        await currentRole()
    ) === "editor";
}


async function isStaff() {

    const role =
        await currentRole();


    return (
        role === "admin" ||
        role === "editor"
    );
}


/* =====================================================
   REQUIRE USER
===================================================== */

async function requireUser() {

    const user =
        await currentUser();


    if (!user) {

        window.location.href =
            "index.html";

        return null;
    }


    return user;
}


/* =====================================================
   REQUIRE STAFF
   ADMIN + EDITOR
===================================================== */

async function requireStaff() {

    const profile =
        await currentProfile();


    if (!profile) {

        window.location.href =
            "index.html";

        return null;
    }


    if (
        profile.role !== "admin" &&
        profile.role !== "editor"
    ) {

        window.location.href =
            "index.html";

        return null;
    }


    return profile;
}


/* =====================================================
   REQUIRE ADMIN
===================================================== */

async function requireAdmin() {

    const profile =
        await currentProfile();


    if (!profile) {

        window.location.href =
            "index.html";

        return null;
    }


    if (
        profile.role !== "admin"
    ) {

        window.location.href =
            "dashboard.html";

        return null;
    }


    return profile;
}


/* =====================================================
   LOGOUT
===================================================== */

async function logout() {

    const {
        error
    } = await supabase.auth.signOut();


    if (error) {
        throw error;
    }


    window.location.href =
        "index.html";
}


/* =====================================================
   ARTICLES
===================================================== */

async function articles(options = {}) {

    const db = await ready();


    let query =
        db
            .from("articles")
            .select(`
                *,
                categories (
                    id,
                    name,
                    slug
                )
            `)
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (options.status) {

        query =
            query.eq(
                "status",
                options.status
            );
    }


    if (options.category_id) {

        query =
            query.eq(
                "category_id",
                options.category_id
            );
    }


    if (options.limit) {

        query =
            query.limit(
                options.limit
            );
    }


    const {
        data,
        error
    } = await query;


    if (error) {
        throw error;
    }


    return data || [];
}


/* =====================================================
   GET ARTICLE
===================================================== */

async function article(id) {

    if (!id) {
        throw new Error(
            "ID artikel tidak ditemukan."
        );
    }


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("articles")
        .select(`
            *,
            categories (
                id,
                name,
                slug
            )
        `)
        .eq(
            "id",
            id
        )
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   CREATE ARTICLE
===================================================== */

async function createArticle(payload) {

    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("articles")
        .insert(payload)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   UPDATE ARTICLE
===================================================== */

async function updateArticle(
    id,
    payload
) {

    if (!id) {

        throw new Error(
            "ID artikel tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("articles")
        .update(payload)
        .eq(
            "id",
            id
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   DELETE ARTICLE
===================================================== */

async function deleteArticle(id) {

    if (!id) {

        throw new Error(
            "ID artikel tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        error
    } = await db
        .from("articles")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {
        throw error;
    }


    return true;
}


/* =====================================================
   VIDEOS
===================================================== */

async function videos(options = {}) {

    const db = await ready();


    let query =
        db
            .from("videos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (options.status) {

        query =
            query.eq(
                "status",
                options.status
            );
    }


    if (options.limit) {

        query =
            query.limit(
                options.limit
            );
    }


    const {
        data,
        error
    } = await query;


    if (error) {
        throw error;
    }


    return data || [];
}


/* =====================================================
   GET VIDEO
===================================================== */

async function video(id) {

    if (!id) {

        throw new Error(
            "ID video tidak ditemukan."
        );
    }


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("videos")
        .select("*")
        .eq(
            "id",
            id
        )
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   CREATE VIDEO
===================================================== */

async function createVideo(payload) {

    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("videos")
        .insert(payload)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   UPDATE VIDEO
===================================================== */

async function updateVideo(
    id,
    payload
) {

    if (!id) {

        throw new Error(
            "ID video tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("videos")
        .update(payload)
        .eq(
            "id",
            id
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   DELETE VIDEO
===================================================== */

async function deleteVideo(id) {

    if (!id) {

        throw new Error(
            "ID video tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        error
    } = await db
        .from("videos")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {
        throw error;
    }


    return true;
}


/* =====================================================
   PLAYLISTS
===================================================== */

async function playlists(options = {}) {

    const db = await ready();


    let query =
        db
            .from("playlists")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (options.status) {

        query =
            query.eq(
                "status",
                options.status
            );
    }


    if (options.limit) {

        query =
            query.limit(
                options.limit
            );
    }


    const {
        data,
        error
    } = await query;


    if (error) {
        throw error;
    }


    return data || [];
}


/* =====================================================
   GET PLAYLIST
===================================================== */

async function playlist(id) {

    if (!id) {

        throw new Error(
            "ID playlist tidak ditemukan."
        );
    }


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("playlists")
        .select("*")
        .eq(
            "id",
            id
        )
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   CREATE PLAYLIST
===================================================== */

async function createPlaylist(payload) {

    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("playlists")
        .insert(payload)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   UPDATE PLAYLIST
===================================================== */

async function updatePlaylist(
    id,
    payload
) {

    if (!id) {

        throw new Error(
            "ID playlist tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("playlists")
        .update(payload)
        .eq(
            "id",
            id
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   DELETE PLAYLIST
===================================================== */

async function deletePlaylist(id) {

    if (!id) {

        throw new Error(
            "ID playlist tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        error
    } = await db
        .from("playlists")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {
        throw error;
    }


    return true;
}


/* =====================================================
   PODCASTS
===================================================== */

async function podcasts(options = {}) {

    const db = await ready();


    let query =
        db
            .from("podcasts")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (options.status) {

        query =
            query.eq(
                "status",
                options.status
            );
    }


    if (options.limit) {

        query =
            query.limit(
                options.limit
            );
    }


    const {
        data,
        error
    } = await query;


    if (error) {
        throw error;
    }


    return data || [];
}


/* =====================================================
   GET PODCAST
===================================================== */

async function podcast(id) {

    if (!id) {

        throw new Error(
            "ID podcast tidak ditemukan."
        );
    }


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("podcasts")
        .select("*")
        .eq(
            "id",
            id
        )
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   CREATE PODCAST
===================================================== */

async function createPodcast(payload) {

    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("podcasts")
        .insert(payload)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   UPDATE PODCAST
===================================================== */

async function updatePodcast(
    id,
    payload
) {

    if (!id) {

        throw new Error(
            "ID podcast tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("podcasts")
        .update(payload)
        .eq(
            "id",
            id
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   DELETE PODCAST
===================================================== */

async function deletePodcast(id) {

    if (!id) {

        throw new Error(
            "ID podcast tidak ditemukan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        error
    } = await db
        .from("podcasts")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {
        throw error;
    }


    return true;
}


/* =====================================================
   CATEGORIES
===================================================== */

async function categories() {

    await requireAdmin();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("categories")
        .select("*")
        .order(
            "name",
            {
                ascending: true
            }
        );


    if (error) {
        throw error;
    }


    return data || [];
}


/* =====================================================
   GET CATEGORY
===================================================== */

async function category(id) {

    if (!id) {

        throw new Error(
            "ID kategori tidak ditemukan."
        );
    }


    await requireAdmin();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("categories")
        .select("*")
        .eq(
            "id",
            id
        )
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   CREATE CATEGORY
===================================================== */

async function createCategory(payload) {

    await requireAdmin();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("categories")
        .insert(payload)
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   UPDATE CATEGORY
===================================================== */

async function updateCategory(
    id,
    payload
) {

    if (!id) {

        throw new Error(
            "ID kategori tidak ditemukan."
        );
    }


    await requireAdmin();


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from("categories")
        .update(payload)
        .eq(
            "id",
            id
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   DELETE CATEGORY
===================================================== */

async function deleteCategory(id) {

    if (!id) {

        throw new Error(
            "ID kategori tidak ditemukan."
        );
    }


    await requireAdmin();


    const db = await ready();


    const {
        error
    } = await db
        .from("categories")
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {
        throw error;
    }


    return true;
}


/* =====================================================
   CHANGE STATUS
===================================================== */

async function changeStatus(
    table,
    id,
    status
) {

    if (!table) {

        throw new Error(
            "Table tidak ditemukan."
        );
    }


    if (!id) {

        throw new Error(
            "ID konten tidak ditemukan."
        );
    }


    if (!status) {

        throw new Error(
            "Status tidak ditemukan."
        );
    }


    await requireStaff();


    const allowedTables = [
        "articles",
        "videos",
        "playlists",
        "podcasts"
    ];


    if (
        !allowedTables.includes(table)
    ) {

        throw new Error(
            "Table tidak diizinkan."
        );
    }


    const db = await ready();


    const {
        data,
        error
    } = await db
        .from(table)
        .update({
            status: status
        })
        .eq(
            "id",
            id
        )
        .select()
        .single();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   DELETE CONTENT
===================================================== */

async function deleteContent(
    table,
    id
) {

    if (!table) {

        throw new Error(
            "Table tidak ditemukan."
        );
    }


    if (!id) {

        throw new Error(
            "ID konten tidak ditemukan."
        );
    }


    const allowedTables = [
        "articles",
        "videos",
        "playlists",
        "podcasts"
    ];


    if (
        !allowedTables.includes(table)
    ) {

        throw new Error(
            "Table tidak diizinkan."
        );
    }


    await requireStaff();


    const db = await ready();


    const {
        error
    } = await db
        .from(table)
        .delete()
        .eq(
            "id",
            id
        );


    if (error) {
        throw error;
    }


    return true;
}


/* =====================================================
   EXPORT
===================================================== */

export {

    supabase,

    ready,

    currentUser,
    currentProfile,
    currentRole,

    isAdmin,
    isEditor,
    isStaff,

    requireUser,
    requireStaff,
    requireAdmin,

    logout,

    articles,
    article,
    createArticle,
    updateArticle,
    deleteArticle,

    videos,
    video,
    createVideo,
    updateVideo,
    deleteVideo,

    playlists,
    playlist,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,

    podcasts,
    podcast,
    createPodcast,
    updatePodcast,
    deletePodcast,

    categories,
    category,
    createCategory,
    updateCategory,
    deleteCategory,

    changeStatus,
    deleteContent
};
