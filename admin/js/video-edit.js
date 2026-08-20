import { supabase } from "../../js/supabase-client.js";


const form = document.getElementById("video-form");

const titleInput = document.getElementById("judul_video");
const slugInput = document.getElementById("slug");

const youtubeUrlInput =
    document.getElementById("youtube_url");

const youtubeIdInput =
    document.getElementById("youtube_video_id");

const thumbnailInput =
    document.getElementById("thumbnail_url");

const descriptionInput =
    document.getElementById("deskripsi");

const categoryInput =
    document.getElementById("kategori");

const featuredInput =
    document.getElementById("is_featured");

const statusInput =
    document.getElementById("status");

const saveButton =
    document.getElementById("simpan");

const draftButton =
    document.getElementById("simpan_draft");

const reviewButton =
    document.getElementById("kirim_review");

const publishButton =
    document.getElementById("publish");

const archiveButton =
    document.getElementById("arsipkan");

const logoutButton =
    document.getElementById("logout");

const message =
    document.getElementById("form-message");


let currentVideo = null;
let profile = null;
let slugManual = false;


/* =====================================================
   MESSAGE
===================================================== */

function messageShow(text, type = "") {

    if (!message) return;

    message.textContent = text;
    message.className =
        `form-message ${type}`;
}


/* =====================================================
   SLUG
===================================================== */

function makeSlug(text) {

    return String(text || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}


titleInput?.addEventListener(
    "input",
    () => {

        if (!slugManual) {

            slugInput.value =
                makeSlug(
                    titleInput.value
                );
        }
    }
);


slugInput?.addEventListener(
    "input",
    () => {

        slugManual = true;
    }
);


/* =====================================================
   YOUTUBE ID
===================================================== */

function youtubeId(url) {

    const value =
        String(url || "").trim();

    if (!value) return "";


    if (
        /^[A-Za-z0-9_-]{11}$/.test(value)
    ) {

        return value;
    }


    const patterns = [

        /youtu\.be\/([A-Za-z0-9_-]{11})/i,

        /youtube\.com\/watch\?[^#]*v=([A-Za-z0-9_-]{11})/i,

        /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,

        /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i
    ];


    for (const pattern of patterns) {

        const match =
            value.match(pattern);

        if (match) {

            return match[1];
        }
    }


    return "";
}


function updateYoutube() {

    const id =
        youtubeId(
            youtubeUrlInput.value
        );


    youtubeIdInput.value =
        id;


    if (
        id &&
        !thumbnailInput.value.trim()
    ) {

        thumbnailInput.value =
            `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
    }
}


youtubeUrlInput?.addEventListener(
    "input",
    updateYoutube
);

youtubeUrlInput?.addEventListener(
    "change",
    updateYoutube
);


/* =====================================================
   CURRENT USER
===================================================== */

async function getCurrentUser() {

    const {
        data,
        error
    } =
        await supabase.auth.getUser();


    if (error) {
        throw error;
    }


    if (!data?.user) {

        throw new Error(
            "Sesi login tidak ditemukan."
        );
    }


    return data.user;
}


/* =====================================================
   PROFILE
===================================================== */

async function getProfile(userId) {

    const {
        data,
        error
    } =
        await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .maybeSingle();


    if (error) {
        throw error;
    }


    return data;
}


/* =====================================================
   CATEGORIES
===================================================== */

async function loadCategories() {

    categoryInput.innerHTML = `
        <option value="">
            Memuat kategori...
        </option>
    `;


    const {
        data,
        error
    } =
        await supabase
            .from("categories")
            .select("*")
            .order("name", {
                ascending: true
            });


    if (error) {

        console.error(
            "CATEGORY ERROR:",
            error
        );

        categoryInput.innerHTML = `
            <option value="">
                Kategori gagal dimuat
            </option>
        `;

        messageShow(
            `Kategori gagal dimuat: ${error.message}`,
            "error"
        );

        return;
    }


    categoryInput.innerHTML = `
        <option value="">
            -- Pilih Kategori --
        </option>
    `;


    for (
        const item of data || []
    ) {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            item.id;

        option.textContent =
            item.name;

        categoryInput.appendChild(
            option
        );
    }


    if (
        currentVideo?.category_id
    ) {

        categoryInput.value =
            currentVideo.category_id;
    }
}


/* =====================================================
   LOAD VIDEO
===================================================== */

async function loadVideo(id) {

    const {
        data,
        error
    } =
        await supabase
            .from("videos")
            .select("*")
            .eq("id", id)
            .maybeSingle();


    if (error) {
        throw error;
    }


    if (!data) {

        throw new Error(
            "Video tidak ditemukan."
        );
    }


    currentVideo =
        data;


    titleInput.value =
        data.title || "";

    slugInput.value =
        data.slug || "";

    youtubeUrlInput.value =
        data.youtube_url || "";

    youtubeIdInput.value =
        data.youtube_video_id ||
        youtubeId(
            data.youtube_url
        );

    thumbnailInput.value =
        data.thumbnail_url || "";

    descriptionInput.value =
        data.description || "";

    featuredInput.checked =
        data.featured === true;

    statusInput.value =
        data.status || "draft";

    slugManual = true;


    updateYoutube();


    await loadCategories();


    document.getElementById(
        "page-title"
    ).textContent =
        "Edit Video";


    messageShow(
        "Video berhasil dimuat.",
        "success"
    );
}


/* =====================================================
   PAYLOAD
===================================================== */

function payload(status) {

    const title =
        titleInput.value.trim();


    if (!title) {

        throw new Error(
            "Judul video wajib diisi."
        );
    }


    const url =
        youtubeUrlInput.value.trim();


    const id =
        youtubeId(url);


    if (!id) {

        throw new Error(
            "Masukkan URL YouTube yang valid."
        );
    }


    return {

        title,

        slug:
            slugInput.value.trim() ||
            makeSlug(title),

        youtube_url:
            url,

        youtube_video_id:
            id,

        thumbnail_url:
            thumbnailInput.value.trim() ||
            `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,

        description:
            descriptionInput.value.trim() ||
            null,

        category_id:
            categoryInput.value ||
            null,

        featured:
            featuredInput.checked,

        status,

        author_id:
            profile.id
    };
}


/* =====================================================
   SAVE
===================================================== */

async function saveVideo(status) {

    try {

        messageShow(
            "Menyimpan..."
        );


        const data =
            payload(status);


        let result;


        if (currentVideo?.id) {

            const response =
                await supabase
                    .from("videos")
                    .update(data)
                    .eq(
                        "id",
                        currentVideo.id
                    )
                    .select()
                    .single();


            if (response.error) {
                throw response.error;
            }


            result =
                response.data;

        } else {

            const response =
                await supabase
                    .from("videos")
                    .insert(data)
                    .select()
                    .single();


            if (response.error) {
                throw response.error;
            }


            result =
                response.data;
        }


        currentVideo =
            result;


        if (result?.id) {

            const url =
                new URL(
                    window.location.href
                );

            url.searchParams.set(
                "id",
                result.id
            );

            window.history.replaceState(
                {},
                "",
                url
            );
        }


        statusInput.value =
            result.status ||
            status;


        messageShow(
            "Video berhasil disimpan.",
            "success"
        );


    } catch (error) {

        console.error(
            "SAVE ERROR:",
            error
        );


        messageShow(
            error?.message ||
            "Gagal menyimpan video.",
            "error"
        );
    }
}


/* =====================================================
   BUTTONS
===================================================== */

form?.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        saveVideo("draft");
    }
);


