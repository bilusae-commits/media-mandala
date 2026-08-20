import "./cms-service.js";

const CMS = window.MandalaCMS;


/* =====================================================
   ELEMENTS
===================================================== */

const form =
    document.getElementById("article-form");

const pageTitle =
    document.getElementById("page-title");

const articleId =
    document.getElementById("article-id");

const titleInput =
    document.getElementById("title");

const slugInput =
    document.getElementById("slug");

const excerptInput =
    document.getElementById("excerpt");

const contentInput =
    document.getElementById("content");

const coverInput =
    document.getElementById("cover_image_url");

const categoryInput =
    document.getElementById("category_id");

const featuredInput =
    document.getElementById("featured");

const statusInput =
    document.getElementById("status");

const statusHelp =
    document.getElementById("status-help");

const formMessage =
    document.getElementById("form-message");

const saveButton =
    document.getElementById("save-button");

const saveDraftButton =
    document.getElementById("save-draft-button");

const submitReviewButton =
    document.getElementById("submit-review-button");

const publishButton =
    document.getElementById("publish-button");

const archiveButton =
    document.getElementById("archive-button");

const logoutButton =
    document.getElementById("logout-button");

const publishedOption =
    document.getElementById("published-option");


/* =====================================================
   STATE
===================================================== */

let profile = null;

let currentArticle = null;

let slugManuallyEdited = false;


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "info"
) {

    if (!formMessage) return;

    formMessage.textContent =
        text;

    formMessage.dataset.type =
        type;
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
            "");
}


/* =====================================================
   AUTO SLUG
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
   ARTICLE ID
===================================================== */

function getArticleId() {

    return new URLSearchParams(
        window.location.search
    ).get("id");
}


/* =====================================================
   LOAD CATEGORIES
===================================================== */

async function loadCategories() {

    const data =
        await CMS.categories();


    categoryInput.innerHTML = `
        <option value="">
            -- Pilih Kategori --
        </option>

        ${(data || [])
            .map(
                category => `
                    <option value="${escapeHtml(category.id)}">
                        ${escapeHtml(category.name)}
                    </option>
                `
            )
            .join("")}
    `;
}


/* =====================================================
   LOAD ARTICLE
===================================================== */

async function loadArticle(id) {

    showMessage(
        "Memuat artikel..."
    );


    const data =
        await CMS.article(id);


    currentArticle =
        data;


    articleId.value =
        data.id || "";


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
        data.cover_image_url || "";


    categoryInput.value =
        data.category_id || "";


    featuredInput.checked =
        Boolean(data.featured);


    statusInput.value =
        data.status || "draft";


    pageTitle.textContent =
        "Edit Artikel";


    updateUI();


    showMessage(
        "Artikel berhasil dimuat.",
        "success"
    );
}


/* =====================================================
   FORM DATA
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

    const payload =
        getFormData();


    /*
     * STATUS
     */

    if (targetStatus) {

        payload.status =
            targetStatus;

    } else if (currentArticle) {

        payload.status =
            currentArticle.status;

    } else {

        payload.status =
            "draft";
    }


    /*
     * EDITOR
     */

    if (
        profile.role === "editor" &&
        payload.status === "published"
    ) {

        throw new Error(
            "Editor tidak dapat publish artikel."
        );
    }


    /*
     * AUTHOR
     */

    if (!currentArticle) {

        const user =
            await CMS.currentUser();


        if (!user) {

            throw new Error(
                "User tidak ditemukan."
            );
        }


        payload.author_id =
            user.id;
    }


    /*
     * PUBLISHED AT
     */

    if (
        payload.status === "published"
    ) {

        payload.published_at =
            currentArticle?.published_at ||
            new Date().toISOString();

    } else {

        payload.published_at =
            null;
    }


    showMessage(
        "Menyimpan..."
    );


    let result;


    if (currentArticle) {

        result =
            await CMS.updateArticle(
                currentArticle.id,
                payload
            );

    } else {

        result =
            await CMS.createArticle(
                payload
            );
    }


    currentArticle =
        result;


    articleId.value =
        result.id;


    pageTitle.textContent =
        "Edit Artikel";


    window.history.replaceState(
        {},
        "",
        `article-edit.html?id=${encodeURIComponent(
            result.id
        )}`
    );


    updateUI();


    showMessage(
        "Artikel berhasil disimpan.",
        "success"
    );


    return result;
}


