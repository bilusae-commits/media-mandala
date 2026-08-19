import {
    requireStaff,
    currentUser,
    currentProfile,
    article,
    createArticle,
    updateArticle,
    changeStatus,
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
        "article-form"
    );


const pageTitle =
    document.getElementById(
        "page-title"
    );


const articleId =
    document.getElementById(
        "article-id"
    );


const titleInput =
    document.getElementById(
        "title"
    );


const slugInput =
    document.getElementById(
        "slug"
    );


const excerptInput =
    document.getElementById(
        "excerpt"
    );


const contentInput =
    document.getElementById(
        "content"
    );


const coverInput =
    document.getElementById(
        "cover_image_url"
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

let currentArticle = null;


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
   AUTO SLUG
===================================================== */

let slugManuallyEdited = false;


slugInput?.addEventListener(
    "input",
    () => {

        slugManuallyEdited =
            true;

    }
);


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


/* =====================================================
   FORMAT STATUS
===================================================== */

function updateStatusUI() {

    const role =
        profile?.role;


    const status =
        statusInput?.value;


    /*
     * Editor tidak boleh publish.
     */

    if (
        role === "editor"
    ) {

        publishedOption.disabled =
            true;


        if (
            status === "published"
        ) {

            statusInput.value =
                "draft";

        }


        publishButton.style.display =
            "none";


        statusHelp.textContent =
            "Editor tidak memiliki hak untuk publish artikel.";

    } else {

        publishedOption.disabled =
            false;


        publishButton.style.display =
            "";


        statusHelp.textContent =
            "Admin dapat mempublish artikel.";

    }


    /*
     * Published article
     */

    if (
        currentArticle?.status ===
        "published"
    ) {

        if (
            role === "editor"
        ) {

            disableEditorForPublished();

        }

    }

}


/* =====================================================
   DISABLE EDITOR PUBLISHED
===================================================== */

function disableEditorForPublished() {

    if (
        profile?.role !== "editor"
    ) {
        return;
    }


    const fields = [

        titleInput,

        slugInput,

        excerptInput,

        contentInput,

        coverInput,

        categoryInput,

        featuredInput

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


    archiveButton.disabled =
        true;


    statusInput.disabled =
        true;


    showMessage(
        "Artikel sudah published. Editor tidak dapat mengubahnya.",
        "warning"
    );

}


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
   ESCAPE HTML
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
   GET ARTICLE ID
===================================================== */

function getArticleId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(
        "id"
    );
}


/* =====================================================
   LOAD ARTICLE
===================================================== */

async function loadArticle(
    id
) {

    if (!id) {
        return;
    }


    showMessage(
        "Memuat artikel..."
    );


    const data =
        await article(id);


    currentArticle =
        data;


    articleId.value =
        data.id;


    titleInput.value =
        data.title || "";


    slugInput.value =
        data.slug || "";


    slugManuallyEdited =
        true;


    excerptInput.value =
        data.excerpt || "";


    contentInput.value =
        data.content || "";


    coverInput.value =
        data.cover_image_url ||
        "";


    categoryInput.value =
        data.category_id ||
        "";


    featuredInput.checked =
        Boolean(
            data.featured
        );


    statusInput.value =
        data.status ||
        "draft";


    pageTitle.textContent =
        "Edit Artikel";


    updateActionButtons();


    updateStatusUI();


    showMessage(
        "Artikel berhasil dimuat."
    );

}


/* =====================================================
   GET FORM DATA
===================================================== */

function getFormData() {

    const title =
        titleInput.value.trim();


    const slug =
        slugInput.value.trim();


    if (!title) {

        throw new Error(
            "Judul wajib diisi."
        );
    }


    if (!slug) {

        throw new Error(
            "Slug wajib diisi."
        );
    }


    return {

        title,

        slug,

        excerpt:
            excerptInput.value.trim() ||
            null,

        content:
            contentInput.value.trim() ||
            null,

        cover_image_url:
            coverInput.value.trim() ||
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
         * Editor tidak boleh menentukan
         * published.
         */

        if (
            targetStatus ===
            "published" &&
            profile?.role !== "admin"
        ) {

            throw new Error(
                "Editor tidak dapat publish artikel."
            );
        }


        /*
         * Author selalu user login
         * saat membuat artikel.
         */

        if (
            !currentArticle
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
            currentArticle
        ) {

            /*
             * Saat edit biasa,
             * pertahankan status.
             */

            payload.status =
                currentArticle.status;

        } else {

            payload.status =
                "draft";

        }


        /*
         * published_at
         */

        if (
            payload.status ===
            "published"
        ) {

            /*
             * Jangan menimpa tanggal
             * publish yang sudah ada.
             */

            if (
                !currentArticle?.published_at
            ) {

                payload.published_at =
                    new Date().toISOString();

            }

        } else {

            /*
             * Konten belum published.
             */

            payload.published_at =
                null;

        }


        showMessage(
            "Menyimpan..."
        );


        let result;


        if (
            currentArticle
        ) {

            result =
                await updateArticle(
                    currentArticle.id,
                    payload
                );

        } else {

            result =
                await createArticle(
                    payload
                );

        }


        /*
         * Simpan hasil sebagai
         * current article.
         */

        currentArticle =
            result;


        articleId.value =
            result.id;


        pageTitle.textContent =
            "Edit Artikel";


        /*
         * Update URL supaya refresh
         * tidak membuat artikel baru.
         */

        const newUrl =
            `article-edit.html?id=${encodeURIComponent(result.id)}`;


        window.history.replaceState(
            {},
            "",
            newUrl
        );


        updateActionButtons();


        updateStatusUI();


        showMessage(
            "Artikel berhasil disimpan.",
            "success"
        );


        return result;


    } catch (error) {

        console.error(
            "Save article error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal menyimpan artikel.",
            "error"
        );


        throw error;
    }

}


/* =====================================================
   SAVE BUTTON
===================================================== */

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        try {

            await save();

        } catch {
            // Error sudah ditampilkan.
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
            // Error sudah ditampilkan.
        }

    }
);


