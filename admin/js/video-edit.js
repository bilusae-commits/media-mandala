const CMS = window.MandalaCMS;

const form = document.getElementById("video-form");

const titleInput = document.getElementById("judul_video");

const CMS = window.MandalaCMS;


/* =====================================================
   ELEMENT
===================================================== */

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


let profile = null;
let currentVideo = null;
let slugEdited = false;


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "info"
) {

    if (!message) return;

    message.textContent = text;
    message.className =
        `form-message ${type}`;
}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
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
        .replace(/^-+|-+$/g, "");
}


titleInput?.addEventListener(
    "input",
    () => {

        if (!slugEdited) {

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

        slugEdited = true;
    }
);


/* =====================================================
   YOUTUBE
===================================================== */

function getYoutubeId(value) {

    const text =
        String(value || "").trim();

    if (!text) {
        return "";
    }


    if (
        /^[A-Za-z0-9_-]{11}$/.test(text)
    ) {

        return text;
    }


    const patterns = [

        /youtu\.be\/([A-Za-z0-9_-]{11})/i,

        /youtube\.com\/watch\?[^#]*v=([A-Za-z0-9_-]{11})/i,

        /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/i,

        /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/i,

        /youtube-nocookie\.com\/embed\/([A-Za-z0-9_-]{11})/i

    ];


    for (
        const pattern of patterns
    ) {

        const match =
            text.match(pattern);

        if (match) {

            return match[1];
        }
    }


    return "";
}


/* =====================================================
   YOUTUBE INPUT
===================================================== */

youtubeUrlInput?.addEventListener(
    "input",
    () => {

        const id =
            getYoutubeId(
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
);


/* =====================================================
   CATEGORIES
===================================================== */

async function loadCategories() {

    categoryInput.innerHTML = `
        <option value="">
            Memuat kategori...
        </option>
    `;


    try {

        const categories =
            await CMS.categories();


        if (
            !categories ||
            categories.length === 0
        ) {

            categoryInput.innerHTML = `
                <option value="">
                    -- Belum ada kategori --
                </option>
            `;

            return;
        }


        categoryInput.innerHTML = `
            <option value="">
                -- Pilih Kategori --
            </option>

            ${categories
                .map(category => `
                    <option
                        value="${escapeHtml(category.id)}"
                    >
                        ${escapeHtml(category.name)}
                    </option>
                `)
                .join("")}
        `;


        if (
            currentVideo?.category_id
        ) {

            categoryInput.value =
                currentVideo.category_id;
        }


    } catch (error) {

        console.error(
            "Category error:",
            error
        );


        categoryInput.innerHTML = `
            <option value="">
                -- Gagal memuat kategori --
            </option>
        `;

        showMessage(
            "Kategori gagal dimuat. Cek akses tabel categories.",
            "warning"
        );
    }
}


/* =====================================================
   LOAD VIDEO
===================================================== */

function getVideoIdFromUrl() {

    return new URLSearchParams(
        window.location.search
    ).get("id");
}


async function loadVideo(id) {

    showMessage(
        "Memuat video..."
    );


    const db =
        await CMS.ready();


    const result =
        await db
            .from("videos")
            .select("*")
            .eq("id", id)
            .maybeSingle();


    if (result.error) {
        throw result.error;
    }


    if (!result.data) {

        throw new Error(
            "Video tidak ditemukan."
        );
    }


    currentVideo =
        result.data;


    titleInput.value =
        currentVideo.title || "";

    slugInput.value =
        currentVideo.slug || "";

    youtubeUrlInput.value =
        currentVideo.youtube_url || "";

    youtubeIdInput.value =
        currentVideo.youtube_video_id || "";

    thumbnailInput.value =
        currentVideo.thumbnail_url || "";

    descriptionInput.value =
        currentVideo.description || "";

    featuredInput.checked =
        currentVideo.featured === true;

    statusInput.value =
        currentVideo.status || "draft";


    slugEdited = true;


    await loadCategories();


    updateButtons();


    showMessage(
        "Video berhasil dimuat.",
        "success"
    );
}


/* =====================================================
   PAYLOAD
===================================================== */

function getPayload() {

    const title =
        titleInput.value.trim();


    if (!title) {

        throw new Error(
            "Judul video wajib diisi."
        );
    }


    const youtubeUrl =
        youtubeUrlInput.value.trim();


    const videoId =
        getYoutubeId(
            youtubeUrl
        );


    if (!videoId) {

        throw new Error(
            "Masukkan URL YouTube yang valid."
        );
    }


    return {

        id:
            currentVideo?.id ||
            null,

        title,

        slug:
            slugInput.value.trim() ||
            makeSlug(title),

        youtube_url:
            youtubeUrl,

        youtube_video_id:
            videoId,

        thumbnail_url:
            thumbnailInput.value.trim() ||
            `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,

        description:
            descriptionInput.value.trim() ||
            null,

        category_id:
            categoryInput.value ||
            null,

        featured:
            featuredInput.checked === true,

        status:
            statusInput.value ||
            "draft"
    };
}


/* =====================================================
   SAVE
===================================================== */

async function saveVideo(
    status = "draft",
    publish = false
) {

    const payload =
        getPayload();


    payload.status =
        status;


    showMessage(
        "Menyimpan..."
    );


    const result =
        await CMS.saveVideo(
            payload,
            publish
        );


    currentVideo =
        result;


    /*
     * Update form dari database
     */

    titleInput.value =
        result.title || "";

    slugInput.value =
        result.slug || "";

    youtubeUrlInput.value =
        result.youtube_url || "";

    youtubeIdInput.value =
        result.youtube_video_id || "";

    thumbnailInput.value =
        result.thumbnail_url || "";

    descriptionInput.value =
        result.description || "";

    featuredInput.checked =
        result.featured === true;

    statusInput.value =
        result.status || "draft";


    /*
     * URL edit
     */

    if (result.id) {

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


    updateButtons();


    showMessage(
        "Video berhasil disimpan.",
        "success"
    );
}


/* =====================================================
   BUTTON STATE
===================================================== */

function updateButtons() {

    const status =
        currentVideo?.status ||
        statusInput.value ||
        "draft";


    const isAdmin =
        profile?.role === "admin";


    if (publishButton) {

        publishButton.style.display =
            isAdmin
                ? ""
                : "none";
    }


    if (
        status === "published"
    ) {

        if (draftButton)
            draftButton.style.display =
                "none";

        if (reviewButton)
            reviewButton.style.display =
                "none";

    } else {

        if (draftButton)
            draftButton.style.display =
                "";

        if (reviewButton)
            reviewButton.style.display =
                "";
    }


    if (archiveButton) {

        archiveButton.style.display =
            status === "archived"
                ? "none"
                : "";
    }
}


/* =====================================================
   SIMPAN
===================================================== */

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await saveVideo(
                "draft",
                false
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error?.message ||
                "Gagal menyimpan video.",
                "error"
            );
        }
    }
);


/* =====================================================
   SIMPAN DRAFT
===================================================== */

draftButton?.addEventListener(
    "click",
    async () => {

        try {

            await saveVideo(
                "draft",
                false
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error?.message ||
                "Gagal menyimpan draft.",
                "error"
            );
        }
    }
);


/* =====================================================
   REVIEW
===================================================== */

reviewButton?.addEventListener(
    "click",
    async () => {

        try {

            await saveVideo(
                "review",
                false
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error?.message ||
                "Gagal mengirim review.",
                "error"
            );
        }
    }
);


/* =====================================================
   PUBLISH
===================================================== */

publishButton?.addEventListener(
    "click",
    async () => {

        try {

            if (
                profile?.role !== "admin"
            ) {

                throw new Error(
                    "Hanya Admin yang dapat publish."
                );
            }


            await saveVideo(
                "published",
                true
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error?.message ||
                "Gagal publish video.",
                "error"
            );
        }
    }
);


/* =====================================================
   ARCHIVE
===================================================== */

archiveButton?.addEventListener(
    "click",
    async () => {

        try {

            await saveVideo(
                "archived",
                false
            );

        } catch (error) {

            console.error(error);

            showMessage(
                error?.message ||
                "Gagal mengarsipkan video.",
                "error"
            );
        }
    }
);


/* =====================================================
   LOGOUT
===================================================== */

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            await CMS.logout();

        } catch (error) {

            console.error(error);

            showMessage(
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

        profile =
            await CMS.currentProfile();


        if (!profile) {

            window.location.href =
                "index.html";

            return;
        }


        if (
            profile.role !== "admin" &&
            profile.role !== "editor"
        ) {

            window.location.href =
                "index.html";

            return;
        }


        const id =
            getVideoIdFromUrl();


        /*
         * Load kategori dulu
         */

        await loadCategories();


        /*
         * Kalau edit
         */

        if (id) {

            await loadVideo(id);

        } else {

            statusInput.value =
                "draft";

            updateButtons();

            showMessage(
                "Siap membuat video."
            );
        }


    } catch (error) {

        console.error(
            "VIDEO EDIT INIT ERROR:",
            error
        );

        showMessage(
            error?.message ||
            "Halaman video gagal dimuat.",
            "error"
        );
    }
}


init();
