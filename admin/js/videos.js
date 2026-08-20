import {
    getVideos,
    getCategories,
    deleteVideo,
    getCurrentAuth,
    logout
} from "./cms-service.js";


/* =====================================================
   ELEMENTS
===================================================== */

const container =
    document.getElementById("videos-container");

const message =
    document.getElementById("page-message");


/* =====================================================
   STATE
===================================================== */

let videos = [];
let categories = [];


/* =====================================================
   INIT
===================================================== */

async function init() {

    try {

        setMessage("Memuat video...");


        if (!container) {
            throw new Error(
                "Element #videos-container tidak ditemukan."
            );
        }


        /* AUTH */

        const auth =
            await getCurrentAuth();


        if (!auth?.authenticated) {

            window.location.href =
                "index.html";

            return;
        }


        /* DATA */

        const [
            loadedVideos,
            loadedCategories
        ] = await Promise.all([

            getVideos(),

            getCategories()

        ]);


        videos =
            Array.isArray(
                loadedVideos
            )
                ? loadedVideos
                : [];


        categories =
            Array.isArray(
                loadedCategories
            )
                ? loadedCategories
                : [];


        render();


        setMessage(
            videos.length
                ? `${videos.length} video`
                : "Belum ada video."
        );


    } catch (error) {

        console.error(
            "VIDEOS INIT ERROR:",
            error
        );


        renderError(
            error?.message ||
            "Gagal memuat video."
        );
    }
}


/* =====================================================
   RENDER
===================================================== */

function render() {

    if (!container) {
        return;
    }


    if (!videos.length) {

        container.innerHTML = `

            <div class="empty">

                <div
                    style="
                        font-size:14px;
                        font-weight:700;
                        margin-bottom:8px;
                    "
                >
                    Belum ada video
                </div>

                <div
                    style="
                        margin-bottom:18px;
                    "
                >
                    Belum ada video yang tersimpan.
                </div>

                <a
                    href="video-edit.html"
                    class="btn"
                >
                    + Video Baru
                </a>

            </div>

        `;

        return;
    }


    container.innerHTML = `

        <div class="table-wrapper">

            <table>

                <thead>

                    <tr>

                        <th>Thumbnail</th>

                        <th>Judul</th>

                        <th>Kategori</th>

                        <th>Status</th>

                        <th>Dibuat</th>

                        <th>Aksi</th>

                    </tr>

                </thead>


                <tbody>

                    ${videos
                        .map(
                            video =>
                                createRow(
                                    video
                                )
                        )
                        .join("")}

                </tbody>

            </table>

        </div>

    `;


    bindActions();
}


/* =====================================================
   CREATE ROW
===================================================== */

function createRow(video) {

    const category =
        categories.find(
            item =>
                item.id ===
                video.category_id
        );


    const thumbnail =
        video.thumbnail_url
            ? `

                <img
                    src="${escapeAttribute(
                        video.thumbnail_url
                    )}"
                    alt="${escapeAttribute(
                        video.title
                    )}"
                    style="
                        width:110px;
                        height:65px;
                        object-fit:cover;
                        border-radius:6px;
                        display:block;
                    "
                >

              `
            : `

                <div
                    style="
                        width:110px;
                        height:65px;
                        background:#eee;
                        display:flex;
                        align-items:center;
                        justify-content:center;
                        border-radius:6px;
                        color:#777;
                        font-size:10px;
                    "
                >
                    Tidak ada thumbnail
                </div>

              `;


    const featured =
        video.featured
            ? `
                <div
                    style="
                        margin-top:5px;
                        font-size:10px;
                        color:#b45309;
                    "
                >
                    ★ Video Unggulan
                </div>
              `
            : "";


    const status =
        String(
            video.status ||
            "draft"
        ).toLowerCase();


    return `

        <tr>

            <td>
                ${thumbnail}
            </td>


            <td>

                <div
                    class="video-title"
                >
                    ${escapeHtml(
                        video.title ||
                        "Tanpa judul"
                    )}
                </div>

                ${featured}

            </td>


            <td>
                ${escapeHtml(
                    category?.name ||
                    "-"
                )}
            </td>


            <td>

                <span
                    class="
                        status
                        status-${escapeAttribute(
                            status
                        )}
                    "
                >
                    ${escapeHtml(
                        formatStatus(
                            status
                        )
                    )}
                </span>

            </td>


            <td>
                ${formatDate(
                    video.created_at
                )}
            </td>


            <td>

                <div class="actions">

                    <a
                        class="action-link"
                        href="
                            video-edit.html?id=${encodeURIComponent(
                                video.id
                            )}
                        "
                    >
                        Edit
                    </a>


                    <button
                        type="button"
                        class="
                            action-button
                            danger
                        "
                        data-delete-video="${
                            escapeAttribute(
                                video.id
                            )
                        }"
                    >
                        Hapus
                    </button>

                </div>

            </td>

        </tr>

    `;
}


