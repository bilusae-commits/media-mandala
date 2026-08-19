import { supabase } from "../../js/supabase-client.js";

export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data?.user) {
        return null;
    }

    return data.user;
}

export async function getCurrentProfile() {
    const user = await getCurrentUser();

    if (!user) {
        return null;
    }

    const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, role, avatar_url")
        .eq("id", user.id)
        .maybeSingle();

    if (error) {
        console.error("Profile error:", error);
        return null;
    }

    if (!data) {
        console.error("Profile tidak ditemukan.");
        return null;
    }

    return {
        ...data,
        email: user.email
    };
}

export async function requireAuth() {
    const user = await getCurrentUser();

    if (!user) {
        window.location.href = "./login.html";
        return null;
    }

    return user;
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
    const { error } = await supabase.auth.signOut();

    if (error) {
        console.error(error);
        alert("Gagal keluar.");
        return;
    }

    window.location.href = "./login.html";
}

export { supabase };
