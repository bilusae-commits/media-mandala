import {
    requireStaff,
    currentUser,
    videos,
    createVideo,
    updateVideo,
    logout
} from "./cms-service.js";

import {
    supabase
} from "./cms-service.js";


/* =====================================================
   ELEMENTS
===================================================== */

const form =
    document.getElementById(
        "video-form"
    );


const pageTitle =
    document.getElementById(
        "page-title"
    );


const videoIdInput =
    document.getElementById(
        "video-id"
    );


const titleInput =
    document.getElementById(
        "title"
    );


const slugInput =
    document.getElementById(
        "slug"
    );


const youtubeUrlInput =
    document.getElementById(
        "youtube_url"
    );


const youtubeVideoIdInput =
    document.getElementById(
        "youtube_video_id"
    );


const thumbnailInput =
    document.getElementById(
        "thumbnail_url"
    );


const thumbnailPreview =
    document.getElementById(
        "thumbnail-preview"
    );


const descriptionInput =
    document.getElementById(
        "description"
    );


const categoryInput =
    document.getElementById(
        "category_id"
    );


const featuredInput =
    document.getElementById(
        "featured"
    );


const statusInput =
    document.getElementById(
        "status"
    );


const statusHelp =
    document.getElementById(
        "status-help"
    );


const formMessage =
    document.getElementById(
        "form-message"
    );


const saveButton =
    document.getElementById(
        "save-button"
    );


const saveDraftButton =
    document.getElementById(
        "save-draft-button"
    );


const submitReviewButton =
    document.getElementById(
        "submit-review-button"
    );


const publishButton =
    document.getElementById(
        "publish-button"
    );


const archiveButton =
    document.getElementById(
        "archive-button"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );


const publishedOption =
    document.getElementById(
        "published-option"
    );


/* =====================================================
   STATE
===================================================== */

let profile = null;

let currentVideo = null;

let slugManuallyEdited = false;


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "info"
) {

    if (!formMessage) {
        return;
    }


    formMessage.textContent =
        text;


    formMessage.dataset.type =
        type;
}


/* =====================================================
   ESCAPE
===================================================== */

function escapeHtml(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";
    }


    return String(value)
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );
}


/* =====================================================
   SLUGIFY
===================================================== */

function slugify(text) {

    return String(text || "")
        .toLowerCase()
        .trim()
        .normalize("NFD")
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /[^a-z0-9\s-]/g,
            ""
        )
        .replace(
            /\s+/g,
            "-"
        )
        .replace(
            /-+/g,
            "-"
        )
        .replace(
            /^-|-$/g,
            ""
        );
}


/* =====================================================
   TITLE → SLUG
===================================================== */

titleInput?.addEventListener(
    "input",
    () => {

        if (
            !slugManuallyEdited
        ) {

            slugInput.value =
                slugify(
                    titleInput.value
                );

        }

    }
);


slugInput?.addEventListener(
    "input",
    () => {

        slugManuallyEdited =
            true;

    }
);


/* =====================================================
   EXTRACT YOUTUBE ID
===================================================== */

function extractYoutubeId(
    url
) {

    if (!url) {
        return null;
    }


    try {

        const parsed =
            new URL(url);


        /*
         * youtube.com/watch?v=ID
         */

        if (
            parsed.hostname
                .includes(
                    "youtube.com"
                )
        ) {

            const id =
                parsed.searchParams.get(
                    "v"
                );


            if (id) {
                return id;
            }


            /*
             * youtube.com/embed/ID
             */

            const embedMatch =
                parsed.pathname.match(
                    /\/embed\/([^/]+)/
                );


            if (
                embedMatch?.[1]
            ) {

                return embedMatch[1];

            }


            /*
             * youtube.com/shorts/ID
             */

            const shortsMatch =
                parsed.pathname.match(
                    /\/shorts\/([^/]+)/
                );


            if (
                shortsMatch?.[1]
            ) {

                return shortsMatch[1];

            }

        }


        /*
         * youtu.be/ID
         */

        if (
            parsed.hostname ===
            "youtu.be"
        ) {

            const id =
                parsed.pathname
                    .replace(
                        /^\//,
                        ""
                    );


            if (id) {
                return id;
            }

        }


    } catch {

        return null;

    }


    return null;
}


