import {
    requireStaff,
    videos,
    deleteVideo,
    changeStatus,
    logout
} from "./cms-service.js";


/* =====================================================
   ELEMENTS
===================================================== */

const container =
    document.getElementById(
        "videos-container"
    );


const message =
    document.getElementById(
        "page-message"
    );


const newButton =
    document.getElementById(
        "new-video-button"
    );


const logoutButton =
    document.getElementById(
        "logout-button"
    );


/* =====================================================
   STATE
===================================================== */

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
   DATE
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

async function loadVideos() {

    try {

        showMessage(
            "Memuat video..."
        );


        const data =
            await videos();


        renderVideos(
            data
        );


        showMessage(
            `${data.length} video ditemukan.`
        );


    } catch (error) {

        console.error(
            "Load videos error:",
            error
        );


        showMessage(
            error.message ||
            "Gagal memuat video.",
            "error"
        );

    }

}


/* =====================================================
   RENDER
===================================================== */

function renderVideos(
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

                <p>
                    Belum ada video.
                </p>

                <button
                    type="button"
                    data-action="create"
                >
                    Buat Video Pertama
                </button>

            </div>

        `;


        return;
    }


    container.innerHTML = `

        <table>

            <thead>

                <tr>

                    <th>Video</th>

                    <th>Status</th>

                    <th>Kategori</th>

                    <th>Dibuat</th>

                    <th>Aksi</th>

                </tr>

            </thead>


            <tbody>

                ${data
                    .map(
                        video =>
                            renderRow(video)
                    )
                    .join("")
                }

            </tbody>

        </table>

    `;
}


/* =====================================================
   ROW
===================================================== */

function renderRow(
    video
) {

    const id =
        escapeHtml(
            video.id
        );


    const title =
        escapeHtml(
            video.title ||
            "Tanpa judul"
        );


    const status =
        video.status ||
        "draft";


    const category =
        escapeHtml(
            video.categories?.name ||
            "-"
        );


    const date =
        formatDate(
            video.created_at
        );


    const thumbnail =
        video.thumbnail_url
            ? `
                <img
                    src="${escapeHtml(
                        video.thumbnail_url
                    )}"
                    alt="${title}"
                    width="120"
                    loading="lazy"
                >
              `
            : "";


    const isPublished =
        status === "published";


    const isAdmin =
        profile?.role === "admin";


    let actions = "";


    /* =============================================
       EDIT
    ============================================= */

    if (
        isAdmin ||
        !isPublished
    ) {

        actions += `

            <a
                href="video-edit.html?id=${encodeURIComponent(
                    video.id
                )}"
            >
                Edit
            </a>

        `;

    }


    /* =============================================
       STATUS
    ============================================= */

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

        /* =========================================
           EDITOR
        ========================================= */

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


    /* =============================================
       DELETE
    ============================================= */

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

                <div>

                    ${thumbnail}

                    <strong>
                        ${title}
                    </strong>

                </div>

            </td>


            <td>

                ${escapeHtml(
                    statusLabel(
                        status
                    )
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
                "ID video tidak ditemukan."
            );
        }


        /* =========================================
           DELETE
        ========================================= */

        if (
            action === "delete"
        ) {

            const confirmed =
                window.confirm(
                    "Hapus video ini?"
                );


            if (!confirmed) {
                return;
            }


            await deleteVideo(
                id
            );


            showMessage(
                "Video berhasil dihapus.",
                "success"
            );


            await loadVideos();


            return;
        }


        /* =========================================
           PUBLISH
        ========================================= */

        if (
            action === "publish"
        ) {

            if (
                profile?.role !==
                "admin"
            ) {

                throw new Error(
                    "Hanya Admin yang dapat publish video."
                );
            }


            await changeStatus(
                "videos",
                id,
                "published"
            );


            showMessage(
                "Video berhasil dipublish.",
                "success"
            );


            await loadVideos();


            return;
        }


        /* =========================================
           REVIEW
        ========================================= */

        if (
            action === "review"
        ) {

            await changeStatus(
                "videos",
                id,
                "review"
            );


            showMessage(
                "Video dikirim ke status review.",
                "success"
            );


            await loadVideos();


            return;
        }


        /* =========================================
           ARCHIVE
        ========================================= */

        if (
            action === "archive"
        ) {

            await changeStatus(
                "videos",
                id,
                "archived"
            );


            showMessage(
                "Video berhasil diarsipkan.",
                "success"
            );


            await loadVideos();


            return;
        }

    } catch (error) {

        console.error(
            "Video action error:",
            error
        );


        showMessage(
            error.message ||
            "Operasi video gagal.",
            "error"
        );

    }

}


/* =====================================================
   CLICK
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
                "video-edit.html";

            return;
        }


        handleAction(
            action,
            id
        );

    }
);


/* =====================================================
   NEW VIDEO
===================================================== */

newButton?.addEventListener(
    "click",
    () => {

        window.location.href =
            "video-edit.html";

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


        await loadVideos();

    } catch (error) {

        console.error(
            "Videos init error:",
            error
        );

    }

}


init();