/* =====================================================
   SUBMIT REVIEW
===================================================== */

submitReviewButton?.addEventListener(
    "click",
    async () => {

        try {

            await save(
                "review"
            );

        } catch {
            // Error sudah ditampilkan.
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
                    "Hanya Admin yang dapat publish artikel."
                );
            }


            await save(
                "published"
            );

        } catch {
            // Error sudah ditampilkan.
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
            // Error sudah ditampilkan.
        }

    }
);


/* =====================================================
   UPDATE BUTTONS
===================================================== */

function updateActionButtons() {

    const role =
        profile?.role;


    const status =
        currentArticle?.status ||
        "draft";


    /*
     * Default
     */

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

        } else {

            /*
             * Admin masih bisa
             * mengelola artikel.
             */

            submitReviewButton.style.display =
                "none";

        }

    }


    /*
     * Draft
     */

    if (
        status === "draft"
    ) {

        if (
            role === "editor"
        ) {

            publishButton.style.display =
                "none";

        }

    }


    /*
     * Review
     */

    if (
        status === "review"
    ) {

        submitReviewButton.style.display =
            "none";

    }

}


/* =====================================================
   STATUS CHANGE
===================================================== */

statusInput?.addEventListener(
    "change",
    () => {

        if (
            profile?.role ===
            "editor" &&
            statusInput.value ===
            "published"
        ) {

            statusInput.value =
                currentArticle?.status ||
                "draft";


            showMessage(
                "Editor tidak dapat memilih status Published.",
                "warning"
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

        /*
         * Auth + role
         */

        profile =
            await requireStaff();


        if (!profile) {
            return;
        }


        /*
         * Categories
         */

        await loadCategories();


        /*
         * Existing article
         */

        const id =
            getArticleId();


        if (id) {

            await loadArticle(
                id
            );

        } else {

            pageTitle.textContent =
                "Artikel Baru";


            statusInput.value =
                "draft";


            updateActionButtons();

            updateStatusUI();

        }


    } catch (error) {

        console.error(
            "Article editor init error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal memuat editor artikel.",
            "error"
        );

    }

}


init();