/* =====================================================
   YOUTUBE URL CHANGE
===================================================== */

youtubeUrlInput?.addEventListener(
    "input",
    () => {

        const id =
            extractYoutubeId(
                youtubeUrlInput.value.trim()
            );


        if (id) {

            youtubeVideoIdInput.value =
                id;


            updateThumbnailPreview(
                id
            );

        }

    }
);


/* =====================================================
   THUMBNAIL PREVIEW
===================================================== */

function updateThumbnailPreview(
    youtubeId
) {

    if (!thumbnailPreview) {
        return;
    }


    if (!youtubeId) {

        thumbnailPreview.innerHTML =
            "";

        return;
    }


    /*
     * Jika thumbnail manual
     * sudah diberikan, jangan
     * menimpanya.
     */

    if (
        thumbnailInput.value.trim()
    ) {

        thumbnailPreview.innerHTML = `

            <img
                src="${escapeHtml(
                    thumbnailInput.value.trim()
                )}"
                alt="Thumbnail"
                width="320"
                loading="lazy"
            >

        `;


        return;
    }


    /*
     * Default YouTube thumbnail.
     */

    const thumbnail =
        `https://img.youtube.com/vi/${encodeURIComponent(
            youtubeId
        )}/hqdefault.jpg`;


    thumbnailPreview.innerHTML = `

        <img
            src="${thumbnail}"
            alt="Thumbnail YouTube"
            width="320"
            loading="lazy"
        >

    `;

}


/* =====================================================
   MANUAL THUMBNAIL
===================================================== */

thumbnailInput?.addEventListener(
    "input",
    () => {

        if (
            thumbnailInput.value.trim()
        ) {

            thumbnailPreview.innerHTML = `

                <img
                    src="${escapeHtml(
                        thumbnailInput.value.trim()
                    )}"
                    alt="Thumbnail"
                    width="320"
                    loading="lazy"
                >

            `;

        } else {

            updateThumbnailPreview(
                youtubeVideoIdInput.value
            );

        }

    }
);


/* =====================================================
   LOAD CATEGORIES
===================================================== */

async function loadCategories() {

    const {
        data,
        error
    } = await supabase
        .from("categories")
        .select(
            "id,name,is_active"
        )
        .eq(
            "is_active",
            true
        )
        .order(
            "name",
            {
                ascending: true
            }
        );


    if (error) {
        throw error;
    }


    categoryInput.innerHTML = `

        <option value="">
            -- Pilih Kategori --
        </option>

        ${
            (data || [])
                .map(
                    category => `
                        <option
                            value="${category.id}"
                        >
                            ${escapeHtml(
                                category.name
                            )}
                        </option>
                    `
                )
                .join("")
        }

    `;
}


/* =====================================================
   GET ID
===================================================== */

function getVideoId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(
        "id"
    );
}


/* =====================================================
   LOAD VIDEO
===================================================== */

