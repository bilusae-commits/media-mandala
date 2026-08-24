import { supabase } from "../../js/supabase-client.js";

/*
 * Compatibility auth helpers.
 * The CMS shell uses MandalaCMS from cms-service.js as the canonical
 * authentication/role gate. These exports remain for older admin pages
 * that still import auth.js, but they follow the same role rules.
 */

export async function getCurrentUser() {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return null;
        return data.user;
    } catch (error) {
        console.error("getCurrentUser error:", error);
        return null;
    }
}

export async function getCurrentProfile() {
    try {
        const user = await getCurrentUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from("profiles")
            .select("id,full_name,role,avatar_url")
            .eq("id", user.id)
            .maybeSingle();

        if (error || !data) return null;

        return {
            id: data.id,
            full_name: data.full_name || user.email || "Pengguna",
            role: data.role,
            avatar_url: data.avatar_url || null,
            email: user.email || ""
        };
    } catch (error) {
        console.error("getCurrentProfile error:", error);
        return null;
    }
}

export async function requireAuth() {
    const profile = await getCurrentProfile();
    if (!profile) {
        window.location.href = "./login.html";
        return null;
    }
    return profile;
}

export async function requireStaff() {
    const profile = await getCurrentProfile();
    if (!profile) {
        window.location.href = "./login.html";
        return null;
    }

    if (profile.role !== "admin" && profile.role !== "editor") {
        window.location.href = "./index.html";
        return null;
    }

    return profile;
}

export async function requireAdmin() {
    const profile = await getCurrentProfile();
    if (!profile) {
        window.location.href = "./login.html";
        return null;
    }

    if (profile.role !== "admin") {
        window.location.href = "./index.html";
        return null;
    }

    return profile;
}

export async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = "./login.html";
    } catch (error) {
        console.error("Logout error:", error);
        alert("Gagal keluar. Silakan coba lagi.");
        throw error;
    }
}

export { supabase };