draftButton?.addEventListener(
    "click",
    () => {

        saveVideo("draft");
    }
);


reviewButton?.addEventListener(
    "click",
    () => {

        saveVideo("review");
    }
);


publishButton?.addEventListener(
    "click",
    () => {

        if (
            profile?.role !== "admin"
        ) {

            messageShow(
                "Hanya Admin yang dapat publish.",
                "error"
            );

            return;
        }


        saveVideo("published");
    }
);


archiveButton?.addEventListener(
    "click",
    () => {

        saveVideo("archived");
    }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            const {
                error
            } =
                await supabase.auth.signOut();


            if (error) {
                throw error;
            }


            window.location.href =
                "index.html";


        } catch (error) {

            console.error(
                "LOGOUT ERROR:",
                error
            );


            messageShow(
                error?.message ||
                "Gagal keluar.",
                "error"
            );
        }
    }
);


/* =====================================================
   INIT
===================================================== */

async function init() {

    try {

        messageShow(
            "Memuat..."
        );


        const user =
            await getCurrentUser();


        profile =
            await getProfile(
                user.id
            );


        if (!profile) {

            throw new Error(
                "Profile tidak ditemukan."
            );
        }


        await loadCategories();


        const params =
            new URLSearchParams(
                window.location.search
            );


        const id =
            params.get("id");


        if (id) {

            await loadVideo(id);

        } else {

            statusInput.value =
                "draft";


            messageShow(
                "Siap membuat video."
            );
        }


    } catch (error) {

        console.error(
            "INIT ERROR:",
            error
        );


        messageShow(
            error?.message ||
            "Gagal memuat editor.",
            "error"
        );
    }
}


init();