async function loadVideo(
    id
) {

    showMessage(
        "Memuat video..."
    );


    const {
        data,
        error
    } = await supabase
        .from("videos")
        .select(`
            id,
            title,
            slug,
            youtube_url,
            youtube_video_id,
            thumbnail_url,
            description,
            category_id,
            status,
            featured,
            published_at,
            created_at,
            updated_at,
            author_id
        `)
        .eq(
            "id",
            id
        )
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


    videoIdInput.value =
        data.id;


    titleInput.value =
        data.title || "";


    slugInput.value =
        data.slug || "";


    slugManuallyEdited =
        true;


    youtubeUrlInput.value =
        data.youtube_url || "";


    youtubeVideoIdInput.value =
        data.youtube_video_id || "";


    thumbnailInput.value =
        data.thumbnail_url || "";


    descriptionInput.value =
        data.description || "";


    categoryInput.value =
        data.category_id || "";


    featuredInput.checked =
        Boolean(
            data.featured
        );


    statusInput.value =
        data.status ||
        "draft";


    pageTitle.textContent =
        "Edit Video";


    updateThumbnailPreview(
        data.youtube_video_id
    );


    updateStatusUI();


    updateActionButtons();


    /*
     * Jika Editor membuka
     * video published, field
     * harus terkunci.
     */

    if (
        profile?.role === "editor" &&
        data.status === "published"
    ) {

        disableEditor();

    }


    showMessage(
        "Video berhasil dimuat."
    );

}


/* =====================================================
   DISABLE EDITOR
===================================================== */

function disableEditor() {

    const fields = [

        titleInput,

        slugInput,

        youtubeUrlInput,

        youtubeVideoIdInput,

        thumbnailInput,

        descriptionInput,

        categoryInput,

        featuredInput,

        statusInput

    ];


    fields.forEach(
        field => {

            if (field) {
                field.disabled =
                    true;
            }

        }
    );


    saveButton.disabled =
        true;


    saveDraftButton.disabled =
        true;


    submitReviewButton.disabled =
        true;


    publishButton.disabled =
        true;


    archiveButton.disabled =
        true;


    showMessage(
        "Video sudah published. Editor tidak dapat mengubahnya.",
        "warning"
    );

}


/* =====================================================
   GET FORM DATA
===================================================== */

function getFormData() {

    const title =
        titleInput.value.trim();


    const youtubeUrl =
        youtubeUrlInput.value.trim();


    if (!title) {

        throw new Error(
            "Judul video wajib diisi."
        );

    }


    if (!youtubeUrl) {

        throw new Error(
            "YouTube URL wajib diisi."
        );

    }


    const youtubeId =
        extractYoutubeId(
            youtubeUrl
        );


    if (!youtubeId) {

        throw new Error(
            "URL YouTube tidak valid."
        );

    }


    return {

        title,

        slug:
            slugInput.value.trim() ||
            slugify(title),

        youtube_url:
            youtubeUrl,

        youtube_video_id:
            youtubeId,

        thumbnail_url:
            thumbnailInput.value.trim() ||
            `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`,

        description:
            descriptionInput.value.trim() ||
            null,

        category_id:
            categoryInput.value ||
            null,

        featured:
            Boolean(
                featuredInput.checked
            )

    };

}


/* =====================================================
   SAVE
===================================================== */

async function save(
    targetStatus = null
) {

    try {

        const payload =
            getFormData();


        /*
         * Role protection
         */

        if (
            targetStatus ===
                "published" &&
            profile?.role !==
                "admin"
        ) {

            throw new Error(
                "Editor tidak dapat publish video."
            );

        }


        /*
         * Author
         */

        if (
            !currentVideo
        ) {

            const user =
                await currentUser();


            if (!user) {

                throw new Error(
                    "User tidak ditemukan."
                );

            }


            payload.author_id =
                user.id;

        }


        /*
         * Status
         */

        if (
            targetStatus
        ) {

            payload.status =
                targetStatus;

        } else if (
            currentVideo
        ) {

            payload.status =
                currentVideo.status;

        } else {

            payload.status =
                "draft";

        }


        /*
         * Published At
         */

        if (
            payload.status ===
            "published"
        ) {

            if (
                !currentVideo?.published_at
            ) {

                payload.published_at =
                    new Date().toISOString();

            }

        } else {

            payload.published_at =
                null;

        }


        showMessage(
            "Menyimpan..."
        );


        let result;


        if (
            currentVideo
        ) {

            const {
                data,
                error
            } = await supabase
                .from("videos")
                .update(
                    payload
                )
                .eq(
                    "id",
                    currentVideo.id
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            result =
                data;

        } else {

            const {
                data,
                error
            } = await supabase
                .from("videos")
                .insert(
                    payload
                )
                .select()
                .single();


            if (error) {
                throw error;
            }


            result =
                data;

        }


        currentVideo =
            result;


        videoIdInput.value =
            result.id;


        pageTitle.textContent =
            "Edit Video";


        window.history.replaceState(
            {},
            "",
            `video-edit.html?id=${encodeURIComponent(
                result.id
            )}`
        );


        updateActionButtons();


        updateStatusUI();


        showMessage(
            "Video berhasil disimpan.",
            "success"
        );


        return result;


    } catch (error) {

        console.error(
            "Save video error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal menyimpan video.",
            "error"
        );


        throw error;
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

        } catch {
            // Sudah ditampilkan.
        }

    }
);