/* =====================================================
   BUTTON STATE
===================================================== */

function updateUI() {

    const role =
        profile?.role;

    const status =
        currentArticle?.status ||
        statusInput?.value ||
        "draft";


    /*
     * Published option
     */

    if (publishedOption) {

        publishedOption.disabled =
            role !== "admin";
    }


    /*
     * STATUS HELP
     */

    if (statusHelp) {

        statusHelp.textContent =
            role === "admin"
                ? "Admin dapat mempublish artikel."
                : "Editor dapat membuat Draft/Review, tetapi tidak dapat publish.";
    }


    /*
     * DEFAULT
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
     * PUBLISHED
     */

    if (
        status === "published"
    ) {

        if (
            role === "editor"
        ) {

            [
                titleInput,
                slugInput,
                excerptInput,
                contentInput,
                coverInput,
                categoryInput,
                featuredInput,
                statusInput
            ].forEach(
                field => {

                    if (field) {
                        field.disabled = true;
                    }
                }
            );


            saveButton.style.display =
                "none";

            saveDraftButton.style.display =
                "none";

            submitReviewButton.style.display =
                "none";

            archiveButton.style.display =
                "none";

            publishButton.style.display =
                "none";

        } else {

            /*
             * Admin boleh edit
             */

            submitReviewButton.style.display =
                "none";
        }
    }


    /*
     * REVIEW
     */

    if (
        status === "review"
    ) {

        submitReviewButton.style.display =
            "none";
    }


    /*
     * EDITOR PUBLISH
     */

    if (
        role === "editor"
    ) {

        publishButton.style.display =
            "none";
    }
}


/* =====================================================
   SUBMIT
===================================================== */

form?.addEventListener(
    "submit",
    async event => {

        event.preventDefault();

        try {

            await save();

        } catch (error) {

            console.error(
                error
            );

            showMessage(
                error?.message ||
                "Gagal menyimpan artikel.",
                "error"
            );
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

submitReviewButton?.addEventListener(
    "click",
    async () => {

        try {

            await save(
                "review"
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
                    "Hanya Admin yang dapat publish artikel."
                );
            }


            await save(
                "published"
            );

        } catch (error) {

            showMessage(
                error?.message ||
                "Gagal publish artikel.",
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
                "archived"
            );

        } catch (error) {

            showMessage(
                error?.message ||
                "Gagal mengarsipkan artikel.",
                "error"
            );
        }
    }
);


/* =====================================================
   STATUS SELECT
===================================================== */

statusInput?.addEventListener(
    "change",
    () => {

        if (
            profile?.role === "editor" &&
            statusInput.value === "published"
        ) {

            statusInput.value =
                currentArticle?.status ||
                "draft";


            showMessage(
                "Editor tidak dapat memilih Published.",
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

            await CMS.logout();

        } catch (error) {

            console.error(
                "Logout error:",
                error
            );

            showMessage(
                error?.message ||
                "Gagal logout.",
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
            await CMS.requireStaff();


        if (!profile) {
            return;
        }


        await loadCategories();


        const id =
            getArticleId();


        if (id) {

            await loadArticle(id);

        } else {

            pageTitle.textContent =
                "Artikel Baru";

            statusInput.value =
                "draft";

            updateUI();

            showMessage(
                "Siap membuat artikel baru."
            );
        }


    } catch (error) {

        console.error(
            "Article editor init error:",
            error
        );

        showMessage(
            error?.message ||
            "Gagal membuka editor artikel.",
            "error"
        );
    }
}


init();