/* =====================================================
   ACTIONS
===================================================== */

function bindActions() {

    document
        .querySelectorAll(
            "[data-delete-video]"
        )
        .forEach(
            button => {

                button.addEventListener(
                    "click",
                    handleDelete
                );
            }
        );
}


/* =====================================================
   DELETE
===================================================== */

async function handleDelete(event) {

    const button =
        event.currentTarget;


    const id =
        button.dataset.deleteVideo;


    if (!id) {
        return;
    }


    const video =
        videos.find(
            item =>
                item.id === id
        );


    const title =
        video?.title ||
        "video ini";


    const confirmed =
        window.confirm(
            `Hapus "${title}"?`
        );


    if (!confirmed) {
        return;
    }


    try {

        button.disabled = true;

        button.textContent =
            "Menghapus...";


        await deleteVideo(id);


        videos =
            videos.filter(
                item =>
                    item.id !== id
            );


        render();


        setMessage(
            "Video berhasil dihapus."
        );


    } catch (error) {

        console.error(
            "DELETE VIDEO ERROR:",
            error
        );


        button.disabled =
            false;

        button.textContent =
            "Hapus";


        setMessage(
            error?.message ||
            "Gagal menghapus video."
        );
    }
}


/* =====================================================
   LOGOUT
===================================================== */

function bindLogout() {

    const logoutButton =
        document.getElementById(
            "logout"
        );


    if (!logoutButton) {
        return;
    }


    logoutButton.addEventListener(
        "click",
        async () => {

            try {

                logoutButton.disabled =
                    true;

                await logout();

            } catch (error) {

                console.error(
                    "LOGOUT ERROR:",
                    error
                );

                logoutButton.disabled =
                    false;

                setMessage(
                    error?.message ||
                    "Gagal keluar."
                );
            }
        }
    );
}


/* =====================================================
   ERROR
===================================================== */

function renderError(
    text
) {

    if (!container) {
        return;
    }


    container.innerHTML = `

        <div class="empty">

            <div
                style="
                    font-weight:700;
                    color:#b91c1c;
                    margin-bottom:8px;
                "
            >
                Gagal memuat video
            </div>

            <div>
                ${escapeHtml(text)}
            </div>

        </div>

    `;


    setMessage(
        "Terjadi kesalahan."
    );
}


/* =====================================================
   MESSAGE
===================================================== */

function setMessage(text) {

    if (!message) {
        return;
    }


    message.textContent =
        text || "";
}


/* =====================================================
   STATUS
===================================================== */

function formatStatus(
    status
) {

    const map = {

        draft:
            "Draft",

        review:
            "Review",

        published:
            "Published",

        archived:
            "Arsip"

    };


    return (
        map[status] ||
        status
    );
}


/* =====================================================
   DATE
===================================================== */

function formatDate(
    value
) {

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
   ESCAPE
===================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
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


function escapeAttribute(
    value
) {

    return escapeHtml(
        value
    );
}


/* =====================================================
   START
===================================================== */

bindLogout();

init();
