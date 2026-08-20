const API = window.MandalaSupabase;

if (!API) {
    throw new Error(
        "MandalaSupabase belum dimuat."
    );
}

const supabase =
    await API.getClient();


/* =====================================================
   AUTH
===================================================== */

export async function getCurrentUser() {

    return await API.auth.getUser();
}


export async function getCurrentAuth() {

    return await API.auth.getCurrent();
}


export async function logout() {

    await API.auth.signOut();

    window.location.href =
        "../index.html";
}


/* =====================================================
   TABLE
===================================================== */

export async function getTable(
    tableName
) {

    return await API.db.table(
        tableName
    );
}


/* =====================================================
   VIDEOS
===================================================== */

export async function getVideos() {

    const {
        data,
        error
    } =
        await supabase
            .from("videos")
            .select("*")
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {
        throw error;
    }


    return data || [];
}


export async function getVideo(
    id
) {

    const {
        data,
        error
    } =
        await supabase
            .from("videos")
            .select("*")
            .eq(
                "id",
                id
            )
            .maybeSingle();


    if (error) {
        throw error;
    }


    return data;
}


export async function createVideo(
    payload
) {

    const {
        data,
        error
    } =
        await supabase
            .from("videos")
            .insert(payload)
            .select()
            .single();


    if (error) {
        throw error;
    }


    return data;
}


export async function updateVideo(
    id,
    payload
) {

    const {
        data,
        error
    } =
        await supabase
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


export async function deleteVideo(
    id
) {

    const {
        error
    } =
        await supabase
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
   CATEGORIES
===================================================== */

export async function getCategories() {

    const {
        data,
        error
    } =
        await supabase
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
   GENERIC
===================================================== */

export async function select(
    tableName,
    columns = "*"
) {

    const {
        data,
        error
    } =
        await supabase
            .from(tableName)
            .select(columns);


    if (error) {
        throw error;
    }


    return data || [];
}


export async function insert(
    tableName,
    payload
) {

    const {
        data,
        error
    } =
        await supabase
            .from(tableName)
            .insert(payload)
            .select();


    if (error) {
        throw error;
    }


    return data;
}


export async function update(
    tableName,
    id,
    payload
) {

    const {
        data,
        error
    } =
        await supabase
            .from(tableName)
            .update(payload)
            .eq(
                "id",
                id
            )
            .select();


    if (error) {
        throw error;
    }


    return data;
}


export async function remove(
    tableName,
    id
) {

    const {
        error
    } =
        await supabase
            .from(tableName)
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
