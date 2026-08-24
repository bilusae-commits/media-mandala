import "../../js/supabase-client.js?v=20260824.2";

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
