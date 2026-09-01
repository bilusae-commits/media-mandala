/*
 * Mandala CMS compatibility auth helpers.
 * IMPORTANT: do not import ../../js/supabase-client.js here.
 * Admin pages load that client as a classic script. Importing the same file
 * as an ES module would execute a second client instance and can trigger
 * Supabase's "Multiple GoTrueClient instances" warning.
 */

function api(){
    const value=window.MandalaSupabase;
    if(!value)throw new Error("MandalaSupabase belum dimuat. Pastikan supabase-client.js dimuat lebih dulu.");
    return value;
}

export async function getCurrentUser(){
    try{
        return await api().auth.getUser();
    }catch(error){
        console.error("getCurrentUser error:",error);
        return null;
    }
}

export async function getCurrentProfile(){
    try{
        const user=await getCurrentUser();
        if(!user)return null;
        const profile=await api().profile.get(user.id);
        if(!profile)return null;
        return {
            id:profile.id,
            full_name:profile.full_name||user.email||"Pengguna",
            role:profile.role,
            avatar_url:profile.avatar_url||null,
            email:user.email||""
        };
    }catch(error){
        console.error("getCurrentProfile error:",error);
        return null;
    }
}

export async function requireAuth(){
    const profile=await getCurrentProfile();
    if(!profile){window.location.href="./login.html";return null;}
    return profile;
}

export async function requireStaff(){
    const profile=await getCurrentProfile();
    if(!profile){window.location.href="./login.html";return null;}
    if(profile.role!=="admin"&&profile.role!=="editor"){
        window.location.href="./index.html";
        return null;
    }
    return profile;
}

export async function requireAdmin(){
    const profile=await getCurrentProfile();
    if(!profile){window.location.href="./login.html";return null;}
    if(profile.role!=="admin"){
        window.location.href="./index.html";
        return null;
    }
    return profile;
}

export async function logout(){
    try{
        await api().auth.signOut();
        window.location.href="./login.html";
    }catch(error){
        console.error("Logout error:",error);
        alert("Gagal keluar. Silakan coba lagi.");
        throw error;
    }
}

/* Compatibility facade for older imports. It delegates to the one global
   MandalaSupabase client instead of creating another GoTrueClient. */
export const supabase={
    auth:{
        getUser:()=>api().auth.getUser(),
        getSession:()=>api().auth.getSession(),
        signOut:()=>api().auth.signOut()
    },
    from:(...args)=>{
        throw new Error("Gunakan MandalaSupabase.getClient() untuk operasi database.");
    }
};
