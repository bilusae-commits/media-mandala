/* =========================================================
   MANDALA CHANNEL
   SUPABASE CLIENT
   ---------------------------------------------------------
   File ini khusus untuk area Admin / Editor.

   Website publik tidak perlu memuat file ini.

   Tugas file:
   - Memuat Supabase client
   - Menyediakan koneksi database
   - Authentication
   - Mengambil profile user
   - Mengecek role Admin / Editor
   - Helper permission
   ========================================================= */

(function (window) {
    "use strict";

    /* =====================================================
       CONFIGURATION
       ===================================================== */

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

    /* =====================================================
       INTERNAL STATE
       ===================================================== */

    let supabaseClient = null;
    let supabaseLibraryPromise = null;

    let currentUser = null;
    let currentProfile = null;

    /* =====================================================
       VALIDATION
       ===================================================== */

    function validateConfig() {
        if (!SUPABASE_URL) {
            throw new Error(
                "MANDALA: SUPABASE_URL belum dikonfigurasi."
            );
        }

        if (!SUPABASE_KEY) {
            throw new Error(
                "MANDALA: Supabase publishable/anon key belum dikonfigurasi."
            );
        }
    }

    /* =====================================================
       LOAD SUPABASE LIBRARY
       -----------------------------------------------------
       Library hanya dimuat ketika CMS benar-benar
       membutuhkan Supabase.
       ===================================================== */

    async function loadSupabaseLibrary() {
        if (window.supabase && typeof window.supabase.createClient === "function") {
            return window.supabase;
        }

        if (supabaseLibraryPromise) {
            return supabaseLibraryPromise;
        }

        supabaseLibraryPromise = new Promise(function (resolve, reject) {
            const existingScript = document.querySelector(
                'script[data-mandala-supabase]'
            );

            if (existingScript) {
                existingScript.addEventListener("load", function () {
                    if (
                        window.supabase &&
                        typeof window.supabase.createClient === "function"
                    ) {
                        resolve(window.supabase);
                    } else {
                        reject(
                            new Error(
                                "Supabase library berhasil dimuat tetapi createClient tidak tersedia."
                            )
                        );
                    }
                });

                existingScript.addEventListener("error", function () {
                    reject(
                        new Error(
                            "Gagal memuat Supabase library."
                        )
                    );
                });

                return;
            }

            const script = document.createElement("script");

            script.src =
                "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

            script.async = true;
            script.dataset.mandalaSupabase = "true";

            script.onload = function () {
                if (
                    window.supabase &&
                    typeof window.supabase.createClient === "function"
                ) {
                    resolve(window.supabase);
                } else {
                    reject(
                        new Error(
                            "Supabase library berhasil dimuat tetapi createClient tidak tersedia."
                        )
                    );
                }
            };

            script.onerror = function () {
                reject(
                    new Error(
                        "Tidak dapat memuat Supabase. Pastikan koneksi internet tersedia pada area Admin/Editor."
                    )
                );
            };

            document.head.appendChild(script);
        });

        return supabaseLibraryPromise;
    }

    /* =====================================================
       INITIALIZE CLIENT
       ===================================================== */

    async function initSupabase() {
        if (supabaseClient) {
            return supabaseClient;
        }

        validateConfig();

        const supabase = await loadSupabaseLibrary();

        supabaseClient = supabase.createClient(
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

        return supabaseClient;
    }

    /* =====================================================
       GET CLIENT
       ===================================================== */

    async function getClient() {
        return initSupabase();
    }

    /* =====================================================
       AUTH
       ===================================================== */

    async function getSession() {
        const client = await initSupabase();

        const result = await client.auth.getSession();

        if (result.error) {
            throw result.error;
        }

        return result.data.session || null;
    }

    async function getUser() {
        const client = await initSupabase();

        const result = await client.auth.getUser();

        if (result.error) {
            return null;
        }

        return result.data.user || null;
    }

    /* =====================================================
       LOGIN
       ===================================================== */

    async function signIn(email, password) {
        const client = await initSupabase();

        const cleanEmail = String(email || "").trim();
        const cleanPassword = String(password || "");

        if (!cleanEmail) {
            throw new Error("Email wajib diisi.");
        }

        if (!cleanPassword) {
            throw new Error("Password wajib diisi.");
        }

        const result = await client.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanPassword
        });

        if (result.error) {
            throw result.error;
        }

        currentUser = result.data.user || null;

        if (!currentUser) {
            throw new Error(
                "Login gagal: user tidak ditemukan."
            );
        }

        currentProfile = await getProfile(
            currentUser.id
        );

        return {
            user: currentUser,
            profile: currentProfile,
            session: result.data.session || null
        };
    }

    /* =====================================================
       LOGOUT
       ===================================================== */

    async function signOut() {
        const client = await initSupabase();

        const result = await client.auth.signOut();

        if (result.error) {
            throw result.error;
        }

        currentUser = null;
        currentProfile = null;

        return true;
    }

    /* =====================================================
       PROFILE
       ===================================================== */

    async function getProfile(userId) {
        const client = await initSupabase();

        const id = userId || (
            currentUser ? currentUser.id : null
        );

        if (!id) {
            return null;
        }

        const result = await client
            .from("profiles")
            .select(
                "id, display_name, avatar_url, role, created_at, updated_at"
            )
            .eq("id", id)
            .maybeSingle();

        if (result.error) {
            throw result.error;
        }

        return result.data || null;
    }

    /* =====================================================
       CURRENT AUTH STATE
       ===================================================== */

    async function getCurrentAuth() {
        const session = await getSession();

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

        currentUser = session.user || null;

        currentProfile = await getProfile(
            currentUser.id
        );

        return {
            authenticated: true,
            user: currentUser,
            profile: currentProfile,
            role: currentProfile
                ? currentProfile.role
                : null
        };
    }

    /* =====================================================
       REQUIRE LOGIN
       -----------------------------------------------------
       Digunakan halaman CMS yang membutuhkan user login.
       ===================================================== */

    async function requireAuth(options) {
        const settings = options || {};

        const redirect =
            settings.redirect !== false;

        const auth = await getCurrentAuth();

        if (!auth.authenticated) {
            if (redirect) {
                const target =
                    settings.loginPage ||
                    "index.html";

                window.location.href = target;
            }

            return false;
        }

        return auth;
    }

    /* =====================================================
       REQUIRE STAFF
       -----------------------------------------------------
       Admin + Editor
       ===================================================== */

    async function requireStaff(options) {
        const settings = options || {};

        const auth = await requireAuth({
            redirect: settings.redirect,
            loginPage: settings.loginPage
        });

        if (!auth || auth === false) {
            return false;
        }

        const role = auth.role;

        if (
            role !== "admin" &&
            role !== "editor"
        ) {
            if (settings.redirect !== false) {
                window.location.href =
                    settings.deniedPage ||
                    "index.html";
            }

            return false;
        }

        return auth;
    }

    /* =====================================================
       REQUIRE ADMIN
       ===================================================== */

    async function requireAdmin(options) {
        const settings = options || {};

        const auth = await requireAuth({
            redirect: settings.redirect,
            loginPage: settings.loginPage
        });

        if (!auth || auth === false) {
            return false;
        }

        if (auth.role !== "admin") {
            if (settings.redirect !== false) {
                window.location.href =
                    settings.deniedPage ||
                    "index.html";
            }

            return false;
        }

        return auth;
    }

    /* =====================================================
       ROLE HELPERS
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

    /* =====================================================
       PERMISSION HELPERS
       ===================================================== */

    function canManageUsers() {
        return isAdmin();
    }

    function canManageRoles() {
        return isAdmin();
    }

    function canManageSettings() {
        return isAdmin();
    }

    function canDeleteContent() {
        return isAdmin();
    }

    function canPublishContent() {
        return isAdmin();
    }

    function canEditContent() {
        return isStaff();
    }

    function canCreateContent() {
        return isStaff();
    }

    function canReviewContent() {
        return isAdmin();
    }

    /* =====================================================
       CONTENT STATUS
       ===================================================== */

    const CONTENT_STATUS = Object.freeze({
        DRAFT: "draft",
        REVIEW: "review",
        PUBLISHED: "published",
        ARCHIVED: "archived"
    });

    function canChangeStatus(status) {
        if (!isStaff()) {
            return false;
        }

        if (isAdmin()) {
            return [
                CONTENT_STATUS.DRAFT,
                CONTENT_STATUS.REVIEW,
                CONTENT_STATUS.PUBLISHED,
                CONTENT_STATUS.ARCHIVED
            ].includes(status);
        }

        return [
            CONTENT_STATUS.DRAFT,
            CONTENT_STATUS.REVIEW
        ].includes(status);
    }

    /* =====================================================
       DATABASE HELPER
       ===================================================== */

    async function query(table) {
        const client = await initSupabase();

        if (!table) {
            throw new Error(
                "Nama table wajib diberikan."
            );
        }

        return client.from(table);
    }

    /* =====================================================
       STORAGE HELPER
       ===================================================== */

    async function uploadMedia(
        file,
        folder
    ) {
        const client = await initSupabase();

        if (!file) {
            throw new Error(
                "File wajib diberikan."
            );
        }

        if (!isStaff()) {
            throw new Error(
                "Anda tidak memiliki izin untuk mengunggah media."
            );
        }

        const safeFolder =
            String(folder || "general")
                .replace(/[^a-zA-Z0-9/_-]/g, "");

        const originalName =
            String(file.name || "file")
                .replace(/[^a-zA-Z0-9._-]/g, "-");

        const timestamp =
            Date.now();

        const filePath =
            safeFolder +
            "/" +
            timestamp +
            "-" +
            originalName;

        const result = await client
            .storage
            .from("mandala-media")
            .upload(
                filePath,
                file,
                {
                    cacheControl: "3600",
                    upsert: false
                }
            );

        if (result.error) {
            throw result.error;
        }

        const publicResult =
            client
                .storage
                .from("mandala-media")
                .getPublicUrl(filePath);

        return {
            path: filePath,
            url: publicResult.data.publicUrl
        };
    }

    /* =====================================================
       AUTH STATE LISTENER
       ===================================================== */

    async function onAuthStateChange(callback) {
        const client = await initSupabase();

        return client.auth.onAuthStateChange(
            async function (event, session) {
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
                        event: event,
                        session: session,
                        user: currentUser,
                        profile: currentProfile
                    });
                }
            }
        );
    }

    /* =====================================================
       GETTERS
       ===================================================== */

    function getCurrentUser() {
        return currentUser;
    }

    function getCurrentProfile() {
        return currentProfile;
    }

    function getCurrentRole() {
        return currentProfile
            ? currentProfile.role
            : null;
    }

    /* =====================================================
       PUBLIC API
       ===================================================== */

    window.MandalaSupabase = {
        init: initSupabase,
        getClient: getClient,

        auth: {
            getSession: getSession,
            getUser: getUser,
            getCurrent: getCurrentAuth,
            signIn: signIn,
            signOut: signOut,
            onAuthStateChange: onAuthStateChange,
            requireAuth: requireAuth,
            requireStaff: requireStaff,
            requireAdmin: requireAdmin
        },

        profile: {
            get: getProfile,
            current: getCurrentProfile
        },

        role: {
            isAdmin: isAdmin,
            isEditor: isEditor,
            isStaff: isStaff,
            current: getCurrentRole
        },

        permissions: {
            manageUsers: canManageUsers,
            manageRoles: canManageRoles,
            manageSettings: canManageSettings,
            deleteContent: canDeleteContent,
            publishContent: canPublishContent,
            editContent: canEditContent,
            createContent: canCreateContent,
            reviewContent: canReviewContent,
            changeStatus: canChangeStatus
        },

        content: {
            status: CONTENT_STATUS
        },

        db: {
            query: query
        },

        storage: {
            upload: uploadMedia
        },

        getCurrentUser: getCurrentUser,
        getCurrentProfile: getCurrentProfile,
        getCurrentRole: getCurrentRole
    };

})(window);
