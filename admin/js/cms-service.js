/* =========================================================
   MANDALA CHANNEL
   CMS SERVICE
   ---------------------------------------------------------
   Penghubung antara CMS Admin/Editor dengan Supabase.

   Fungsi utama:
   - Authentication helper
   - Role Admin / Editor
   - Categories / Topics
   - Articles
   - Videos
   - Playlists
   - Podcasts
   - Media
   - Status content
   - YouTube helper
   - Slug helper
   ========================================================= */

(function (window) {

    "use strict";

    /* =====================================================
       SUPABASE CLIENT
       ===================================================== */

    async function getDatabase() {

        /*
         * Client baru kita berada di:
         * window.MandalaSupabase
         */

        if (
            window.MandalaSupabase &&
            typeof window.MandalaSupabase.getClient === "function"
        ) {
            return await window.MandalaSupabase.getClient();
        }

        /*
         * Compatibility fallback.
         * Dipertahankan supaya CMS tidak rusak jika ada
         * bagian lama yang masih menggunakan nama ini.
         */

        if (window.mandalaSupabase) {
            return window.mandalaSupabase;
        }

        throw new Error(
            "Supabase client belum tersedia. Pastikan supabase-client.js dimuat."
        );
    }


    /* =====================================================
       READY
       ===================================================== */

    async function ready() {
        return await getDatabase();
    }


    /* =====================================================
       CURRENT USER
       ===================================================== */

    async function currentUser() {

        const db = await ready();

        const result = await db.auth.getUser();

        if (result.error) {
            throw result.error;
        }

        return result.data.user || null;
    }


    /* =====================================================
       REQUIRE USER
       -----------------------------------------------------
       Admin + Editor boleh masuk CMS.
       ===================================================== */

    async function requireUser() {

        const db = await ready();

        const result = await db.auth.getUser();

        if (
            result.error ||
            !result.data ||
            !result.data.user
        ) {
            window.location.href = "index.html";
            return null;
        }

        return result.data.user;
    }


    /* =====================================================
       CURRENT PROFILE
       ===================================================== */

    async function currentProfile() {

        const db = await ready();

        const user = await currentUser();

        if (!user) {
            return null;
        }

        const result = await db
            .from("profiles")
            .select(
                "id, full_name, role, avatar_url, created_at, updated_at"
            )
            .eq("id", user.id)
            .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        return result.data || null;
    }


    /* =====================================================
       CURRENT ROLE
       ===================================================== */

    async function currentRole() {

        const profile = await currentProfile();

        return profile
            ? profile.role
            : null;
    }


    /* =====================================================
       ROLE CHECK
       ===================================================== */

    async function isAdmin() {
        return (await currentRole()) === "admin";
    }


    async function isEditor() {
        return (await currentRole()) === "editor";
    }


    async function isStaff() {

        const role = await currentRole();

        return (
            role === "admin" ||
            role === "editor"
        );
    }


    /* =====================================================
       REQUIRE ADMIN
       ===================================================== */

    async function requireAdmin() {

        const allowed = await isAdmin();

        if (!allowed) {
            window.location.href = "dashboard.html";
            return false;
        }

        return true;
    }


    /* =====================================================
       REQUIRE STAFF
       ===================================================== */

    async function requireStaff() {

        const allowed = await isStaff();

        if (!allowed) {
            window.location.href = "index.html";
            return false;
        }

        return true;
    }


    /* =====================================================
       SLUGIFY
       ===================================================== */

    function slugify(text) {

        return String(text || "")
            .toLowerCase()
            .trim()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-+|-+$/g, "");
    }


    /* =====================================================
       UNIQUE SLUG HELPER
       -----------------------------------------------------
       Tidak selalu digunakan.
       Disediakan agar nanti edit konten lebih aman.
       ===================================================== */

    async function uniqueSlug(
        table,
        sourceText,
        currentId = null
    ) {

        const db = await ready();

        const base =
            slugify(sourceText) ||
            "konten";

        let slug = base;
        let counter = 2;

        while (true) {

            let query = db
                .from(table)
                .select("id")
                .eq("slug", slug)
                .limit(1);

            if (currentId) {
                query = query.neq(
                    "id",
                    currentId
                );
            }

            const result = await query;

            if (result.error) {
                throw result.error;
            }

            if (!result.data || result.data.length === 0) {
                return slug;
            }

            slug =
                base +
                "-" +
                counter;

            counter++;
        }
    }


    /* =====================================================
       YOUTUBE VIDEO ID
       ===================================================== */

    function youtubeId(url) {

        if (!url) {
            return "";
        }

        const value =
            String(url).trim();

        /*
         * Jika user langsung memasukkan
         * ID YouTube 11 karakter.
         */

        if (
            /^[A-Za-z0-9_-]{11}$/.test(value)
        ) {
            return value;
        }

        const patterns = [

            /youtu\.be\/([A-Za-z0-9_-]{11})/,

            /youtube\.com\/watch\?[^#]*v=([A-Za-z0-9_-]{11})/,

            /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,

            /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/,

            /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/

        ];

        for (
            let i = 0;
            i < patterns.length;
            i++
        ) {

            const match =
                value.match(patterns[i]);

            if (match) {
                return match[1];
            }
        }

        return "";
    }


    /* =====================================================
       YOUTUBE THUMBNAIL
       ===================================================== */

    function youtubeThumb(id) {

        if (!id) {
            return "";
        }

        return (
            "https://i.ytimg.com/vi/" +
            encodeURIComponent(id) +
            "/hqdefault.jpg"
        );
    }


    /* =====================================================
       YOUTUBE PLAYLIST ID
       ===================================================== */

    function playlistId(url) {

        if (!url) {
            return "";
        }

        const value =
            String(url).trim();

        /*
         * Jika langsung playlist ID.
         */

        if (
            /^PL[A-Za-z0-9_-]+$/.test(value)
        ) {
            return value;
        }

        const match =
            value.match(
                /[?&]list=([A-Za-z0-9_-]+)/
            );

        return match
            ? match[1]
            : "";
    }


    /* =====================================================
       YOUTUBE PLAYLIST URL
       ===================================================== */

    function playlistUrl(id) {

        if (!id) {
            return "";
        }

        return (
            "https://www.youtube.com/playlist?list=" +
            encodeURIComponent(id)
        );
    }


    /* =====================================================
       CONTENT STATUS
       ===================================================== */

    const STATUS = Object.freeze({

        DRAFT: "draft",

        REVIEW: "review",

        PUBLISHED: "published",

        ARCHIVED: "archived"

    });


    /* =====================================================
       PREPARE STATUS
       -----------------------------------------------------
       Editor:
       - draft
       - review

       Admin:
       - draft
       - review
       - published
       - archived
       ===================================================== */

    async function prepareStatus(
        requestedStatus,
        publish = false
    ) {

        const admin =
            await isAdmin();

        const editor =
            await isEditor();

        if (!admin && !editor) {

            throw new Error(
                "Anda tidak memiliki akses CMS."
            );
        }

        /*
         * Tombol Publish dari CMS lama
         * menggunakan publish=true.
         */

        if (publish) {

            if (!admin) {

                throw new Error(
                    "Hanya Admin yang dapat menerbitkan konten."
                );
            }

            return STATUS.PUBLISHED;
        }

        /*
         * Jika status diberikan secara eksplisit.
         */

        if (requestedStatus) {

            if (admin) {

                if (
                    ![
                        STATUS.DRAFT,
                        STATUS.REVIEW,
                        STATUS.PUBLISHED,
                        STATUS.ARCHIVED
                    ].includes(requestedStatus)
                ) {

                    throw new Error(
                        "Status konten tidak valid."
                    );
                }

                return requestedStatus;
            }

            /*
             * Editor tidak boleh publish.
             */

            if (
                [
                    STATUS.PUBLISHED
                ].includes(requestedStatus)
            ) {

                throw new Error(
                    "Editor tidak memiliki hak untuk publish."
                );
            }

            if (
                [
                    STATUS.DRAFT,
                    STATUS.REVIEW,
                    STATUS.ARCHIVED
                ].includes(requestedStatus)
            ) {

                return requestedStatus;
            }

            throw new Error(
                "Status konten tidak valid untuk Editor."
            );
        }

        /*
         * Default.
         */

        return STATUS.DRAFT;
    }


    /* =====================================================
       PUBLISHED DATE
       ===================================================== */

    function publishedAtForStatus(status) {

        if (
            status === STATUS.PUBLISHED
        ) {
            return new Date().toISOString();
        }

        return null;
    }


    /* =====================================================
       GET CATEGORIES / TOPICS
       ===================================================== */

    async function categories() {

        const db = await ready();

        const result = await db
            .from("categories")
            .select("*")
            .order(
                "sort_order",
                {
                    ascending: true
                }
            );

        if (result.error) {
            throw result.error;
        }

        return result.data || [];
    }


    /* =====================================================
       GET SINGLE CATEGORY
       ===================================================== */

    async function category(id) {

        const db = await ready();

        if (!id) {
            return null;
        }

        const result = await db
            .from("categories")
            .select("*")
            .eq("id", id)
            .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        return result.data || null;
    }


    /* =====================================================
       SAVE CATEGORY
       -----------------------------------------------------
       Hanya Admin.
       ===================================================== */

    async function saveCategory(
        payload
    ) {

        await requireAdmin();

        const db = await ready();

        const row = {
            id: payload.id || undefined,

            name:
                String(
                    payload.name || ""
                ).trim(),

            slug:
                payload.slug ||
                slugify(payload.name),

            description:
                payload.description ||
                null,

            image_url:
                payload.image_url ||
                null,

            sort_order:
                Number.isFinite(
                    Number(payload.sort_order)
                )
                    ? Number(payload.sort_order)
                    : 0,

            is_active:
                payload.is_active !== false
        };

        if (!row.name) {
            throw new Error(
                "Nama Topic wajib diisi."
            );
        }

        if (!row.slug) {
            throw new Error(
                "Slug Topic tidak valid."
            );
        }

        if (!row.id) {
            delete row.id;
        }

        const result = await db
            .from("categories")
            .upsert(row)
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       DELETE CATEGORY
       ===================================================== */

    async function deleteCategory(id) {

        await requireAdmin();

        const db = await ready();

        if (!id) {
            throw new Error(
                "ID Topic tidak ditemukan."
            );
        }

        const result = await db
            .from("categories")
            .delete()
            .eq("id", id);

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       SAVE ARTICLE
       ===================================================== */

    async function saveArticle(
        payload,
        publish = false
    ) {

        await requireStaff();

        const db = await ready();

        const user =
            await currentUser();

        const status =
            await prepareStatus(
                payload.status,
                publish
            );

        const row = {

            title:
                String(
                    payload.title || ""
                ).trim(),

            slug:
                payload.slug ||
                slugify(payload.title),

            excerpt:
                payload.excerpt ||
                null,

            content:
                payload.content ||
                null,

            cover_image_url:
                payload.cover_image_url ||
                payload.cover ||
                null,

            category_id:
                payload.category_id ||
                null,

            author_id:
                payload.author_id ||
                (user ? user.id : null),

            status:

                status,

            featured:
                payload.featured === true,

            published_at:
                publishedAtForStatus(
                    status
                )
        };

        if (!row.title) {
            throw new Error(
                "Judul artikel wajib diisi."
            );
        }

        if (!row.slug) {
            throw new Error(
                "Slug artikel tidak valid."
            );
        }

        /*
         * ID hanya dimasukkan jika memang
         * sedang melakukan edit.
         */

        if (payload.id) {
            row.id = payload.id;
        }

        const result = await db
            .from("articles")
            .upsert(row)
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       GET ARTICLES
       ===================================================== */

    async function articles(
        options = {}
    ) {

        const db = await ready();

        let query = db
            .from("articles")
            .select(
                `
                *,
                categories (
                    id,
                    name,
                    slug
                )
                `
            )
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

        if (
            Number.isFinite(
                Number(options.limit)
            )
        ) {

            query =
                query.limit(
                    Number(options.limit)
                );
        }

        const result =
            await query;

        if (result.error) {
            throw result.error;
        }

        return result.data || [];
    }


    /* =====================================================
       GET ARTICLE
       ===================================================== */

    async function article(id) {

        const db = await ready();

        const result = await db
            .from("articles")
            .select(
                `
                *,
                categories (
                    id,
                    name,
                    slug
                )
                `
            )
            .eq("id", id)
            .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        return result.data || null;
    }


    /* =====================================================
       DELETE ARTICLE
       ===================================================== */

    async function deleteArticle(id) {

        await requireStaff();

        const db = await ready();

        const result = await db
            .from("articles")
            .delete()
            .eq("id", id);

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       SAVE VIDEO
       ===================================================== */

    async function saveVideo(
        payload,
        publish = false
    ) {

        await requireStaff();

        const db = await ready();

        const user =
            await currentUser();

        /*
         * PENTING:
         * youtube_url TIDAK dihapus.
         *
         * Schema kita memang memiliki:
         *
         * youtube_url
         * youtube_video_id
         */

        const source =
            payload.youtube_url ||
            payload.youtube_video_id ||
            "";

        const videoId =
            youtubeId(source);

        if (!videoId) {

            throw new Error(
                "URL YouTube tidak valid atau Video ID tidak ditemukan."
            );
        }

        const status =
            await prepareStatus(
                payload.status,
                publish
            );

        const row = {

            title:
                String(
                    payload.title || ""
                ).trim(),

            slug:
                payload.slug ||
                slugify(payload.title),

            youtube_url:
                payload.youtube_url ||
                (
                    "https://www.youtube.com/watch?v=" +
                    videoId
                ),

            youtube_video_id:
                videoId,

            thumbnail_url:
                payload.thumbnail_url ||
                youtubeThumb(videoId),

            description:
                payload.description ||
                null,

            category_id:
                payload.category_id ||
                null,

            author_id:
                payload.author_id ||
                (user ? user.id : null),

            status:
                status,

            featured:
                payload.featured === true,

            published_at:
                publishedAtForStatus(
                    status
                )
        };

        if (!row.title) {

            throw new Error(
                "Judul video wajib diisi."
            );
        }

        if (payload.id) {
            row.id = payload.id;
        }

        const result = await db
            .from("videos")
            .upsert(row)
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       GET VIDEOS
       ===================================================== */

    async function videos(
        options = {}
    ) {

        const db = await ready();

        let query = db
            .from("videos")
            .select(
                `
                *,
                categories (
                    id,
                    name,
                    slug
                )
                `
            )
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

        if (
            Number.isFinite(
                Number(options.limit)
            )
        ) {

            query =
                query.limit(
                    Number(options.limit)
                );
        }

        const result =
            await query;

        if (result.error) {
            throw result.error;
        }

        return result.data || [];
    }


    /* =====================================================
       DELETE VIDEO
       ===================================================== */

    async function deleteVideo(id) {

        await requireStaff();

        const db = await ready();

        const result = await db
            .from("videos")
            .delete()
            .eq("id", id);

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       SAVE PLAYLIST
       ===================================================== */

    async function savePlaylist(
        payload,
        publish = false
    ) {

        await requireStaff();

        const db = await ready();

        const user =
            await currentUser();

        /*
         * Form lama menggunakan:
         *
         * name
         *
         * Database menggunakan:
         *
         * title
         *
         * Kita dukung keduanya.
         */

        const title =
            payload.title ||
            payload.name ||
            "";

        const source =
            payload.youtube_url ||
            payload.youtube_playlist_id ||
            "";

        const playlist =
            playlistId(source);

        if (!playlist) {

            throw new Error(
                "URL YouTube Playlist tidak valid."
            );
        }

        const status =
            await prepareStatus(
                payload.status,
                publish
            );

        const row = {

            title:
                String(title).trim(),

            slug:
                payload.slug ||
                slugify(title),

            youtube_playlist_id:
                playlist,

            description:
                payload.description ||
                null,

            cover_image_url:
                payload.cover_image_url ||
                null,

            category_id:
                payload.category_id ||
                null,

            author_id:
                payload.author_id ||
                (user ? user.id : null),

            status:
                status,

            featured:
                payload.featured === true,

            sort_order:
                Number.isFinite(
                    Number(payload.sort_order)
                )
                    ? Number(payload.sort_order)
                    : 0,

            published_at:
                publishedAtForStatus(
                    status
                )
        };

        if (!row.title) {

            throw new Error(
                "Judul playlist wajib diisi."
            );
        }

        if (payload.id) {
            row.id = payload.id;
        }

        const result = await db
            .from("playlists")
            .upsert(row)
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       GET PLAYLISTS
       ===================================================== */

    async function playlists(
        options = {}
    ) {

        const db = await ready();

        let query = db
            .from("playlists")
            .select(
                `
                *,
                categories (
                    id,
                    name,
                    slug
                )
                `
            )
            .order(
                "sort_order",
                {
                    ascending: true
                }
            )
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

        const result =
            await query;

        if (result.error) {
            throw result.error;
        }

        return result.data || [];
    }


    /* =====================================================
       DELETE PLAYLIST
       ===================================================== */

    async function deletePlaylist(id) {

        await requireStaff();

        const db = await ready();

        const result = await db
            .from("playlists")
            .delete()
            .eq("id", id);

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       SAVE PODCAST
       ===================================================== */

    async function savePodcast(
        payload,
        publish = false
    ) {

        await requireStaff();

        const db = await ready();

        const user =
            await currentUser();

        const status =
            await prepareStatus(
                payload.status,
                publish
            );

        let videoId =
            payload.youtube_video_id ||
            "";

        if (
            payload.youtube_url
        ) {

            videoId =
                youtubeId(
                    payload.youtube_url
                );
        }

        const row = {

            title:
                String(
                    payload.title || ""
                ).trim(),

            slug:
                payload.slug ||
                slugify(payload.title),

            description:
                payload.description ||
                null,

            cover_image_url:
                payload.cover_image_url ||
                null,

            youtube_url:
                payload.youtube_url ||
                null,

            youtube_video_id:
                videoId ||
                null,

            category_id:
                payload.category_id ||
                null,

            author_id:
                payload.author_id ||
                (user ? user.id : null),

            status:
                status,

            featured:
                payload.featured === true,

            published_at:
                publishedAtForStatus(
                    status
                )
        };

        if (!row.title) {

            throw new Error(
                "Judul podcast wajib diisi."
            );
        }

        if (payload.id) {
            row.id = payload.id;
        }

        const result = await db
            .from("podcasts")
            .upsert(row)
            .select()
            .single();

        if (result.error) {
            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       GET PODCASTS
       ===================================================== */

    async function podcasts(
        options = {}
    ) {

        const db = await ready();

        let query = db
            .from("podcasts")
            .select(
                `
                *,
                categories (
                    id,
                    name,
                    slug
                )
                `
            )
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

        const result =
            await query;

        if (result.error) {
            throw result.error;
        }

        return result.data || [];
    }


    /* =====================================================
       DELETE PODCAST
       ===================================================== */

    async function deletePodcast(id) {

        await requireStaff();

        const db = await ready();

        const result = await db
            .from("podcasts")
            .delete()
            .eq("id", id);

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       MEDIA
       ===================================================== */

    async function media(
        options = {}
    ) {

        const db = await ready();

        let query = db
            .from("media")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );

        if (
            Number.isFinite(
                Number(options.limit)
            )
        ) {

            query =
                query.limit(
                    Number(options.limit)
                );
        }

        const result =
            await query;

        if (result.error) {
            throw result.error;
        }

        return result.data || [];
    }


    /* =====================================================
       UPLOAD MEDIA
       ===================================================== */

    async function uploadMedia(
        file,
        folder = "general",
        altText = ""
    ) {

        await requireStaff();

        if (!file) {

            throw new Error(
                "File belum dipilih."
            );
        }

        const db =
            await ready();

        const user =
            await currentUser();

        /*
         * Sanitasi nama file.
         */

        const originalName =
            String(
                file.name ||
                "file"
            )
                .normalize("NFD")
                .replace(
                    /[\u0300-\u036f]/g,
                    ""
                )
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "-"
                );

        const safeFolder =
            String(folder || "general")
                .replace(
                    /[^a-zA-Z0-9/_-]/g,
                    ""
                )
                .replace(
                    /^\/+|\/+$/g,
                    ""
                );

        const filePath =
            (
                safeFolder ||
                "general"
            ) +
            "/" +
            Date.now() +
            "-" +
            originalName;

        const upload =
            await db
                .storage
                .from("mandala-media")
                .upload(
                    filePath,
                    file,
                    {
                        cacheControl:
                            "3600",
                        upsert:
                            false
                    }
                );

        if (upload.error) {
            throw upload.error;
        }

        const publicUrl =
            db
                .storage
                .from("mandala-media")
                .getPublicUrl(
                    filePath
                );

        const fileUrl =
            publicUrl
                .data
                .publicUrl;

        /*
         * Simpan metadata ke tabel media.
         */

        const result =
            await db
                .from("media")
                .insert({

                    file_name:
                        file.name,

                    file_url:
                        fileUrl,

                    storage_path:
                        filePath,

                    mime_type:
                        file.type ||
                        null,

                    file_size:
                        Number(
                            file.size ||
                            0
                        ),

                    alt_text:
                        altText ||
                        null,

                    uploaded_by:
                        user
                            ? user.id
                            : null

                })
                .select()
                .single();

        if (result.error) {

            /*
             * Jika metadata gagal disimpan,
             * file tetap berada di Storage.
             *
             * Error dikembalikan supaya CMS
             * mengetahui proses belum sempurna.
             */

            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       DELETE MEDIA
       ===================================================== */

    async function deleteMedia(
        id,
        storagePath = null
    ) {

        await requireStaff();

        const db =
            await ready();

        /*
         * Hapus file Storage jika path tersedia.
         */

        if (storagePath) {

            const storageResult =
                await db
                    .storage
                    .from("mandala-media")
                    .remove([
                        storagePath
                    ]);

            if (
                storageResult.error
            ) {
                throw storageResult.error;
            }
        }

        /*
         * Hapus metadata.
         */

        const result =
            await db
                .from("media")
                .delete()
                .eq(
                    "id",
                    id
                );

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       CHANGE CONTENT STATUS
       -----------------------------------------------------
       Dipakai untuk workflow:
       draft → review → published
       ===================================================== */

    async function changeStatus(
        table,
        id,
        status
    ) {

        await requireStaff();

        const allowedTables = [
            "articles",
            "videos",
            "playlists",
            "podcasts"
        ];

        if (
            !allowedTables.includes(
                table
            )
        ) {

            throw new Error(
                "Table konten tidak diizinkan."
            );
        }

        const finalStatus =
            await prepareStatus(
                status,
                status === STATUS.PUBLISHED
            );

        const db =
            await ready();

        const result =
            await db
                .from(table)
                .update({

                    status:
                        finalStatus,

                    published_at:
                        publishedAtForStatus(
                            finalStatus
                        )

                })
                .eq(
                    "id",
                    id
                )
                .select()
                .single();

        if (result.error) {
            throw result.error;
        }

        return result.data;
    }


    /* =====================================================
       GENERIC DELETE CONTENT
       ===================================================== */

    async function deleteContent(
        table,
        id
    ) {

        await requireStaff();

        const allowedTables = [
            "articles",
            "videos",
            "playlists",
            "podcasts"
        ];

        if (
            !allowedTables.includes(
                table
            )
        ) {

            throw new Error(
                "Table tidak diizinkan."
            );
        }

        const db =
            await ready();

        const result =
            await db
                .from(table)
                .delete()
                .eq(
                    "id",
                    id
                );

        if (result.error) {
            throw result.error;
        }

        return true;
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    async function logout() {

        const db =
            await ready();

        const result =
            await db.auth.signOut();

        if (result.error) {
            throw result.error;
        }

        window.location.href =
            "index.html";
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MandalaCMS = {

        /* Core */

        ready,

        requireUser,

        requireStaff,

        requireAdmin,

        currentUser,

        currentProfile,

        currentRole,

        isAdmin,

        isEditor,

        isStaff,

        logout,


        /* Utility */

        slugify,

        uniqueSlug,

        youtubeId,

        youtubeThumb,

        playlistId,

        playlistUrl,


        /* Status */

        STATUS,

        changeStatus,


        /* Categories / Topics */

        categories,

        category,

        saveCategory,

        deleteCategory,


        /* Articles */

        articles,

        article,

        saveArticle,

        deleteArticle,


        /* Videos */

        videos,

        saveVideo,

        deleteVideo,


        /* Playlists */

        playlists,

        savePlaylist,

        deletePlaylist,


        /* Podcasts */

        podcasts,

        savePodcast,

        deletePodcast,


        /* Media */

        media,

        uploadMedia,

        deleteMedia,


        /* Generic */

        deleteContent

    };

})(window);
