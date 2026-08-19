import { supabase } from "../../js/supabase-client.js";

const LOGIN_PAGE = "login.html";
const DASHBOARD_PAGE = "index.html";

export async function getCurrentUser() {
    const {
        data: { session },
        error
    } = await supabase.auth.getSession();

    if (error || !session?.user) {
        return null;
    }

    return session.user;
}

export async function getCurrentProfile() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url, created_at, updated_at")
        .eq("id", user.id)
        .single();

    if (error) {
        console.error("Profile error:", error);
        return null;
    }

    return {
        ...data,
        email: user.email
    };
}

export async function requireAuth() {
    const profile = await getCurrentProfile();

    if (!profile) {
        window.location.replace(LOGIN_PAGE);
        return null;
    }

    return profile;
}

export async function requireAdmin() {
    const profile = await requireAuth();

    if (!profile) {
        return null;
    }

    if (profile.role !== "admin") {
        window.location.replace(DASHBOARD_PAGE);
        return null;
    }

    return profile;
}

export async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error("Logout error:", error);
        alert("Gagal keluar. Silakan coba lagi.");
        return;
    }

    window.location.replace(LOGIN_PAGE);
}

export { supabase };
