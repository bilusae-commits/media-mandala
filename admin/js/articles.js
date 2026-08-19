import {
    requireStaff,
    articles,
    deleteArticle,
    changeStatus,
    logout
} from "./cms-service.js";


/* =====================================================
   ELEMENTS
===================================================== */

const container =
    document.getElementById(
        "articles-container"
    );


const message =
    document.getElementById(
        "page-message"
    );


const newButton =
    document.getElementById(
        "new-article-button"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );


let profile = null;


/* =====================================================
   MESSAGE
===================================================== */

function showMessage(
    text,
    type = "info"
) {

    if (!message) {
        return;
    }


    message.textContent =
        text;


    message.dataset.type =
        type;
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
   STATUS LABEL
===================================================== */

function statusLabel(status) {

    const labels = {

        draft:
            "Draft",

        review:
            "Review",

        published:
            "Published",

        archived:
            "Archived"

    };


    return (
        labels[status] ||
        status ||
        "-"
    );
}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(value) {

    if (!value) {
        return "-";
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "-";
    }


    return date.toLocaleDateString(
        "id-ID",
        {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }
    );
}


/* =====================================================
   LOAD
===================================================== */

async function loadArticles() {

    try {

        showMessage(
            "Memuat artikel..."
        );


        const data =
            await articles();


        renderArticles(
            data
        );


        showMessage(
            `${data.length} artikel ditemukan.`
        );


    } catch (error) {

        console.error(
            "Load articles error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal memuat artikel.",
            "error"
        );

    }

}


/* =====================================================
   RENDER
===================================================== */

function renderArticles(
    data
) {

    if (!container) {
        return;
    }


    if (
        !data ||
        data.length === 0
    ) {

        container.innerHTML = `
            <div>
                <p>Belum ada artikel.</p>

                <button
                    type="button"
                    data-action="create"
                >
                    Buat Artikel Pertama
                </button>
            </div>
        `;


        return;
    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>

                    <th>Judul</th>

                    <th>Status</th>

                    <th>Kategori</th>

                    <th>Dibuat</th>

                    <th>Aksi</th>

                </tr>

            </thead>


            <tbody>

                ${data.map(
                    article => renderRow(article)
                ).join("")}

            </tbody>

        </table>

    `;
}


/* =====================================================
   RENDER ROW
===================================================== */

function renderRow(
    article
) {

    const id =
        escapeHtml(
            article.id
        );


    const title =
        escapeHtml(
            article.title ||
            "Tanpa judul"
        );


    const status =
        article.status ||
        "draft";


    const category =
        escapeHtml(
            article.categories?.name ||
            "-"
        );


    const date =
        formatDate(
            article.created_at
        );


    const isPublished =
        status === "published";


    const isAdmin =
        profile?.role === "admin";


    let actions = "";


    /* ---------------------------------------------
       EDIT
    --------------------------------------------- */

    if (
        isAdmin ||
        !isPublished
    ) {

        actions += `

            <a
                href="article-edit.html?id=${encodeURIComponent(article.id)}"
            >
                Edit
            </a>

        `;
    }


    /* ---------------------------------------------
       STATUS
    --------------------------------------------- */

    if (isAdmin) {

        if (
            status !== "published"
        ) {

            actions += `

                <button
                    type="button"
                    data-action="publish"
                    data-id="${id}"
                >
                    Publish
                </button>

            `;
        }


        if (
            status === "published"
        ) {

            actions += `

                <button
                    type="button"
                    data-action="archive"
                    data-id="${id}"
                >
                    Arsipkan
                </button>

            `;

        } else if (
            status !== "review"
        ) {

            actions += `

                <button
                    type="button"
                    data-action="review"
                    data-id="${id}"
                >
                    Review
                </button>

            `;
        }

    } else {

        /*
         * EDITOR
         */

        if (
            status === "draft"
        ) {

            actions += `

                <button
                    type="button"
                    data-action="review"
                    data-id="${id}"
                >
                    Kirim Review
                </button>

            `;
        }


        if (
            status === "review"
        ) {

            actions += `

                <button
                    type="button"
                    data-action="archive"
                    data-id="${id}"
                >
                    Arsipkan
                </button>

            `;
        }

    }


    /* ---------------------------------------------
       DELETE
    --------------------------------------------- */

    if (
        !isPublished
    ) {

        actions += `

            <button
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
                <strong>
                    ${title}
                </strong>
            </td>

            <td>
                ${escapeHtml(
                    statusLabel(status)
                )}
            </td>

            <td>
                ${category}
            </td>

            <td>
                ${date}
            </td>

            <td>
                ${actions}
            </td>

        </tr>

    `;
}


/* =====================================================
   ACTION
===================================================== */

async function handleAction(
    action,
    id
) {

    try {

        if (!id) {

            throw new Error(
                "ID artikel tidak ditemukan."
            );
        }


        /* -----------------------------------------
           DELETE
        ----------------------------------------- */

        if (
            action === "delete"
        ) {

            const confirmed =
                window.confirm(
                    "Hapus artikel ini?"
                );


            if (!confirmed) {
                return;
            }


            await deleteArticle(
                id
            );


            showMessage(
                "Artikel berhasil dihapus."
            );


            await loadArticles();


            return;
        }


        /* -----------------------------------------
           PUBLISH
        ----------------------------------------- */

        if (
            action === "publish"
        ) {

            if (
                profile?.role !== "admin"
            ) {

                throw new Error(
                    "Hanya Admin yang dapat publish artikel."
                );
            }


            await changeStatus(
                "articles",
                id,
                "published"
            );


            showMessage(
                "Artikel berhasil dipublish."
            );


            await loadArticles();


            return;
        }


        /* -----------------------------------------
           REVIEW
        ----------------------------------------- */

        if (
            action === "review"
        ) {

            await changeStatus(
                "articles",
                id,
                "review"
            );


            showMessage(
                "Artikel dikirim ke status review."
            );


            await loadArticles();


            return;
        }


        /* -----------------------------------------
           ARCHIVE
        ----------------------------------------- */

        if (
            action === "archive"
        ) {

            await changeStatus(
                "articles",
                id,
                "archived"
            );


            showMessage(
                "Artikel berhasil diarsipkan."
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
            error.message ||
            "Operasi artikel gagal.",
            "error"
        );

    }

}


/* =====================================================
   CLICK HANDLER
===================================================== */

container?.addEventListener(
    "click",
    event => {

        const button =
            event.target.closest(
                "[data-action]"
            );


        if (!button) {
            return;
        }


        const action =
            button.dataset.action;


        const id =
            button.dataset.id;


        if (
            action === "create"
        ) {

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


/* =====================================================
   NEW ARTICLE
===================================================== */

newButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "article-edit.html";

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

        profile =
            await requireStaff();


        if (!profile) {
            return;
        }


        await loadArticles();

    } catch (error) {

        console.error(
            "Articles init error:",
            error
        );

    }

}


init();