/* =====================================================
   SAVE DRAFT
===================================================== */

saveDraftButton?.addEventListener(
    "click",
    async () => {

        try {

            await save(
                "draft"
            );

        } catch {
            // Sudah ditampilkan.
        }

    }
);


/* =====================================================
   REVIEW
===================================================== */

submitReviewButton?.addEventListener(
    "click",
    async () => {

        try {

            await save(
                "review"
            );

        } catch {
            // Sudah ditampilkan.
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
                profile?.role !==
                "admin"
            ) {

                throw new Error(
                    "Hanya Admin yang dapat publish video."
                );

            }


            await save(
                "published"
            );

        } catch {
            // Sudah ditampilkan.
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
                "archived"
            );

        } catch {
            // Sudah ditampilkan.
        }

    }
);


/* =====================================================
   STATUS UI
===================================================== */

function updateStatusUI() {

    if (
        profile?.role ===
        "editor"
    ) {

        publishedOption.disabled =
            true;


        publishButton.style.display =
            "none";


        statusHelp.textContent =
            "Editor tidak memiliki hak untuk publish video.";

    } else {

        publishedOption.disabled =
            false;


        publishButton.style.display =
            "";


        statusHelp.textContent =
            "Admin dapat mempublish video.";

    }


    if (
        currentVideo?.status ===
        "published" &&
        profile?.role ===
        "editor"
    ) {

        disableEditor();

    }

}


/* =====================================================
   BUTTON UI
===================================================== */

function updateActionButtons() {

    const role =
        profile?.role;


    const status =
        currentVideo?.status ||
        "draft";


    saveButton.style.display =
        "";


    saveDraftButton.style.display =
        "";


    submitReviewButton.style.display =
        "";


    archiveButton.style.display =
        "";


    publishButton.style.display =
        role === "admin"
            ? ""
            : "none";


    /*
     * Review
     */

    if (
        status === "review"
    ) {

        submitReviewButton.style.display =
            "none";

    }


    /*
     * Published
     */

    if (
        status === "published"
    ) {

        if (
            role === "editor"
        ) {

            saveButton.style.display =
                "none";


            saveDraftButton.style.display =
                "none";


            submitReviewButton.style.display =
                "none";


            archiveButton.style.display =
                "none";

        }

    }

}


/* =====================================================
   LOGOUT
===================================================== */

logoutButton?.addEventListener(
    "click",
    async () => {

        try {

            await logout();

        } catch (error) {

            console.error(
                "Logout error:",
                error
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
            await requireStaff();


        if (!profile) {
            return;
        }


        await loadCategories();


        const id =
            getVideoId();


        if (id) {

            await loadVideo(
                id
            );

        } else {

            pageTitle.textContent =
                "Video Baru";


            statusInput.value =
                "draft";


            updateActionButtons();


            updateStatusUI();

        }


    } catch (error) {

        console.error(
            "Video editor init error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal memuat editor video.",
            "error"
        );

    }

}


init();
