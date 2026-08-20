import "./cms-service.js";

const CMS = window.MandalaCMS;

const form = document.getElementById("video-form");

const titleInput = document.getElementById("judul_video");
const slugInput = document.getElementById("slug");
const youtubeUrlInput = document.getElementById("youtube_url");
const youtubeIdInput = document.getElementById("youtube_video_id");
const thumbnailInput = document.getElementById("thumbnail_url");
const descriptionInput = document.getElementById("deskripsi");
const categoryInput = document.getElementById("kategori");
const featuredInput = document.getElementById("is_featured");
const statusInput = document.getElementById("status");

const saveButton = document.getElementById("simpan");
const draftButton = document.getElementById("simpan_draft");
const reviewButton = document.getElementById("kirim_review");
const publishButton = document.getElementById("publish");
const archiveButton = document.getElementById("arsipkan");

const message = document.getElementById("form-message");

let profile = null;
let currentVideo = null;
let slugManuallyEdited = false;


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(text, type = "info") {

    if (!message) return;

    message.textContent = text;
    message.className = `form-message ${type}`;
}


/* =====================================================
   SLUG
===================================================== */

function slugify(text) {

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

        if (!slugManuallyEdited) {

            slugInput.value =
                slugify(titleInput.value);
        }
    }
);


slugInput?.addEventListener(
    "input",
    () => {

        slugManuallyEdited = true;
    }
);


/* =====================================================
   YOUTUBE ID
===================================================== */

function extractYoutubeId(url) {

    if (!url) return "";

    const value =
        String(url).trim();

    if (
        /^[A-Za-z0-9_-]{11}$/.test(value)
    ) {
        return value;
    }

    const patterns = [

        /youtu\.be\/([A-Za-z0-9_-]{11})/,

        /youtube\.com\/watch\?[^#]*v=([A-Za-z0-9_-]{11})/,

        /youtube\.com\/shorts\/([A-Za-z0-9_-]{11})/,

        /youtube\.com\/embed\/([A-Za-z0-9_-]{11})/

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


/* =====================================================
   AUTO YOUTUBE ID
===================================================== */

youtubeUrlInput?.addEventListener(
    "input",
    () => {

        const id =
            extractYoutubeId(
                youtubeUrlInput.value
            );

        youtubeIdInput.value = id;

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
   LOAD CATEGORIES
===================================================== */

async function loadCategories() {

    const categories =
        await CMS.categories();

    categoryInput.innerHTML = `
        <option value="">
            -- Pilih Kategori --
        </option>

        ${(categories || [])
            .map(category => `
                <option value="${category.id}">
                    ${escapeHtml(category.name)}
                </option>
            `)
            .join("")}
    `;
}


function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


/* =====================================================
   GET ID
===================================================== */

function getVideoId() {

    return new URLSearchParams(
        window.location.search
    ).get("id");
}


/* =====================================================
   LOAD VIDEO
===================================================== */

async function loadVideo(id) {

    showMessage(
        "Memuat video..."
    );

    currentVideo =
        await CMS.video(id);

    if (!currentVideo) {

        throw new Error(
            "Video tidak ditemukan."
        );
    }

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

    categoryInput.value =
        currentVideo.category_id || "";

    featuredInput.checked =
        currentVideo.featured === true;

    statusInput.value =
        currentVideo.status || "draft";

    slugManuallyEdited = true;

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

    const youtubeVideoId =
        youtubeIdInput.value.trim() ||
        extractYoutubeId(
            youtubeUrl
        );


    if (!youtubeVideoId) {

        throw new Error(
            "URL YouTube tidak valid."
        );
    }


    return {

        id:
            currentVideo?.id ||
            null,

        title,

        slug:
            slugInput.value.trim() ||
            slugify(title),

        youtube_url:
            youtubeUrl ||
            `https://www.youtube.com/watch?v=${youtubeVideoId}`,

        youtube_video_id:
            youtubeVideoId,

        thumbnail_url:
            thumbnailInput.value.trim() ||
            `https://i.ytimg.com/vi/${youtubeVideoId}/hqdefault.jpg`,

        description:
            descriptionInput.value.trim() ||
            null,

        category_id:
            categoryInput.value ||
            null,

        featured:
            featuredInput.checked === true,

        status:
            statusInput.value || "draft"
    };
}


/* =====================================================
   SAVE
===================================================== */

async function save(
    targetStatus = null,
    publish = false
) {

    const payload =
        getPayload();

    if (targetStatus) {

        payload.status =
            targetStatus;
    }


    if (
        payload.status === "published" &&
        profile?.role !== "admin"
    ) {

        throw new Error(
            "Hanya Admin yang dapat publish video."
        );
    }


    showMessage(
        "Menyimpan..."
    );


    /*
     * cms-service memakai:
     *
     * saveVideo(payload, publish)
     */

    const result =
        await CMS.saveVideo(
            payload,
            publish
        );


    currentVideo =
        result;


    /*
     * Isi kembali hasil database
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

    categoryInput.value =
        result.category_id || "";

    featuredInput.checked =
        result.featured === true;

    statusInput.value =
        result.status || "draft";


    /*
     * Jika baru dibuat,
     * masukkan ID ke URL.
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


    /*
     * Default
     */

    if (saveButton)
        saveButton.style.display = "";

    if (draftButton)
        draftButton.style.display = "";

    if (reviewButton)
        reviewButton.style.display = "";

    if (publishButton)
        publishButton.style.display =
            isAdmin ? "" : "none";

    if (archiveButton)
        archiveButton.style.display = "";


    /*
     * REVIEW
     */

    if (status === "review") {

        if (reviewButton)
            reviewButton.style.display = "none";
    }


    /*
     * PUBLISHED
     */

    if (status === "published") {

        if (reviewButton)
            reviewButton.style.display = "none";

        if (draftButton)
            draftButton.style.display = "none";

        if (publishButton)
            publishButton.style.display =
                isAdmin ? "" : "none";
    }
}


/* =====================================================
   FORM SUBMIT
===================================================== */

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await save();

        } catch (error) {

            console.error(
                "Save video error:",
                error
            );

            showMessage(
                error?.message ||
                "Gagal menyimpan video.",
                "error"
            );
        }
    }
);


/* =====================================================
   DRAFT
===================================================== */

draftButton?.addEventListener(
    "click",
    async () => {

        try {

            await save(
                "draft",
                false
            );

        } catch (error) {

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

            await save(
                "review",
                false
            );

        } catch (error) {

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
                    "Hanya Admin yang dapat publish video."
                );
            }

            await save(
                "published",
                true
            );

        } catch (error) {

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

            await save(
                "archived",
                false
            );

        } catch (error) {

            showMessage(
                error?.message ||
                "Gagal mengarsipkan video.",
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


        await loadCategories();


        const id =
            getVideoId();


        if (id) {

            await loadVideo(id);

        } else {

            statusInput.value =
                "draft";

            updateButtons();

            showMessage(
                "Siap membuat video baru."
            );
        }

    } catch (error) {

        console.error(
            "Video editor init error:",
            error
        );

        showMessage(
            error?.message ||
            "Gagal membuka editor video.",
            "error"
        );
    }
}


init();
