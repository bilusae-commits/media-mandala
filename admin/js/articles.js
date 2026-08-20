import "./cms-service.js";

const CMS = window.MandalaCMS;

const container = document.getElementById("articles-container");
const message = document.getElementById("page-message");
const newButton = document.getElementById("new-article-button");
const logoutButton = document.getElementById("logout-button");

let profile = null;


/* =====================================================
   HELPERS
===================================================== */

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


function showMessage(text, type = "info") {
    if (!message) return;

    message.textContent = text;
    message.dataset.type = type;
}


function formatDate(value) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


function statusLabel(status) {
    const labels = {
        draft: "Draft",
        review: "Review",
        published: "Published",
        archived: "Archived"
    };

    return labels[status] || status || "-";
}


function statusClass(status) {
    const value = String(status || "draft").toLowerCase();

    if (
        ["draft", "review", "published", "archived"]
            .includes(value)
    ) {
        return value;
    }

    return "draft";
}


/* =====================================================
   LOAD
===================================================== */

async function loadArticles() {

    try {

        showMessage("Memuat artikel...");

        const data = await CMS.articles();

        renderArticles(data);

        showMessage(
            `${data.length} artikel ditemukan.`
        );

    } catch (error) {

        console.error(
            "Load articles error:",
            error
        );

        container.innerHTML = `
            <div class="empty">
                Gagal memuat artikel.
            </div>
        `;

        showMessage(
            error?.message ||
            "Gagal memuat artikel.",
            "error"
        );
    }
}


/* =====================================================
   RENDER
===================================================== */

function renderArticles(data) {

    if (!container) return;


    if (!data || data.length === 0) {

        container.innerHTML = `
            <div class="empty">

                <p>
                    Belum ada artikel.
                </p>

                <button
                    type="button"
                    data-action="create"
                >
                    + Buat Artikel Pertama
                </button>

            </div>
        `;

        return;
    }


    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>
                        <th>Artikel</th>
                        <th>Status</th>
                        <th>Kategori</th>
                        <th>Dibuat</th>
                        <th>Aksi</th>
                    </tr>

                </thead>

                <tbody>

                    ${data
                        .map(renderRow)
                        .join("")}

                </tbody>

            </table>

        </div>
    `;
}


/* =====================================================
   ROW
===================================================== */

function renderRow(article) {

    const id =
        escapeHtml(article.id);

    const title =
        escapeHtml(
            article.title ||
            "Tanpa judul"
        );

    const status =
        String(
            article.status ||
            "draft"
        ).toLowerCase();

    const category =
        escapeHtml(
            article.categories?.name ||
            "-"
        );

    const date =
        formatDate(
            article.created_at
        );

    const isAdmin =
        profile?.role === "admin";

    const isPublished =
        status === "published";


    let actions = "";


    /*
     * EDIT
     */

    if (
        isAdmin ||
        !isPublished
    ) {

        actions += `
            <a
                class="action-link"
                href="article-edit.html?id=${encodeURIComponent(
                    article.id
                )}"
            >
                Edit
            </a>
        `;
    }


    /*
     * ADMIN
     */

    if (isAdmin) {

        if (!isPublished) {

            actions += `
                <button
                    class="action-button"
                    type="button"
                    data-action="publish"
                    data-id="${id}"
                >
                    Publish
                </button>
            `;
        }


        if (isPublished) {

            actions += `
                <button
                    class="action-button"
                    type="button"
                    data-action="archive"
                    data-id="${id}"
                >
                    Arsipkan
                </button>
            `;

        } else if (status !== "review") {

            actions += `
                <button
                    class="action-button"
                    type="button"
                    data-action="review"
                    data-id="${id}"
                >
                    Review
                </button>
            `;
        }
    }


    /*
     * EDITOR
     */

    else {

        if (status === "draft") {

            actions += `
                <button
                    class="action-button"
                    type="button"
                    data-action="review"
                    data-id="${id}"
                >
                    Kirim Review
                </button>
            `;
        }


        if (status === "review") {

            actions += `
                <button
                    class="action-button"
                    type="button"
                    data-action="archive"
                    data-id="${id}"
                >
                    Arsipkan
                </button>
            `;
        }
    }


    /*
     * DELETE
     */

    if (!isPublished) {

        actions += `
            <button
                class="action-button danger"
                type="button"
                data-action="delete"
                data-id="${id}"
            >
                Hapus
            </button>
        `;
    }


    return `
        <tr>

            <td>
                <div class="article-title">
                    ${title}
                </div>
            </td>

            <td>
                <span
                    class="status status-${statusClass(status)}"
                >
                    ${escapeHtml(
                        statusLabel(status)
                    )}
                </span>
            </td>

            <td>
                ${category}
            </td>

            <td>
                ${date}
            </td>

            <td>
                <div class="actions">
                    ${actions}
                </div>
            </td>

        </tr>
    `;
}


/* =====================================================
   ACTIONS
===================================================== */

async function handleAction(
    action,
    id
) {

    if (!id) {
        showMessage(
            "ID artikel tidak ditemukan.",
            "error"
        );
        return;
    }


    try {

        if (action === "delete") {

            if (
                !window.confirm(
                    "Yakin ingin menghapus artikel ini?"
                )
            ) {
                return;
            }


            await CMS.deleteArticle(id);

            showMessage(
                "Artikel berhasil dihapus.",
                "success"
            );

            await loadArticles();

            return;
        }


        if (action === "publish") {

            if (
                profile?.role !== "admin"
            ) {
                throw new Error(
                    "Hanya Admin yang dapat publish artikel."
                );
            }


            await CMS.changeStatus(
                "articles",
                id,
                "published"
            );

            showMessage(
                "Artikel berhasil dipublish.",
                "success"
            );

            await loadArticles();

            return;
        }


        if (action === "review") {

            await CMS.changeStatus(
                "articles",
                id,
                "review"
            );

            showMessage(
                "Artikel dikirim ke review.",
                "success"
            );

            await loadArticles();

            return;
        }


        if (action === "archive") {

            await CMS.changeStatus(
                "articles",
                id,
                "archived"
            );

            showMessage(
                "Artikel berhasil diarsipkan.",
                "success"
            );

            await loadArticles();

            return;
        }

    } catch (error) {

        console.error(
            "Article action error:",
            error
        );

        showMessage(
            error?.message ||
            "Aksi gagal.",
            "error"
        );
    }
}


/* =====================================================
   EVENTS
===================================================== */

container?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );

        if (!button) return;

        const action =
            button.dataset.action;

        const id =
            button.dataset.id;


        if (action === "create") {

            window.location.href =
                "article-edit.html";

            return;
        }


        handleAction(
            action,
            id
        );
    }
);


newButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "article-edit.html";

    }
);


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

        await loadArticles();

    } catch (error) {

        console.error(
            "Articles init error:",
            error
        );

        showMessage(
            error?.message ||
            "Gagal membuka halaman artikel.",
            "error"
        );
    }
}


init();
