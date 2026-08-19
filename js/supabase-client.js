/* =========================================================
   MANDALA CHANNEL
   SUPABASE CLIENT
   ---------------------------------------------------------
   Khusus Admin / Editor CMS
   ========================================================= */

(function (window) {

    "use strict";

    const CONFIG = window.MANDALA_CONFIG || {};

    const SUPABASE_URL =
        CONFIG.SUPABASE_URL ||
        window.SUPABASE_URL ||
        "";

    const SUPABASE_KEY =
        CONFIG.SUPABASE_PUBLISHABLE_KEY ||
        CONFIG.SUPABASE_ANON_KEY ||
        window.SUPABASE_PUBLISHABLE_KEY ||
        window.SUPABASE_ANON_KEY ||
        "";

    let client = null;
    let libraryPromise = null;

    let currentUser = null;
    let currentProfile = null;


    /* =====================================================
       CONFIG
       ===================================================== */

    function validateConfig() {

        if (!SUPABASE_URL) {
            throw new Error(
                "Supabase URL belum dikonfigurasi."
            );
        }

        if (!SUPABASE_KEY) {
            throw new Error(
                "Supabase publishable key belum dikonfigurasi."
            );
        }
    }


    /* =====================================================
       LOAD SUPABASE LIBRARY
       ===================================================== */

    async function loadLibrary() {

        if (
            window.supabase &&
            typeof window.supabase.createClient === "function"
        ) {
            return window.supabase;
        }

        if (libraryPromise) {
            return libraryPromise;
        }

        libraryPromise = new Promise(
            function (resolve, reject) {

                const existing =
                    document.querySelector(
                        "script[data-mandala-supabase]"
                    );

                if (existing) {

                    existing.addEventListener(
                        "load",
                        function () {

                            if (
                                window.supabase &&
                                typeof window.supabase.createClient ===
                                "function"
                            ) {
                                resolve(
                                    window.supabase
                                );
                            } else {
                                reject(
                                    new Error(
                                        "Supabase library tidak tersedia."
                                    )
                                );
                            }

                        }
                    );

                    existing.addEventListener(
                        "error",
                        function () {

                            reject(
                                new Error(
                                    "Gagal memuat Supabase library."
                                )
                            );

                        }
                    );

                    return;
                }

                const script =
                    document.createElement("script");

                script.src =
                    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

                script.async = true;

                script.dataset.mandalaSupabase =
                    "true";

                script.onload =
                    function () {

                        if (
                            window.supabase &&
                            typeof window.supabase.createClient ===
                            "function"
                        ) {
                            resolve(
                                window.supabase
                            );
                        } else {
                            reject(
                                new Error(
                                    "Supabase createClient tidak tersedia."
                                )
                            );
                        }

                    };

                script.onerror =
                    function () {

                        reject(
                            new Error(
                                "Supabase tidak dapat dimuat. Periksa koneksi internet."
                            )
                        );

                    };

                document.head.appendChild(
                    script
                );
            }
        );

        return libraryPromise;
    }


    /* =====================================================
       INITIALIZE
       ===================================================== */

    async function init() {

        if (client) {
            return client;
        }

        validateConfig();

        const supabase =
            await loadLibrary();

        client =
            supabase.createClient(
                SUPABASE_URL,
                SUPABASE_KEY,
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: true,
                        flowType: "pkce"
                    }
                }
            );

        return client;
    }


    async function getClient() {
        return await init();
    }


    /* =====================================================
       SESSION
       ===================================================== */

    async function getSession() {

        const db =
            await init();

        const result =
            await db.auth.getSession();

        if (result.error) {
            throw result.error;
        }

        return result.data.session || null;
    }


    /* =====================================================
       USER
       ===================================================== */

    async function getUser() {

        const db =
            await init();

        const result =
            await db.auth.getUser();

        if (result.error) {
            return null;
        }

        return result.data.user || null;
    }


    /* =====================================================
       PROFILE
       ===================================================== */

    async function getProfile(
        userId
    ) {

        const db =
            await init();

        const id =
            userId ||
            (
                currentUser
                    ? currentUser.id
                    : null
            );

        if (!id) {
            return null;
        }

        const result =
            await db
                .from("profiles")
                .select(
                    `
                    id,
                    full_name,
                    role,
                    avatar_url,
                    created_at,
                    updated_at
                    `
                )
                .eq(
                    "id",
                    id
                )
                .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        return result.data || null;
    }


    /* =====================================================
       CURRENT AUTH
       ===================================================== */

    async function getCurrentAuth() {

        const session =
            await getSession();

        if (!session) {

            currentUser = null;
            currentProfile = null;

            return {
                authenticated: false,
                user: null,
                profile: null,
                role: null
            };
        }

        currentUser =
            session.user || null;

        currentProfile =
            await getProfile(
                currentUser.id
            );

        return {
            authenticated: true,
            user: currentUser,
            profile: currentProfile,
            role:
                currentProfile
                    ? currentProfile.role
                    : null
        };
    }


    /* =====================================================
       LOGIN
       ===================================================== */

    async function signIn(
        email,
        password
    ) {

        const db =
            await init();

        email =
            String(
                email || ""
            ).trim();

        password =
            String(
                password || ""
            );

        if (!email) {
            throw new Error(
                "Email wajib diisi."
            );
        }

        if (!password) {
            throw new Error(
                "Password wajib diisi."
            );
        }

        const result =
            await db.auth.signInWithPassword({
                email,
                password
            });

        if (result.error) {
            throw result.error;
        }

        currentUser =
            result.data.user || null;

        if (!currentUser) {
            throw new Error(
                "User tidak ditemukan setelah login."
            );
        }

        currentProfile =
            await getProfile(
                currentUser.id
            );

        return {
            user: currentUser,
            profile: currentProfile,
            session:
                result.data.session || null
        };
    }


    /* =====================================================
       LOGOUT
       ===================================================== */

    async function signOut() {

        const db =
            await init();

        const result =
            await db.auth.signOut();

        if (result.error) {
            throw result.error;
        }

        currentUser = null;
        currentProfile = null;

        return true;
    }


    /* =====================================================
       ROLE
       ===================================================== */

    function isAdmin() {

        return !!(
            currentProfile &&
            currentProfile.role === "admin"
        );
    }


    function isEditor() {

        return !!(
            currentProfile &&
            currentProfile.role === "editor"
        );
    }


    function isStaff() {

        return (
            isAdmin() ||
            isEditor()
        );
    }


    function getRole() {

        return currentProfile
            ? currentProfile.role
            : null;
    }


    /* =====================================================
       AUTH GUARDS
       ===================================================== */

    async function requireAuth(
        options = {}
    ) {

        const auth =
            await getCurrentAuth();

        if (!auth.authenticated) {

            if (
                options.redirect !== false
            ) {

                window.location.href =
                    options.loginPage ||
                    "index.html";
            }

            return false;
        }

        return auth;
    }


    async function requireStaff(
        options = {}
    ) {

        const auth =
            await requireAuth(
                options
            );

        if (!auth) {
            return false;
        }

        if (
            auth.role !== "admin" &&
            auth.role !== "editor"
        ) {

            if (
                options.redirect !== false
            ) {

                window.location.href =
                    options.deniedPage ||
                    "index.html";
            }

            return false;
        }

        return auth;
    }


    async function requireAdmin(
        options = {}
    ) {

        const auth =
            await requireAuth(
                options
            );

        if (!auth) {
            return false;
        }

        if (
            auth.role !== "admin"
        ) {

            if (
                options.redirect !== false
            ) {

                window.location.href =
                    options.deniedPage ||
                    "dashboard.html";
            }

            return false;
        }

        return auth;
    }


    /* =====================================================
       PERMISSIONS
       ===================================================== */

    function canEditContent() {
        return isStaff();
    }

    function canCreateContent() {
        return isStaff();
    }

    function canDeleteContent() {
        return isAdmin();
    }

    function canPublishContent() {
        return isAdmin();
    }

    function canManageUsers() {
        return isAdmin();
    }

    function canManageRoles() {
        return isAdmin();
    }

    function canManageSettings() {
        return isAdmin();
    }


    /* =====================================================
       CONTENT STATUS
       ===================================================== */

    const STATUS =
        Object.freeze({

            DRAFT: "draft",

            REVIEW: "review",

            PUBLISHED: "published",

            ARCHIVED: "archived"

        });


    function canUseStatus(
        status
    ) {

        if (!isStaff()) {
            return false;
        }

        if (isAdmin()) {

            return [
                STATUS.DRAFT,
                STATUS.REVIEW,
                STATUS.PUBLISHED,
                STATUS.ARCHIVED
            ].includes(status);
        }

        return [
            STATUS.DRAFT,
            STATUS.REVIEW,
            STATUS.ARCHIVED
        ].includes(status);
    }


    /* =====================================================
       DATABASE
       ===================================================== */

    async function table(
        tableName
    ) {

        const db =
            await init();

        if (!tableName) {
            throw new Error(
                "Nama tabel wajib diberikan."
            );
        }

        return db.from(
            tableName
        );
    }


    /* =====================================================
       STORAGE
       ===================================================== */

    async function uploadMedia(
        file,
        folder = "general"
    ) {

        if (!isStaff()) {

            throw new Error(
                "Anda tidak memiliki izin upload."
            );
        }

        const db =
            await init();

        if (!file) {

            throw new Error(
                "File belum dipilih."
            );
        }

        const safeFolder =
            String(folder)
                .replace(
                    /[^a-zA-Z0-9/_-]/g,
                    ""
                );

        const filename =
            String(
                file.name ||
                "file"
            )
                .replace(
                    /[^a-zA-Z0-9._-]/g,
                    "-"
                );

        const path =
            (
                safeFolder ||
                "general"
            ) +
            "/" +
            Date.now() +
            "-" +
            filename;

        const result =
            await db
                .storage
                .from("mandala-media")
                .upload(
                    path,
                    file,
                    {
                        cacheControl:
                            "3600",
                        upsert:
                            false
                    }
                );

        if (result.error) {
            throw result.error;
        }

        return {
            path,
            url:
                db
                    .storage
                    .from("mandala-media")
                    .getPublicUrl(
                        path
                    )
                    .data
                    .publicUrl
        };
    }


    /* =====================================================
       AUTH STATE
       ===================================================== */

    async function onAuthStateChange(
        callback
    ) {

        const db =
            await init();

        return db.auth.onAuthStateChange(
            async function (
                event,
                session
            ) {

                currentUser =
                    session
                        ? session.user
                        : null;

                currentProfile = null;

                if (currentUser) {

                    try {

                        currentProfile =
                            await getProfile(
                                currentUser.id
                            );

                    } catch (error) {

                        console.error(
                            "Mandala profile error:",
                            error
                        );
                    }
                }

                if (
                    typeof callback ===
                    "function"
                ) {

                    callback({
                        event,
                        session,
                        user:
                            currentUser,
                        profile:
                            currentProfile
                    });
                }
            }
        );
    }


    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MandalaSupabase = {

        init,

        getClient,

        auth: {

            getSession,

            getUser,

            getCurrent:
                getCurrentAuth,

            signIn,

            signOut,

            onAuthStateChange,

            requireAuth,

            requireStaff,

            requireAdmin

        },

        profile: {

            get:
                getProfile

        },

        role: {

            isAdmin,

            isEditor,

            isStaff,

            current:
                getRole

        },

        permissions: {

            editContent:
                canEditContent,

            createContent:
                canCreateContent,

            deleteContent:
                canDeleteContent,

            publishContent:
                canPublishContent,

            manageUsers:
                canManageUsers,

            manageRoles:
                canManageRoles,

            manageSettings:
                canManageSettings

        },

        content: {

            status:
                STATUS,

            canUseStatus

        },

        db: {

            table

        },

        storage: {

            upload:
                uploadMedia

        },

        getCurrentUser:
            function () {
                return currentUser;
            },

        getCurrentProfile:
            function () {
                return currentProfile;
            },

        getCurrentRole:
            getRole

    };

})(window);
