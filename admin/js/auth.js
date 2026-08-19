import { supabase } from "../../js/supabase-client.js";


/* =====================================================
   GET CURRENT USER
===================================================== */

export async function getCurrentUser() {

    try {

        const {
            data,
            error
        } = await supabase.auth.getUser();

        if (error) {

            console.error(
                "Supabase getUser error:",
                error
            );

            return null;
        }

        if (!data?.user) {
            return null;
        }

        return data.user;

    } catch (error) {

        console.error(
            "getCurrentUser error:",
            error
        );

        return null;
    }

}


/* =====================================================
   GET CURRENT PROFILE
===================================================== */

export async function getCurrentProfile() {

    try {

        const user =
            await getCurrentUser();

        if (!user) {
            return null;
        }


        const {
            data,
            error
        } = await supabase
            .from("profiles")
            .select(`
                id,
                full_name,
                role,
                avatar_url
            `)
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


        if (error) {

            console.error(
                "Profile query error:",
                error
            );

            return null;
        }


        if (!data) {

            console.error(
                "Profile tidak ditemukan untuk user:",
                user.id
            );

            return null;
        }


        return {

            id:
                data.id,

            full_name:
                data.full_name ||
                user.email ||
                "Pengguna",

            /*
             * Role HARUS berasal dari database.
             *
             * Jangan fallback ke "editor".
             * User baru sekarang default = "user".
             */
            role:
                data.role,

            avatar_url:
                data.avatar_url ||
                null,

            email:
                user.email ||
                ""

        };


    } catch (error) {

        console.error(
            "getCurrentProfile error:",
            error
        );

        return null;
    }

}


/* =====================================================
   REQUIRE AUTHENTICATED USER
===================================================== */

export async function requireAuth() {

    const profile =
        await getCurrentProfile();


    if (!profile) {

        window.location.href =
            "./login.html";

        return null;
    }


    return profile;
}


/* =====================================================
   REQUIRE STAFF
   ADMIN + EDITOR
===================================================== */

export async function requireStaff() {

    const profile =
        await getCurrentProfile();


    if (!profile) {

        window.location.href =
            "./login.html";

        return null;
    }


    if (
        profile.role !== "admin" &&
        profile.role !== "editor"
    ) {

        window.location.href =
            "./index.html";

        return null;
    }


    return profile;
}


/* =====================================================
   REQUIRE ADMIN
===================================================== */

export async function requireAdmin() {

    const profile =
        await getCurrentProfile();


    if (!profile) {

        window.location.href =
            "./login.html";

        return null;
    }


    if (
        profile.role !== "admin"
    ) {

        window.location.href =
            "./index.html";

        return null;
    }


    return profile;
}


/* =====================================================
   LOGOUT
===================================================== */

export async function logout() {

    try {

        const {
            error
        } = await supabase.auth.signOut();


        if (error) {

            console.error(
                "Logout error:",
                error
            );

            throw error;
        }


        window.location.href =
            "./login.html";


    } catch (error) {

        console.error(
            "Logout error:",
            error
        );

        alert(
            "Gagal keluar. Silakan coba lagi."
        );

        throw error;
    }

}


/* =====================================================
   EXPORT SUPABASE
===================================================== */

export {
    supabase
};
